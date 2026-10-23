
const express = require("express");
const prisma = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Protect every route in this file
router.use(authenticateToken);

// Validate product input
function validateProduct(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      errors.push("Product name is required");
    }
  }

  if (!isUpdate || data.sku !== undefined) {
    if (typeof data.sku !== "string" || !data.sku.trim()) {
      errors.push("SKU is required");
    }
  }

  if (data.quantity !== undefined) {
    if (!Number.isInteger(data.quantity) || data.quantity < 0) {
      errors.push("Quantity must be a non-negative integer");
    }
  } else if (!isUpdate) {
    data.quantity = 0;
  }

  for (const field of ["costPrice", "sellingPrice"]) {
    if (data[field] !== undefined && data[field] !== null) {
      const value = Number(data[field]);

      if (!Number.isFinite(value) || value < 0) {
        errors.push(`${field} must be a non-negative number`);
      } else {
        data[field] = value;
      }
    }
  }

  if (data.lowStockThreshold !== undefined &&
      data.lowStockThreshold !== null) {
    if (
      !Number.isInteger(data.lowStockThreshold) ||
      data.lowStockThreshold < 0
    ) {
      errors.push("Low-stock threshold must be a non-negative integer");
    }
  }

  if (
    data.description !== undefined &&
    data.description !== null &&
    typeof data.description !== "string"
  ) {
    errors.push("Description must be text");
  }

  return errors;
}

function productData(data) {
  const fields = [
    "name",
    "sku",
    "description",
    "quantity",
    "costPrice",
    "sellingPrice",
    "lowStockThreshold",
  ];

  const result = {};

  for (const field of fields) {
    if (data[field] !== undefined) {
      result[field] =
        ["name", "sku"].includes(field)
          ? data[field].trim()
          : data[field];
    }
  }

  return result;
}

// GET /api/products - List this organization's products
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        organizationId: req.user.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(products);
  } catch (error) {
    console.error("List products error:", error);
    res.status(500).json({ message: "Unable to fetch products" });
  }
});

// GET /api/products/:id - Get one product
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Unable to fetch product" });
  }
});

// POST /api/products - Create a product
router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };
    const errors = validateProduct(data);

    if (errors.length) {
      return res.status(400).json({ message: errors.join("; ") });
    }

    const product = await prisma.product.create({
      data: {
        ...productData(data),
        organizationId: req.user.organizationId,
      },
    });

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "This SKU already exists in your organization",
      });
    }

    console.error("Create product error:", error);
    res.status(500).json({ message: "Unable to create product" });
  }
});

// PUT /api/products/:id - Update a product
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const data = { ...req.body };

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "Provide at least one field to update",
      });
    }

    const allowedFields = [
      "name",
      "sku",
      "description",
      "quantity",
      "costPrice",
      "sellingPrice",
      "lowStockThreshold",
    ];

    if (Object.keys(data).some((field) => !allowedFields.includes(field))) {
      return res.status(400).json({
        message: "One or more fields cannot be updated",
      });
    }

    const errors = validateProduct(data, true);

    if (errors.length) {
      return res.status(400).json({ message: errors.join("; ") });
    }

    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: productData(data),
    });

    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "This SKU already exists in your organization",
      });
    }

    console.error("Update product error:", error);
    res.status(500).json({ message: "Unable to update product" });
  }
});

// DELETE /api/products/:id - Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const result = await prisma.product.deleteMany({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Unable to delete product" });
  }
});

module.exports = router;
