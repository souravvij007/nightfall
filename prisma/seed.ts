import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Demo seed for a fresh (e.g. cloud) database so the deployed app has something to show.
// Idempotent — safe to run repeatedly. Run: `npx tsx prisma/seed.ts`
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const inDays = (d: number) => new Date(Date.now() + d * 86400_000);

async function main() {
  const vij = await prisma.user.upsert({
    where: { handle: "mrvij" },
    update: { role: "ADMIN" },
    create: {
      phone: "+10000000001", handle: "mrvij", displayName: "Mr Vij",
      bio: "Founder & night owl.", role: "ADMIN",
      pointsBalance: 4500, level: 10, rank: "GOLD",
    },
  });
  const luna = await prisma.user.upsert({
    where: { handle: "luna" },
    update: {},
    create: {
      phone: "+10000000002", handle: "luna", displayName: "Luna",
      bio: "Moonlit wanderer.", pointsBalance: 1000, level: 5, rank: "SILVER",
    },
  });

  // A couple of feed posts
  const postCount = await prisma.post.count();
  if (postCount === 0) {
    await prisma.post.create({ data: { authorId: vij.id, caption: "Welcome to Nightfall — your after-dark social club is live. 🌙", likeCount: 12, commentCount: 3 } });
    await prisma.post.create({ data: { authorId: luna.id, caption: "Rooftop meetup this weekend, who's in? ✨", likeCount: 8, commentCount: 2 } });
  }

  // An official approved meetup
  const meetups = await prisma.meetup.count();
  if (meetups === 0) {
    await prisma.meetup.create({
      data: {
        hostId: vij.id, title: "Rooftop Sundowner", description: "Golden-hour drinks and good conversation.",
        city: "Mumbai", venue: "Skyline Terrace", startsAt: inDays(5), feeCents: 50000, capacity: 20,
        isOfficial: true, status: "APPROVED", approvedById: vij.id, approvedAt: new Date(),
      },
    });
  }

  // An official approved trip with itinerary + vetted vendors
  const trips = await prisma.trip.count();
  if (trips === 0) {
    await prisma.trip.create({
      data: {
        hostId: vij.id, title: "Himalayan Weekend Escape",
        description: "Two nights in the mountains — treks, bonfires, and strangers who become friends.",
        destination: "Manali", startsAt: inDays(14), endsAt: inDays(16), priceCents: 800000, capacity: 12,
        isOfficial: true, status: "APPROVED", approvedById: vij.id, approvedAt: new Date(),
        itinerary: { create: [
          { dayNumber: 1, title: "Arrival & sunset trek", description: "Reach base camp, evening bonfire." },
          { dayNumber: 2, title: "Summit day", description: "Early hike to the ridge, picnic lunch." },
        ] },
        accommodations: { create: [{ name: "Cedar Lodge", nights: 2, details: "Mountain-view twin rooms" }] },
        vendors: { create: [
          { kind: "HOTEL", name: "Cedar Lodge", vetStatus: "APPROVED", vettedById: vij.id, vettedAt: new Date() },
          { kind: "TRANSPORT", name: "Hill Cabs", vetStatus: "APPROVED", vettedById: vij.id, vettedAt: new Date() },
        ] },
      },
    });
  }

  console.log(`Seeded. Admin: @${vij.handle} (level ${vij.level}) · @${luna.handle}`);
}

main().finally(() => prisma.$disconnect());
