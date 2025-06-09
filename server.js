const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Shopify Variant Creation Route
app.post("/create-variant", async (req, res) => {
  const { optionValue, price } = req.body;

  if (!optionValue || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch(`https://${process.env.SHOPIFY_DOMAIN}/admin/api/2023-04/products/${process.env.PRODUCT_ID}/variants.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN,
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

    if (!response.ok) {
      console.error("Shopify error:", data);
      return res.status(500).json({
        error: "Failed to create variant",
        details: data
      });
    }

    return res.status(200).json({ variantId: data.variant.id });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// Optional: serve frontend if needed
app.get("/", (req, res) => {
  res.send("Variant API is live");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
