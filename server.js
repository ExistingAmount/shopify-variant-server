const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Variant API is live');
});

app.get('/ping-shopify', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  try {
    const response = await fetch(`https://${storeDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json({ message: 'Ping successful', shop: data.shop });
  } catch (error) {
    res.status(500).json({ error: 'Ping failed', details: error.message });
  }
});

app.get('/list-products', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  try {
    const response = await fetch(`https://${storeDomain}/admin/api/2023-10/products.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    res.json(data.products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list products', details: error.message });
  }
});

app.post('/create-variant', async (req, res) => {
  const { productId, optionValues, price } = req.body;
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const payload = {
    variant: {
      option1: optionValues[0] || null,
      option2: optionValues[1] || null,
      option3: optionValues[2] || null,
      price: price,
      inventory_management: null,
      requires_shipping: true,
      taxable: true,
      inventory_policy: 'deny'
    }
  };

  try {
    const response = await fetch(`https://${storeDomain}/admin/api/2023-10/products/${productId}/variants.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.variant && result.variant.id) {
      const checkoutUrl = `https://${storeDomain}/cart/${result.variant.id}:1`;
      res.status(200).json({
        message: 'Variant created successfully',
        variantId: result.variant.id,
        checkoutUrl
      });
    } else {
      res.status(400).json({ error: 'Variant creation failed', details: result });
    }
  } catch (error) {
    res.status(500).json({ error: 'Shopify API error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
