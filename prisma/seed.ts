import { PrismaClient } from "../generated/prisma/index.js";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clear existing data
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  // Create 5 users
  const password = await hash("password123", 12);

  const users = await Promise.all([
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

  console.log(`Created ${users.length} users`);

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
        sellerId: users[0]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Abbey+Road",
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
        sellerId: users[0]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Kind+of+Blue",
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
        sellerId: users[1]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Rumours",
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
        sellerId: users[1]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Dark+Side+Moon",
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
        sellerId: users[2]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Purple+Rain",
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
        sellerId: users[2]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Thriller",
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
        sellerId: users[3]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Blue",
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
        sellerId: users[3]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Velvet+Underground",
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
        sellerId: users[3]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Nevermind",
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
        sellerId: users[4]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Whats+Going+On",
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
        sellerId: users[4]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=OK+Computer",
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
        sellerId: users[4]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Random+Access",
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
        sellerId: users[0]!.id,
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=In+Rainbows+CD",
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
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Beatles+Shirt",
      },
    }),
  ]);

  console.log(`Created ${listings.length} listings`);
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
