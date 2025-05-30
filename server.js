
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const PRODUCT_ID = process.env.PRODUCT_ID; // ID of the fixed base product

function calculatePrice(widthA, widthB, height, endCap, zipDigit) {
  let price = 25;
  price += (widthA + widthB + height) * 1.25;
  if (endCap) price += 12.5;
  price += zipDigit * 1.75;
  return parseFloat(price.toFixed(2));
}

app.post('/create-variant', async (req, res) => {
  const { widthA, widthB, height, endCap, zipDigit } = req.body;

  if (!widthA || !widthB || !height || zipDigit === undefined) {
    return res.status(400).json({ error: "Missing required inputs" });
  }

  const price = calculatePrice(widthA, widthB, height, endCap, zipDigit);

  const variantData = {
    variant: {
      option1: `W${widthA}xH${height}`,
      price: price,
      sku: `PLM-${widthA}-${widthB}-${height}-${endCap ? 'EC' : 'NEC'}-${zipDigit}`,
      metafields: [
        {
          key: "Width A",
          value: `${widthA}"`,
          type: "single_line_text_field",
          namespace: "custom"
        },
        {
          key: "Width B",
          value: `${widthB}"`,
          type: "single_line_text_field",
          namespace: "custom"
        },
        {
          key: "Height",
          value: `${height}"`,
          type: "single_line_text_field",
          namespace: "custom"
        }
      ]
    }
  };

  try {
    const response = await axios.post(
      `https://${SHOPIFY_DOMAIN}/admin/api/2023-10/products/${PRODUCT_ID}/variants.json`,
      variantData,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const variant = response.data.variant;
    const checkoutUrl = `https://${SHOPIFY_DOMAIN}/cart/${variant.id}:1`;

    res.json({ variantId: variant.id, checkoutUrl });
  } catch (error) {
    console.error("Error creating variant:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create variant" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
