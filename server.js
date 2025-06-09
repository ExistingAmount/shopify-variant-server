import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Variant API is live');
});

app.post('/create-variant', async (req, res) => {
  const { optionValue, price } = req.body;
  console.log('Incoming request body:', req.body);

  if (!optionValue || !price) {
    console.error('Missing required fields');
    return res.status(400).json({ error: 'Missing optionValue or price' });
  }

  const parsedPrice = parseFloat(price).toFixed(2);
  if (isNaN(parsedPrice)) {
    console.error('Invalid price format:', price);
    return res.status(400).json({ error: 'Invalid price format' });
  }

  const url = `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2024-04/products/${process.env.PRODUCT_ID}/variants.json`;
  console.log('Shopify API URL:', url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variant: {
          option1: optionValue,
          price: parsedPrice,
          inventory_management: 'shopify',
          inventory_quantity: 100,
        },
      }),
    });

    const data = await response.json();
    console.log('Shopify API response:', data);

    if (!response.ok) {
      console.error('Shopify API error response:', data);
      return res.status(500).json({
        error: 'Failed to create variant',
        details: data.errors || data,
      });
    }

    res.status(200).json({ message: 'Variant created successfully', data });
  } catch (error) {
    console.error('Fetch error:', error.message);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
