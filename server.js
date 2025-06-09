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
  if (!optionValue || !price) {
    return res.status(400).json({ error: 'Missing optionValue or price' });
  }

  try {
    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/products/${process.env.PRODUCT_ID}/variants.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        variant: {
          option1: optionValue,
          price: price
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to create variant', details: data.errors || data });
    }

    res.status(200).json({ message: 'Variant created successfully', data });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
