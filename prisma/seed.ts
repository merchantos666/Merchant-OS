import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

const prisma = new PrismaClient();

const toSlug = (str: string) =>
  slugify(str, { lower: true, strict: true, locale: 'es' });

function parsePrices(prices: string[]): { minQty: number; price: number }[] {
  return prices.map((p) => {
    const match = p.match(/(\d+)\s*(pz)?\s*[–-]\s*\$([\d,]+)/i);
    if (match) {
      const quantity = parseInt(match[1]);
      const price = parseFloat(match[3].replace(/,/g, ''));
      return { minQty: quantity, price };
    }
    return { minQty: 1, price: 0 };
  });
}

async function main() {
  const jsonPath = path.join(__dirname, 'fuegos_artificiales_seed.json');
  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);

  const categorySlug = toSlug(data.name);
  const existingCategory = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });

  let categoryId: string;

  if (existingCategory) {
    console.log(`🔁 Actualizando categoría existente: ${existingCategory.name}`);
    categoryId = existingCategory.id;

    for (const product of data.products) {
      const productSlug = toSlug(product.name);
      const pricingTiers = parsePrices(product.prices || []);

      await prisma.product.upsert({
        where: { slug: productSlug },
        update: {
          name: product.name,
          description: product.description ?? '',
          ignitionMethod: product.ignition ?? null,
          durationSeconds: null,
          colorsAvailable: [],
          videoUrl: null,
          imageUrl: null,
          forOutdoorUse: product.usage?.toLowerCase().includes('exterior') ?? null,
          ageRestriction: product.usage ?? null,
          metadata: {
            caliber: product.caliber ?? null,
            shots: product.shots ?? null,
          },
          pricingTiers: {
            deleteMany: {}, // Limpia precios anteriores
            create: pricingTiers,
          },
        },
        create: {
          name: product.name,
          slug: productSlug,
          description: product.description ?? '',
          ignitionMethod: product.ignition ?? null,
          durationSeconds: null,
          colorsAvailable: [],
          videoUrl: null,
          imageUrl: null,
          forOutdoorUse: product.usage?.toLowerCase().includes('exterior') ?? null,
          ageRestriction: product.usage ?? null,
          metadata: {
            caliber: product.caliber ?? null,
            shots: product.shots ?? null,
          },
          categoryId,
          pricingTiers: {
            create: pricingTiers,
          },
        },
      });
    }
  } else {
    const created = await prisma.category.create({
      data: {
        name: data.name,
        slug: categorySlug,
        description: data.description ?? '',
        products: {
          create: data.products.map((product: any) => ({
            name: product.name,
            slug: toSlug(product.name),
            description: product.description ?? '',
            ignitionMethod: product.ignition ?? null,
            durationSeconds: null,
            colorsAvailable: [],
            videoUrl: null,
            imageUrl: null,
            forOutdoorUse: product.usage?.toLowerCase().includes('exterior') ?? null,
            ageRestriction: product.usage ?? null,
            metadata: {
              caliber: product.caliber ?? null,
              shots: product.shots ?? null,
            },
            pricingTiers: {
              create: parsePrices(product.prices || []),
            },
          })),
        },
      },
    });
    console.log(`✅ Categoría creada: ${created.name}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
