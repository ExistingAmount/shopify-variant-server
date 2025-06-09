require("dotenv").config(); // Load .env variables

const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// Root route - serves your 3D frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// POST route for Shopify variant creation
app.post("/create-variant", async (req, res) => {
  const { optionValue, price } = req.body;

  // Sanity check
  if (!optionValue || !price) {
    return res.status(400).json({ error: "Missing optionValue or price" });
  }

  try {
    const shopifyRes = await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2023-04/products/${process.env.PRODUCT_ID}/variants.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN
        },
        body: JSON.stringify({
          variant: {
            option1: optionValue,
            price: price.toFixed(2),
            sku: `CUST-${Date.now()}`
          }
        })
      }
    );

    const data = await shopifyRes.json();

    if (shopifyRes.ok && data.variant) {
      console.log("Variant created:", data.variant.id);
      res.status(200).json({ variantId: data.variant.id });
    } else {
      console.error("Shopify error:", data);
      res.status(500).json({ error: "Failed to create variant", details: data });
    }

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
