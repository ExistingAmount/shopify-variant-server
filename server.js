const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SHOPIFY_ADMIN_API_URL = 'https://1b1d86-3.myshopify.com/admin/api/2024-01';
const PRODUCT_ID = '10105912983867';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.get('/ping-shopify', async (req, res) => {
  try {
    const response = await fetch(`${SHOPIFY_ADMIN_API_URL}/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    res.json({ message: 'Ping successful', shop: data.shop });
  } catch (err) {
    console.error('Ping failed:', err);
    res.status(500).json({ error: 'Ping failed', details: err.message });
  }
});

app.post('/create-variant', async (req, res) => {
  const { optionValues, price } = req.body;

  if (!optionValues || optionValues.length === 0 || !price) {
    return res.status(400).json({ error: 'Missing variant data' });
  }

  const variant = {
    variant: {
      option1: optionValues[0],
      price: parseFloat(price).toFixed(2),
      inventory_policy: 'deny'
    }
  };

  try {
    const response = await fetch(`${SHOPIFY_ADMIN_API_URL}/products/${PRODUCT_ID}/variants.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(variant)
    });

    const data = await response.json();

    if (response.ok && data.variant) {
      res.json({ message: 'Variant created', variant: data.variant });
    } else {
      console.error('Variant creation failed:', data);
      res.status(422).json({ error: 'Failed to create variant', details: data.errors || data });
    }
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
