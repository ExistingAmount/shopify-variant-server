const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch'); // Or use `node-fetch@2` if on Node 18+
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Variant API is live');
});

app.post('/create-variant', async (req, res) => {
  const { productId, optionValues, price } = req.body;

  if (!productId || !optionValues || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_API_TOKEN;

  const url = `https://${storeDomain}/admin/api/2024-01/products/${productId}/variants.json`;

  const variantData = {
    variant: {
      option1: optionValues[0] || null,
      option2: optionValues[1] || null,
      option3: optionValues[2] || null,
      price: price.toString(),
      inventory_management: "shopify"
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
      console.error('Shopify error:', data);
      return res.status(500).json({ error: 'Failed to create variant', details: data });
    }

    console.log('Variant created:', data.variant.id);
    res.status(200).json({ message: 'Variant created successfully', variant: data.variant });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
