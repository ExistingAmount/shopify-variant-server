const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Variant API is live');
});

app.post('/create-variant', async (req, res) => {
  const { option1, price } = req.body;

  if (!option1 || !price) {
    return res.status(400).json({ error: 'Missing option1 or price' });
  }

  const variantData = {
    variant: {
      option1: option1,
      price: price.toString()
    }
  };

  try {
    const response = await fetch(`https://${process.env.SHOPIFY_DOMAIN}/admin/api/2023-04/products/${process.env.PRODUCT_ID}/variants.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify(variantData)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to create variant', details: data.errors });
    }

    res.status(200).json({ success: true, variant: data.variant });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
