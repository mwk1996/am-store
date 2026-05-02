import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Seed categories ──────────────────────────────────────────────────────
  const categories = [
    { name: "Game Accounts", slug: "game-accounts" },
    { name: "Software Keys", slug: "software-keys" },
    { name: "Gift Cards", slug: "gift-cards" },
    { name: "In-Game Items", slug: "in-game-items" },
    { name: "Other", slug: "other" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("Seeded 5 categories");

  // ── Seed default admin user ───────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hashed = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: { email: adminEmail, password: hashed },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
