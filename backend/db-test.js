
const prisma = require("./db");

async function main() {
  await prisma.$connect();

  const organizations = await prisma.organization.count();
  const users = await prisma.user.count();
  const products = await prisma.product.count();

  console.log("PostgreSQL connected successfully!");
  console.log("Organizations:", organizations);
  console.log("Users:", users);
  console.log("Products:", products);
}

main()
  .catch((error) => {
    console.error("Database test failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  