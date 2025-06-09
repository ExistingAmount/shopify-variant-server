const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());

// Debug log: print env values at startup (safe to use during setup)
console.log('🛠️ Loaded ENV:', {
  PRODUCT_ID: process.env.PRODUCT_ID,
  SHOPIFY_DOMAIN: process.env.SHOPIFY_DOMAIN,
  SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN ? '✅ LOADED' : '❌ MISSING'
});

// Root route for basic status
app.get('/', (req, res) => {
  res.send('✅ Variant API is live');
});

// Variant creation route
app.post('/create-variant', async (req, res) => {
  const { optionValue, price } = req.body;

  if (!optionValue || !price) {
    return res.status(400).json({ error: 'Missing optionValue or price' });
  }

  try {
    const response = await fetch(`https://${process.env.SHOPIFY_DOMAIN}/admin/api/2023-04/products/${process.env.PRODUCT_ID}/variants.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        variant: {
          option1: optionValue,
          price: price
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Shopify error:', data);
      return res.status(response.status).json({ error: 'Failed to create variant', details: data.errors || data });
    }

    res.status(200).json({ success: true, variant: data.variant });
  } catch (err) {
    console.error('❌ Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
