require("dotenv").config(); // Load .env variables

const express = require("express");
const path = require("path");
const fetch = require("node-fetch"); // Ensure this is installed

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend files (index.html, js/, css/, etc.)
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Shopify Variant Creation Endpoint
app.post("/create-variant", async (req, res) => {
  const { optionValue, price } = req.body;

  try {
    const response = await fetch(`https://${process.env.SHOPIFY_DOMAIN}/admin/api/2023-04/products/${process.env.PRODUCT_ID}/variants.json`, {
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
    });

    const data = await response.json();

    if (response.ok) {
      res.json({ variantId: data.variant.id });
    } else {
      console.error("Variant creation failed:", data);
      res.status(500).json({ error: "Failed to create variant" });
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
