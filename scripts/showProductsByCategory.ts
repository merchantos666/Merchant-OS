import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      products: {
        include: {
          pricingTiers: true
        }
      }
    }
  });

  for (const category of categories) {
    console.log(`\n🧨 ${category.name} (${category.slug})`);
    console.log('='.repeat(category.name.length + 6));

    for (const product of category.products) {
      console.log(`\n📦 ${product.name}`);
      console.log(`   Slug: ${product.slug}`);
      if (product.description) console.log(`   Desc: ${product.description}`);
      if (product.ignitionMethod) console.log(`   Ignición: ${product.ignitionMethod}`);
      if (product.durationSeconds !== null) console.log(`   Duración: ${product.durationSeconds} seg`);
      if (product.colorsAvailable?.length)
        console.log(`   Colores: ${product.colorsAvailable.join(', ')}`);
      if (product.ageRestriction) console.log(`   Restricción: ${product.ageRestriction}`);
      if (product.forOutdoorUse !== null)
        console.log(`   Uso exterior: ${product.forOutdoorUse ? 'Sí' : 'No'}`);
      if (product.videoUrl) console.log(`   🎥 Video: ${product.videoUrl}`);
      if (product.imageUrl) console.log(`   🖼️ Imagen: ${product.imageUrl}`);

      // Mostrar metadata si existe
      if (product.metadata) {
        const { caliber, shots, usage, ...rest } = product.metadata as Record<string, any>;
        if (caliber) console.log(`   Calibre: ${caliber}`);
        if (shots) console.log(`   Disparos: ${shots}`);
        if (usage) console.log(`   Uso: ${usage}`);

        // Mostrar campos extra que haya en metadata
        for (const key in rest) {
          if (Object.hasOwn(rest, key)) {
            console.log(`   ${key}: ${rest[key]}`);
          }
        }
      }

      if (product.pricingTiers.length > 0) {
        console.log('   💲 Precios:');
        for (const tier of product.pricingTiers) {
          const range = tier.minQty !== null && tier.maxQty !== null
            ? `${tier.minQty}-${tier.maxQty}`
            : tier.minQty !== null
            ? `${tier.minQty}+`
            : '-';
          console.log(`     • ${range}: $${tier.price.toFixed(2)}`);
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error al mostrar productos:', e);
  process.exit(1);
});
