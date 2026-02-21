import { PrismaClient } from "../generated/prisma/index.js";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clear existing data (order matters due to FK constraints)
  await prisma.review.deleteMany();
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
        sellerId: users[0]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Abbey+Road"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Abbey+Road",
        priceLabel: "UNDERPRICED",
        pricePercentage: 11.5,
        priceDataUpdated: new Date("2025-01-25"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Kind+of+Blue"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Kind+of+Blue",
        priceLabel: "FAIR",
        pricePercentage: 2.5,
        priceDataUpdated: new Date("2025-01-15"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Rumours"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Rumours",
        priceLabel: "UNDERPRICED",
        pricePercentage: 18.3,
        priceDataUpdated: new Date("2025-01-20"),
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
        sellerId: users[1]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Dark+Side+Moon"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Dark+Side+Moon",
        priceLabel: "OVERPRICED",
        pricePercentage: 22.7,
        priceDataUpdated: new Date("2025-01-18"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Purple+Rain"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Purple+Rain",
        priceLabel: "FAIR",
        pricePercentage: 4.2,
        priceDataUpdated: new Date("2025-01-22"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Thriller"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Thriller",
        priceLabel: "UNDERPRICED",
        pricePercentage: 12.8,
        priceDataUpdated: new Date("2025-01-19"),
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
        sellerId: users[3]!.id,
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Blue"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Blue",
        priceLabel: "FAIR",
        pricePercentage: 3.1,
        priceDataUpdated: new Date("2025-01-17"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Velvet+Underground"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Velvet+Underground",
        priceLabel: "OVERPRICED",
        pricePercentage: 35.4,
        priceDataUpdated: new Date("2025-01-14"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Nevermind"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Nevermind",
        priceLabel: "UNDERPRICED",
        pricePercentage: 8.6,
        priceDataUpdated: new Date("2025-01-21"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Whats+Going+On"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Whats+Going+On",
        priceLabel: "FAIR",
        pricePercentage: 1.9,
        priceDataUpdated: new Date("2025-01-23"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=OK+Computer"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=OK+Computer",
        priceLabel: "UNDERPRICED",
        pricePercentage: 15.7,
        priceDataUpdated: new Date("2025-01-16"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=Random+Access"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=Random+Access",
        priceLabel: "OVERPRICED",
        pricePercentage: 28.2,
        priceDataUpdated: new Date("2025-01-12"),
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
        images: JSON.stringify(["https://placehold.co/400x400/fc6736/ffffff.png?text=In+Rainbows+CD"]),
        imageUrl: "https://placehold.co/400x400/fc6736/ffffff.png?text=In+Rainbows+CD",
        priceLabel: "FAIR",
        pricePercentage: 5.2,
        priceDataUpdated: new Date("2025-01-13"),
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
      },
    }),
  ]);

  console.log(`Created ${listings.length} listings`);

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
