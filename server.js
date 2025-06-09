import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Variant API is live');
});

app.post('/create-variant', async (req, res) => {
  const { optionValue, price } = req.body;

  if (!optionValue || !price) {
    return res.status(400).json({ error: 'Missing optionValue or price' });
  }

  const shop = process.env.SHOPIFY_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const productId = process.env.PRODUCT_ID;

  const url = `https://${shop}/admin/api/2024-04/products/${productId}/variants.json`;

  const variantData = {
    variant: {
      option1: optionValue,
      price: price.toString(),
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(variantData),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to create variant', details: result.errors || result });
    }

    res.json({ message: 'Variant created', variant: result.variant });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
