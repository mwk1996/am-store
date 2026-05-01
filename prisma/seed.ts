import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
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

  // Create a sample product
  const existingProduct = await prisma.product.findFirst();
  if (!existingProduct) {
    const product = await prisma.product.create({
      data: {
        name: {
          en: "Windows 11 Pro License",
          ar: "ترخيص ويندوز 11 برو",
          tr: "Windows 11 Pro Lisansı",
          ku: "مۆڵەتی ویندۆز ١١ پرۆ",
        },
        description: {
          en: "Genuine Windows 11 Pro license key. Instant digital delivery.",
          ar: "مفتاح ترخيص ويندوز 11 برو الأصلي. توصيل رقمي فوري.",
          tr: "Orijinal Windows 11 Pro lisans anahtarı. Anında dijital teslimat.",
          ku: "کلیلی مۆڵەتی ڕەسەنی ویندۆز ١١ پرۆ. گەیاندنی دیجیتاڵی خێرا.",
        },
        price: 25000,
        imageUrl: null,
      },
    });

    // Add some sample license keys
    await prisma.licenseKey.createMany({
      data: [
        { key: "XXXXX-XXXXX-XXXXX-XXXXX-00001", productId: product.id },
        { key: "XXXXX-XXXXX-XXXXX-XXXXX-00002", productId: product.id },
        { key: "XXXXX-XXXXX-XXXXX-XXXXX-00003", productId: product.id },
      ],
    });

    console.log(`Sample product created with 3 license keys.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
