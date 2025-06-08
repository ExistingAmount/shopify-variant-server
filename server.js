require("dotenv").config(); // Load .env variables

const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 10000; // Let Render override port

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

    const contentType = response.headers.get("content-type");

    if (response.ok) {
      const data = await response.json();
      res.json({ variantId: data.variant.id });
    } else {
      const errorDetails = contentType && contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      console.error("Variant creation failed:", errorDetails);

      res.status(500).json({
        error: "Failed to create variant",
        details: errorDetails
      });
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
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
