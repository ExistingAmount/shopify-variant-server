const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Variant API is live');
});

app.get('/test-shopify', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  res.json({
    domain: storeDomain,
    tokenExists: !!token,
    tokenLength: token ? token.length : 0,
    envVars: Object.keys(process.env).filter(k => k.includes('SHOPIFY'))
  });
});

app.get('/get-product/:productId', async (req, res) => {
  const { productId } = req.params;
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const url = `https://${storeDomain}/admin/api/2024-01/products/${productId}.json`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get product',
        details: data,
        url: url
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.get('/list-products', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const url = `https://${storeDomain}/admin/api/2024-01/products.json?limit=50`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to list products',
        details: data,
        url: url
      });
    }

    res.json(data.products);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.post('/create-variant', async (req, res) => {
  const { productId, optionValues, price } = req.body;

  if (!productId || !optionValues || !price) {
    return res.status(400).json({
      error: 'Missing productId, optionValues or price',
      received: req.body
    });
  }

  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const url = `https://${storeDomain}/admin/api/2024-01/products/${productId}/variants.json`;

  const variantData = {
    variant: {
      option1: optionValues[0] || null,
      option2: optionValues[1] || null,
      option3: optionValues[2] || null,
      price: price.toString(),
      inventory_management: 'shopify',
      inventory_quantity: 1000
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(variantData)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to create variant',
        details: data,
        url: url
      });
    }

    res.json({ message: 'Variant created', variant: data.variant });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
