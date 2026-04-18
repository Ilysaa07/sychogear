const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const variants = await prisma.productVariant.findMany({
    include: {
      product: true
    }
  });
  console.log(JSON.stringify(variants, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
