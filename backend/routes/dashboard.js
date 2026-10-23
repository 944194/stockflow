
const express = require("express");
const prisma = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const [totalProducts, products, lowStockProducts] =
      await Promise.all([
        prisma.product.count({
          where: { organizationId },
        }),

        prisma.product.findMany({
          where: { organizationId },
          select: {
            quantity: true,
            costPrice: true,
            lowStockThreshold: true,
          },
        }),

        prisma.product.findMany({
          where: {
            organizationId,
            lowStockThreshold: { not: null },
          },
          select: {
            id: true,
            name: true,
            sku: true,
            quantity: true,
            lowStockThreshold: true,
          },
        }),
      ]);

    const totalUnits = products.reduce(
      (sum, product) => sum + product.quantity,
      0
    );

    const inventoryCostValue = products.reduce(
      (sum, product) =>
        sum +
        product.quantity * Number(product.costPrice ?? 0),
      0
    );

    const lowStock = lowStockProducts.filter(
      (product) => product.quantity <= product.lowStockThreshold
    );

    res.json({
      totalProducts,
      totalUnits,
      lowStockCount: lowStock.length,
      inventoryCostValue: Number(inventoryCostValue.toFixed(2)),
      lowStockProducts: lowStock,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      message: "Unable to load dashboard statistics",
    });
  }
});

module.exports = router;
