const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`Variant API is live`);
});

app.get('/test-shopify', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  res.json({
    domain: storeDomain,
    tokenExists: !!token,
    tokenLength: token ? token.length : 0,
    envVars: Object.keys(process.env).filter(k => k.includes('SHOPIFY')),
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
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get product',
      details: error.message,
      url,
    });
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
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list products',
      details: error.message,
      url,
    });
  }
});

app.post('/create-variant', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const { productId, optionValues, price } = req.body;

  const variantPayload = {
    variant: {
      option1: optionValues[0],
      option2: optionValues[1] || null,
      option3: optionValues[2] || null,
      price,
    },
  };

  const url = `https://${storeDomain}/admin/api/2024-01/products/${productId}/variants.json`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(variantPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    res.status(200).json({
      message: 'Variant created successfully',
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to create variant',
      details: error.message,
      url,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
