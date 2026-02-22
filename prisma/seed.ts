import { PrismaClient } from "../generated/prisma/index.js";
import { hash } from "bcryptjs";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN!;
const IMAGES_DIR = join(__dirname, "images");
const SEED_PREFIX = "seed-listings/";

// Purge existing seed images from S3
async function purgeS3SeedImages() {
  console.log("Purging existing seed images from S3...");

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: SEED_PREFIX,
    });

    const { Contents } = await s3Client.send(listCommand);

    if (!Contents || Contents.length === 0) {
      console.log("No seed images found to purge.");
      return;
    }

    for (const object of Contents) {
      if (object.Key) {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: object.Key,
        });
        await s3Client.send(deleteCommand);
        console.log(`Deleted: ${object.Key}`);
      }
    }

    console.log(`Purged ${Contents.length} seed images from S3.`);
  } catch (error: any) {
    if (error.Code === "AccessDenied") {
      console.warn("⚠️  S3 ListBucket permission denied. Skipping purge. Images will be overwritten.");
    } else {
      console.error("Error purging seed images:", error);
      throw error;
    }
  }
}

// Upload images to S3 and return URLs
async function uploadImagesToS3(): Promise<Record<string, string>> {
  console.log("Uploading seed images to S3...");

  const uploadedImages: Record<string, string> = {};

  try {
    const files = readdirSync(IMAGES_DIR).filter(
      (file) => file.endsWith(".jpeg") || file.endsWith(".jpg") || file.endsWith(".png")
    );

    for (const file of files) {
      const filePath = join(IMAGES_DIR, file);
      const fileContent = readFileSync(filePath);
      const key = `${SEED_PREFIX}${file}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileContent,
        ContentType: file.endsWith(".png") ? "image/png" : "image/jpeg",
      });

      await s3Client.send(command);

      const publicUrl = `https://${CLOUDFRONT_DOMAIN}/${key}`;
      uploadedImages[file] = publicUrl;

      console.log(`Uploaded: ${file} -> ${publicUrl}`);
    }

    console.log(`\nUploaded ${Object.keys(uploadedImages).length} images successfully!`);
    return uploadedImages;
  } catch (error) {
    console.error("Error uploading images:", error);
    throw error;
  }
}

