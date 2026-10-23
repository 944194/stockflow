
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, organizationName } = req.body;

    if (!email || !password || !organizationName) {
      return res.status(400).json({
        message: "Email, password, and organization name are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
        },
      });

      return tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          organizationId: organization.id,
        },
        select: {
          id: true,
          email: true,
          organizationId: true,
        },
      });
    });

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organizationId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      message: "Account created successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Unable to create account",
    });
  }
});


 // POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Check whether the account exists first
    if (!user) {
      return res.status(404).json({
        message: "Account not found. Please sign up.",
      });
    }

    // Then verify the password
    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        organizationId: user.organizationId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in",
    });
  }
});


module.exports = router;