async function main() {
  console.log("Starting seed...");

  // Step 1: Purge and upload images to S3
  await purgeS3SeedImages();
  const imageUrls = await uploadImagesToS3();

  // Step 2: Clear existing data (order matters due to FK constraints)
  await prisma.review.deleteMany();
  await prisma.platformPrice.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user and regular users
  const password = await hash("password123", 12);

  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@abc.com",
        password,
      },
    }),
    prisma.user.create({
      data: {
        name: "Alex Chen",
        email: "alex@example.com",
        password,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Martinez",
        email: "sarah@example.com",
        password,
      },
    }),
    prisma.user.create({
      data: {
        name: "Marcus Johnson",
        email: "marcus@example.com",
        password,
      },
    }),
    prisma.user.create({
      data: {
        name: "Emma Thompson",
        email: "emma@example.com",
        password,
      },
    }),
    prisma.user.create({
      data: {
        name: "David Lee",
        email: "david@example.com",
        password,
      },
    }),
  ]);

  console.log(`Created ${users.length} users (including admin@abc.com)`);

  // Create vinyl listings with realistic data
  const listings = await Promise.all([
    // User 1 listings (Alex Chen)
    prisma.listing.create({
      data: {
        title: "Abbey Road",
        artist: "The Beatles",
        description:
          "Classic Beatles album in excellent condition. Original UK pressing from 1969. Gatefold sleeve with original inserts. Vinyl plays perfectly with minimal surface noise.",
        type: "VINYL",
        condition: "LIGHTLY_USED",
        price: 89.99,
        year: 1969,
        genre: "Rock",
        label: "Apple Records",
        isVerified: true,
        verifiedByOfficial: true,
        authenticityScore: 98.5,
        verificationSource: "Discogs Authentication Services",
        labelMatchScore: 100,
        matrixNumberScore: 100,
        typographyScore: 95,
        serialRangeScore: 99,
        authenticityNotes: "Label, pressing, and matrix details match known Beatles originals.",
        conditionScore: 98,
        vinylSurfaceScore: 100,
        sleeveScore: 100,
        labelConditionScore: 100,
        edgesScore: 92,
        conditionNotes: "Sleeve and label look clean. No visible warping, scuffs, or ring wear detected.",
        sellerId: users[0]!.id,
        images: JSON.stringify([imageUrls["abbey-road.jpeg"]]),
        imageUrl: imageUrls["abbey-road.jpeg"],
        priceLabel: "UNDERPRICED",
        pricePercentage: 11.5,
        priceDataUpdated: new Date("2025-01-25"),
        createdAt: new Date("2025-02-22T10:00:00Z"), // Listings with images get recent timestamps
      },
    }),
    prisma.listing.create({
      data: {
        title: "Kind of Blue",
        artist: "Miles Davis",
        description:
          "Iconic jazz masterpiece. 1959 original pressing on Columbia Records. Cover shows some wear but vinyl is in great shape. A must-have for any jazz collection.",
        type: "VINYL",
        condition: "WELL_USED",
        price: 125.00,
        year: 1959,
        genre: "Jazz",
        label: "Columbia",
        isVerified: true,
        verifiedByOfficial: false,
        authenticityScore: 92.3,
        labelMatchScore: 98,
        matrixNumberScore: 95,
        typographyScore: 88,
        serialRangeScore: 89,
        authenticityNotes: "Matrix number and label details consistent with 1959 Columbia pressings. Minor typography variations noted.",
        conditionScore: 85,
        vinylSurfaceScore: 90,
        sleeveScore: 78,
        labelConditionScore: 88,
        edgesScore: 84,
        conditionNotes: "Cover shows moderate wear and creasing. Vinyl surface has light surface marks but plays well.",
        sellerId: users[0]!.id,
        images: JSON.stringify([
          imageUrls["kind-of-blue-1.jpeg"],
          imageUrls["kind-of-blue-2.jpeg"],
          imageUrls["kind-of-blue-3.jpeg"],
          imageUrls["kind-of-blue-4.jpeg"],
        ]),
        imageUrl: imageUrls["kind-of-blue-1.jpeg"],
        priceLabel: "FAIR",
        pricePercentage: 2.5,
        priceDataUpdated: new Date("2025-01-15"),
        createdAt: new Date("2025-02-22T09:50:00Z"),
      },
    }),

    // User 2 listings (Sarah Martinez)
    prisma.listing.create({
      data: {
        title: "Rumours",
        artist: "Fleetwood Mac",
        description:
          "1977 first pressing. One of the best-selling albums of all time. Near mint condition, barely played. Includes original inner sleeve with lyrics.",
        type: "VINYL",
        condition: "LIKE_NEW",
        price: 65.50,
        year: 1977,
        genre: "Rock",
        label: "Warner Bros.",
        isVerified: true,
        authenticityScore: 95.8,
        labelMatchScore: 98,
        matrixNumberScore: 96,
        typographyScore: 94,
        serialRangeScore: 95,
        authenticityNotes: "First pressing details verified. Label and typography match 1977 Warner Bros. standards.",
        conditionScore: 96,
        vinylSurfaceScore: 98,
        sleeveScore: 95,
        labelConditionScore: 97,
        edgesScore: 94,
        conditionNotes: "Near mint condition. Vinyl surface is pristine with minimal handling marks.",
        sellerId: users[1]!.id,
        images: JSON.stringify([imageUrls["rumours.jpeg"]]),
        imageUrl: imageUrls["rumours.jpeg"],
        priceLabel: "UNDERPRICED",
        pricePercentage: 18.3,
        priceDataUpdated: new Date("2025-01-20"),
        createdAt: new Date("2025-02-22T09:40:00Z"),
      },
    }),
    prisma.listing.create({
      data: {
        title: "The Dark Side of the Moon",
        artist: "Pink Floyd",
        description:
          "Legendary progressive rock album. Original 1973 UK pressing with poster and stickers. Vinyl in excellent condition. Sound quality is superb.",
        type: "VINYL",
        condition: "LIGHTLY_USED",
        price: 110.00,
        year: 1973,
        genre: "Progressive Rock",
        label: "Harvest",
        isVerified: true,
        verifiedByOfficial: true,
        authenticityScore: 97.2,
        verificationSource: "Vinyl Authenticators Inc.",
        labelMatchScore: 99,
        matrixNumberScore: 98,
        typographyScore: 96,
        serialRangeScore: 96,
        authenticityNotes: "Original UK pressing verified. All inserts and poster present. Matrix details match 1973 Harvest pressings.",
        conditionScore: 93,
        vinylSurfaceScore: 95,
        sleeveScore: 92,
        labelConditionScore: 94,
        edgesScore: 91,
        conditionNotes: "Lightly used with excellent sound quality. Minor sleeve wear consistent with age.",
        sellerId: users[1]!.id,
        images: JSON.stringify([imageUrls["dark-side-of-moon.jpeg"]]),
        imageUrl: imageUrls["dark-side-of-moon.jpeg"],
        priceLabel: "OVERPRICED",
        pricePercentage: 22.7,
        priceDataUpdated: new Date("2025-01-18"),
        createdAt: new Date("2025-02-22T09:30:00Z"),
      },
    }),

    // User 3 listings (Marcus Johnson)
    prisma.listing.create({
      data: {
        title: "Purple Rain",
        artist: "Prince and The Revolution",
        description:
          "Classic 1984 album with the original poster insert. Vinyl has been well cared for. Some minor shelf wear on the cover but overall great condition.",
        type: "VINYL",
        condition: "WELL_USED",
        price: 45.00,
        year: 1984,
        genre: "Pop/Rock",
        label: "Warner Bros.",
        isVerified: false,
        authenticityScore: 88.5,
        labelMatchScore: 92,
        matrixNumberScore: 88,
        typographyScore: 86,
        serialRangeScore: 88,
        authenticityNotes: "1984 pressing indicators present. Label design matches Warner Bros. period. Some minor inconsistencies in matrix area.",
        conditionScore: 82,
        vinylSurfaceScore: 85,
        sleeveScore: 78,
        labelConditionScore: 84,
        edgesScore: 81,
        conditionNotes: "Well used with minor shelf wear. Vinyl plays well with some surface noise on a few tracks.",
        sellerId: users[2]!.id,
        images: JSON.stringify([imageUrls["purple-rain.jpeg"]]),
        imageUrl: imageUrls["purple-rain.jpeg"],
        priceLabel: "FAIR",
        pricePercentage: 4.2,
        priceDataUpdated: new Date("2025-01-22"),
        createdAt: new Date("2025-02-22T09:20:00Z"),
      },
    }),
    prisma.listing.create({
      data: {
        title: "Thriller",
        artist: "Michael Jackson",
        description:
          "Best-selling album of all time! 1982 original pressing. Cover has some wear but vinyl plays great. All-time classic pop album in good collectible condition.",
        type: "VINYL",
        condition: "WELL_USED",
        price: 38.99,
        year: 1982,
        genre: "Pop",
        label: "Epic",
        isVerified: true,
        authenticityScore: 91.0,
        labelMatchScore: 94,
        matrixNumberScore: 90,
        typographyScore: 89,
        serialRangeScore: 91,
        authenticityNotes: "1982 Epic Records pressing verified. Label details and typography match original release specifications.",
        conditionScore: 84,
        vinylSurfaceScore: 88,
        sleeveScore: 80,
        labelConditionScore: 86,
        edgesScore: 82,
        conditionNotes: "Cover shows age-appropriate wear. Vinyl surface in good condition with minimal impact on playback.",
        sellerId: users[2]!.id,
        images: JSON.stringify([imageUrls["thriller.jpeg"]]),
        imageUrl: imageUrls["thriller.jpeg"],
        priceLabel: "UNDERPRICED",
        pricePercentage: 12.8,
        priceDataUpdated: new Date("2025-01-19"),
        createdAt: new Date("2025-02-22T09:10:00Z"),
      },
    }),

    // User 4 listings (Emma Thompson)
    prisma.listing.create({
      data: {
        title: "Blue",
        artist: "Joni Mitchell",
        description:
          "Folk masterpiece from 1971. Gatefold cover in excellent condition. Vinyl is clean with very minimal surface noise. One of the greatest albums ever made.",
        type: "VINYL",
        condition: "LIGHTLY_USED",
        price: 75.00,
        year: 1971,
        genre: "Folk",
        label: "Reprise",
        isVerified: true,
        verifiedByOfficial: true,
        authenticityScore: 96.5,
        verificationSource: "Professional Vinyl Grading (PVG)",
        labelMatchScore: 97,
        matrixNumberScore: 96,
        typographyScore: 96,
        serialRangeScore: 97,
        authenticityNotes: "1971 Reprise pressing confirmed by PVG. All authenticity markers present and verified.",
        conditionScore: 94,
        vinylSurfaceScore: 96,
        sleeveScore: 93,
        labelConditionScore: 95,
        edgesScore: 92,
        conditionNotes: "Gatefold cover in excellent condition. Vinyl surface clean with minimal noise.",
        sellerId: users[3]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Blue"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Blue",
        priceLabel: "FAIR",
        pricePercentage: 3.1,
        priceDataUpdated: new Date("2025-01-17"),
        createdAt: new Date("2025-02-15T10:00:00Z"), // Older listings without images
      },
    }),
    prisma.listing.create({
      data: {
        title: "The Velvet Underground & Nico",
        artist: "The Velvet Underground",
        description:
          "Iconic 1967 album with the famous Andy Warhol banana cover. Second pressing from 1970s. Highly sought after by collectors. Cover shows age but vinyl plays well.",
        type: "VINYL",
        condition: "WELL_USED",
        price: 195.00,
        year: 1967,
        genre: "Art Rock",
        label: "Verve",
        isVerified: true,
        authenticityScore: 89.2,
        labelMatchScore: 90,
        matrixNumberScore: 88,
        typographyScore: 88,
        serialRangeScore: 91,
        authenticityNotes: "Second pressing from 1970s verified. Warhol banana cover design authentic. Some expected aging indicators.",
        conditionScore: 79,
        vinylSurfaceScore: 82,
        sleeveScore: 75,
        labelConditionScore: 80,
        edgesScore: 79,
        conditionNotes: "Cover shows age-appropriate wear. Vinyl plays well despite surface marks.",
        sellerId: users[3]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Velvet+Underground"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Velvet+Underground",
        priceLabel: "OVERPRICED",
        pricePercentage: 35.4,
        priceDataUpdated: new Date("2025-01-14"),
        createdAt: new Date("2025-02-14T10:00:00Z"),
      },
    }),
    prisma.listing.create({
      data: {
        title: "Nevermind",
        artist: "Nirvana",
        description:
          "Grunge classic from 1991. First pressing with original track listing. Includes lyric sheet. Vinyl has some light scratches but plays through without skipping.",
        type: "VINYL",
        condition: "WELL_USED",
        price: 55.00,
        year: 1991,
        genre: "Grunge/Rock",
        label: "DGC",
        isVerified: false,
        authenticityScore: 87.8,
        labelMatchScore: 89,
        matrixNumberScore: 86,
        typographyScore: 87,
        serialRangeScore: 89,
        authenticityNotes: "First pressing indicators present. DGC label matches 1991 specifications. Minor wear typical of era.",
        conditionScore: 81,
        vinylSurfaceScore: 79,
        sleeveScore: 82,
        labelConditionScore: 82,
        edgesScore: 81,
        conditionNotes: "Light scratches visible but plays without skipping. Lyric sheet included.",
        sellerId: users[3]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Nevermind"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Nevermind",
        priceLabel: "UNDERPRICED",
        pricePercentage: 8.6,
        priceDataUpdated: new Date("2025-01-21"),
        createdAt: new Date("2025-02-13T10:00:00Z"),
      },
    }),

    // User 5 listings (David Lee)
    prisma.listing.create({
      data: {
        title: "What's Going On",
        artist: "Marvin Gaye",
        description:
          "Soul masterpiece from 1971. Original Tamla pressing. Gatefold cover with minimal wear. Vinyl is clean and plays beautifully. Essential soul collection piece.",
        type: "VINYL",
        condition: "LIGHTLY_USED",
        price: 95.00,
        year: 1971,
        genre: "Soul/R&B",
        label: "Tamla",
        isVerified: true,
        verifiedByOfficial: false,
        authenticityScore: 94.1,
        labelMatchScore: 95,
        matrixNumberScore: 93,
        typographyScore: 94,
        serialRangeScore: 94,
        authenticityNotes: "Original 1971 Tamla pressing confirmed. All authenticity markers match Motown standards.",
        conditionScore: 92,
        vinylSurfaceScore: 94,
        sleeveScore: 90,
        labelConditionScore: 93,
        edgesScore: 91,
        conditionNotes: "Gatefold cover with minimal wear. Vinyl plays beautifully with clean sound.",
        sellerId: users[4]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Whats+Going+On"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Whats+Going+On",
        priceLabel: "FAIR",
        pricePercentage: 1.9,
        priceDataUpdated: new Date("2025-01-23"),
        createdAt: new Date("2025-02-12T10:00:00Z"),
      },
    }),
    prisma.listing.create({
      data: {
        title: "OK Computer",
        artist: "Radiohead",
        description:
          "Modern classic from 1997. First UK pressing. Double LP in gatefold sleeve. Vinyl is in near-perfect condition with only a few plays. Cover is pristine.",
        type: "VINYL",
        condition: "LIKE_NEW",
        price: 85.00,
        year: 1997,
        genre: "Alternative Rock",
        label: "Parlophone",
        isVerified: true,
        authenticityScore: 96.8,
        labelMatchScore: 98,
        matrixNumberScore: 96,
        typographyScore: 96,
        serialRangeScore: 97,
        authenticityNotes: "First UK pressing verified. Parlophone label details and matrix numbers match 1997 release.",
        conditionScore: 97,
        vinylSurfaceScore: 99,
        sleeveScore: 96,
        labelConditionScore: 97,
        edgesScore: 96,
        conditionNotes: "Near-perfect condition. Gatefold sleeve pristine, vinyl shows minimal play.",
        sellerId: users[4]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=OK+Computer"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=OK+Computer",
        priceLabel: "UNDERPRICED",
        pricePercentage: 15.7,
        priceDataUpdated: new Date("2025-01-16"),
        createdAt: new Date("2025-02-11T10:00:00Z"),
      },
    }),
    prisma.listing.create({
      data: {
        title: "Random Access Memories",
        artist: "Daft Punk",
        description:
          "2013 electronic masterpiece. Limited edition double LP. Pristine mint condition, still in shrink wrap. Never played. Perfect for collectors.",
        type: "VINYL",
        condition: "BRAND_NEW",
        price: 120.00,
        year: 2013,
        genre: "Electronic",
        label: "Columbia",
        isVerified: true,
        verifiedByOfficial: true,
        authenticityScore: 99.5,
        labelMatchScore: 100,
        matrixNumberScore: 99,
        typographyScore: 100,
        serialRangeScore: 99,
        authenticityNotes: "Limited edition 2013 pressing in pristine condition. All authenticity markers perfect. Still in original shrink wrap.",
        conditionScore: 100,
        vinylSurfaceScore: 100,
        sleeveScore: 100,
        labelConditionScore: 100,
        edgesScore: 100,
        conditionNotes: "Brand new, never played. Mint condition in all aspects.",
        sellerId: users[4]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Random+Access"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Random+Access",
        priceLabel: "OVERPRICED",
        pricePercentage: 28.2,
        priceDataUpdated: new Date("2025-01-12"),
        createdAt: new Date("2025-02-10T10:00:00Z"),
      },
    }),

    // Extra listing for Emma Thompson (so she can get a 4th review)
    prisma.listing.create({
      data: {
        title: "Blonde on Blonde",
        artist: "Bob Dylan",
        description:
          "1966 double LP original pressing. One of Dylan's finest. Cover shows some wear but the vinyl plays beautifully. Includes original gatefold.",
        type: "VINYL",
        condition: "WELL_USED",
        price: 80.00,
        year: 1966,
        genre: "Folk Rock",
        label: "Columbia",
        isVerified: false,
        sellerId: users[4]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Blonde+on+Blonde"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Blonde+on+Blonde",
        priceLabel: "UNDERPRICED",
        pricePercentage: 9.3,
        priceDataUpdated: new Date("2025-01-24"),
        createdAt: new Date("2025-02-09T10:00:00Z"),
      },
    }),

    // Add a few CD and merch listings
    prisma.listing.create({
      data: {
        title: "In Rainbows",
        artist: "Radiohead",
        description:
          "Special edition CD with bonus disc. Includes booklet and artwork. CD is in perfect condition. 2007 release.",
        type: "CD",
        condition: "LIKE_NEW",
        price: 25.00,
        year: 2007,
        genre: "Alternative Rock",
        label: "XL Recordings",
        isVerified: false,
        authenticityScore: 90.5,
        labelMatchScore: 92,
        matrixNumberScore: 90,
        typographyScore: 89,
        serialRangeScore: 91,
        authenticityNotes: "Special edition 2007 release verified. Includes bonus disc and all original materials.",
        conditionScore: 93,
        vinylSurfaceScore: 95,
        sleeveScore: 92,
        labelConditionScore: 93,
        edgesScore: 92,
        conditionNotes: "CD in perfect condition. Booklet and artwork intact.",
        sellerId: users[0]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=In+Rainbows+CD"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=In+Rainbows+CD",
        priceLabel: "FAIR",
        pricePercentage: 5.2,
        priceDataUpdated: new Date("2025-01-13"),
        createdAt: new Date("2025-02-08T10:00:00Z"),
      },
    }),
    prisma.listing.create({
      data: {
        title: "Beatles Vintage Band T-Shirt",
        artist: "The Beatles",
        description:
          "Original 1990s vintage Beatles t-shirt. Size Large. Some fading but no holes or tears. Rare collectible merchandise from the Anthology era.",
        type: "MERCH",
        condition: "HEAVILY_USED",
        price: 45.00,
        year: 1995,
        genre: "Rock",
        isVerified: false,
        sellerId: users[2]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Beatles+Shirt"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Beatles+Shirt",
        priceLabel: "OVERPRICED",
        pricePercentage: 18.9,
        priceDataUpdated: new Date("2025-01-11"),
        createdAt: new Date("2025-02-07T10:00:00Z"),
      },
    }),
  ]);

  console.log(`Created ${listings.length} listings`);

  // Create platform prices for price comparison
  const platformPrices = await Promise.all([
    // Abbey Road (listings[0]) - $89.99 - UNDERPRICED
    prisma.platformPrice.create({
      data: {
        platform: "Discogs",
        minPrice: 95,
        maxPrice: 135,
        priceLabel: "Fair",
        listingId: listings[0]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "eBay",
        minPrice: 110,
        maxPrice: 160,
        priceLabel: "Slightly High",
        listingId: listings[0]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "Cadence",
        avgPrice: 89.99,
        priceLabel: "Optimal",
        listingId: listings[0]!.id,
      },
    }),

    // Kind of Blue (listings[1]) - $125.00 - FAIR
    prisma.platformPrice.create({
      data: {
        platform: "Discogs",
        minPrice: 120,
        maxPrice: 180,
        priceLabel: "Fair",
        listingId: listings[1]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "eBay",
        minPrice: 115,
        maxPrice: 155,
        priceLabel: "Fair",
        listingId: listings[1]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "Cadence",
        avgPrice: 125.00,
        priceLabel: "Optimal",
        listingId: listings[1]!.id,
      },
    }),

    // Rumours (listings[2]) - $65.50 - UNDERPRICED
    prisma.platformPrice.create({
      data: {
        platform: "Discogs",
        minPrice: 75,
        maxPrice: 95,
        priceLabel: "Fair",
        listingId: listings[2]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "eBay",
        minPrice: 80,
        maxPrice: 110,
        priceLabel: "Slightly High",
        listingId: listings[2]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "Cadence",
        avgPrice: 65.50,
        priceLabel: "Optimal",
        listingId: listings[2]!.id,
      },
    }),

    // Dark Side of the Moon (listings[3]) - $110.00 - OVERPRICED
    prisma.platformPrice.create({
      data: {
        platform: "Discogs",
        minPrice: 80,
        maxPrice: 100,
        priceLabel: "Fair",
        listingId: listings[3]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "eBay",
        minPrice: 85,
        maxPrice: 95,
        priceLabel: "Fair",
        listingId: listings[3]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "Cadence",
        avgPrice: 110.00,
        priceLabel: "High",
        listingId: listings[3]!.id,
      },
    }),

    // Purple Rain (listings[4]) - $45.00 - FAIR
    prisma.platformPrice.create({
      data: {
        platform: "Discogs",
        minPrice: 40,
        maxPrice: 55,
        priceLabel: "Fair",
        listingId: listings[4]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "eBay",
        minPrice: 42,
        maxPrice: 50,
        priceLabel: "Fair",
        listingId: listings[4]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "Cadence",
        avgPrice: 45.00,
        priceLabel: "Optimal",
        listingId: listings[4]!.id,
      },
    }),

    // Thriller (listings[5]) - $38.99 - UNDERPRICED
    prisma.platformPrice.create({
      data: {
        platform: "Discogs",
        minPrice: 42,
        maxPrice: 58,
        priceLabel: "Fair",
        listingId: listings[5]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "eBay",
        minPrice: 45,
        maxPrice: 65,
        priceLabel: "Slightly High",
        listingId: listings[5]!.id,
      },
    }),
    prisma.platformPrice.create({
      data: {
        platform: "Cadence",
        avgPrice: 38.99,
        priceLabel: "Optimal",
        listingId: listings[5]!.id,
      },
    }),
  ]);

  console.log(`Created ${platformPrices.length} platform price entries`);

  // listings[0]  = Abbey Road         (seller: users[0] Admin)
  // listings[1]  = Kind of Blue       (seller: users[0] Admin)
  // listings[2]  = Rumours            (seller: users[1] Alex)
  // listings[3]  = Dark Side of Moon  (seller: users[1] Alex)
  // listings[4]  = Purple Rain        (seller: users[2] Sarah)
  // listings[5]  = Thriller           (seller: users[2] Sarah)
  // listings[6]  = Blue               (seller: users[3] Marcus)
  // listings[7]  = Velvet Underground (seller: users[3] Marcus)
  // listings[8]  = Nevermind          (seller: users[3] Marcus)
  // listings[9]  = What's Going On    (seller: users[4] Emma)
  // listings[10] = OK Computer        (seller: users[4] Emma)
  // listings[11] = Random Access Mem  (seller: users[4] Emma)
  // listings[12] = Blonde on Blonde   (seller: users[4] Emma)
  // listings[13] = In Rainbows CD     (seller: users[0] Admin)
  // listings[14] = Beatles Shirt      (seller: users[2] Sarah)

  // Seed reviews — buyers review sellers after a transaction
  // Reviews for Alex Chen (users[1]) — seller of Rumours and Dark Side
  // Reviews for Sarah Martinez (users[2]) — seller of Purple Rain and Thriller
  // Reviews for Emma Thompson (users[4]) — seller of OK Computer and RAM
  // Reviews for David Lee (users[5]) — no listings yet, skip
  const reviews = await Promise.all([
    // Reviews on Alex Chen (users[1]) — sellers of listings[2] and listings[3]
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Super smooth transaction! The vinyl was exactly as described — near mint. Came well packed too. Would definitely buy from Alex again!",
        sellerId: users[1]!.id,
        reviewerId: users[3]!.id, // Marcus reviews Alex
        listingId: listings[2]!.id, // Rumours listing
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Incredible copy of Dark Side of the Moon. Came with all the inserts. Fast shipping and very communicative seller. Highly recommended!",
        sellerId: users[1]!.id,
        reviewerId: users[4]!.id, // Emma reviews Alex
        listingId: listings[3]!.id, // Dark Side of Moon listing
      },
    }),

    // Reviews on Sarah Martinez (users[2]) — sellers of listings[4] and listings[5]
    prisma.review.create({
      data: {
        rating: 4,
        comment: "Good seller, item was as described. Purple Rain vinyl plays great. Minor cover wear was slightly more than photos showed but still happy with it.",
        sellerId: users[2]!.id,
        reviewerId: users[1]!.id, // Alex reviews Sarah
        listingId: listings[4]!.id, // Purple Rain listing
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Absolutely love this Thriller pressing. Sarah was quick to respond and the item arrived in perfect condition. Great seller!",
        sellerId: users[2]!.id,
        reviewerId: users[5]!.id, // David reviews Sarah
        listingId: listings[5]!.id, // Thriller listing
      },
    }),

    // Reviews on Marcus Johnson (users[3]) — sellers of listings[6], [7], [8]
    prisma.review.create({
      data: {
        rating: 5,
        comment: "What a gem! Joni Mitchell Blue in lightly used condition is everything. Marcus described everything accurately and was easy to deal with.",
        sellerId: users[3]!.id,
        reviewerId: users[2]!.id, // Sarah reviews Marcus
        listingId: listings[6]!.id, // Blue listing
      },
    }),
    prisma.review.create({
      data: {
        rating: 3,
        comment: "Took a while to ship but the record arrived safely. VU & Nico sounds great, condition is fair as described. Communication could have been better.",
        sellerId: users[3]!.id,
        reviewerId: users[4]!.id, // Emma reviews Marcus
        listingId: listings[7]!.id, // Velvet Underground listing
      },
    }),

    // Reviews on Emma Thompson (users[4]) — sellers of listings[9], [10], [11]
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Sealed, brand new, and delivered super fast. Emma was a pleasure to deal with — very responsive. Random Access Memories sounds absolutely stunning!",
        sellerId: users[4]!.id,
        reviewerId: users[1]!.id, // Alex reviews Emma
        listingId: listings[11]!.id, // Random Access Memories listing
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "OK Computer first pressing — this is exactly what I was after. Great condition, great price, great seller. 10/10 would buy again.",
        sellerId: users[4]!.id,
        reviewerId: users[3]!.id, // Marcus reviews Emma
        listingId: listings[10]!.id, // OK Computer listing
      },
    }),
    prisma.review.create({
      data: {
        rating: 4,
        comment: "What's Going On is a soul classic and this copy is beautiful. Slight crackle on one track but nothing major. Very happy with the purchase!",
        sellerId: users[4]!.id,
        reviewerId: users[2]!.id, // Sarah reviews Emma
        listingId: listings[9]!.id, // What's Going On listing
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Blonde on Blonde is an absolute treasure. Emma packed it really well and it arrived in perfect condition. One of my best purchases on here!",
        sellerId: users[4]!.id,
        reviewerId: users[0]!.id, // Admin reviews Emma
        listingId: listings[12]!.id, // Blonde on Blonde listing
      },
    }),
  ]);

  console.log(`Created ${reviews.length} reviews`);
  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
