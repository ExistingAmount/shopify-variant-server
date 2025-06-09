const express = require('express');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const PRODUCT_ID = process.env.PRODUCT_ID;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('✅ Variant API is live');
});

// Create variant route
app.post('/create-variant', async (req, res) => {
  const { optionValue, price } = req.body;

  if (!optionValue || !price) {
    return res.status(400).json({ error: 'Missing optionValue or price' });
  }

  const productGID = `gid://shopify/Product/${PRODUCT_ID}`;
  const graphqlQuery = {
    query: `
      mutation {
        productVariantCreate(input: {
          productId: "${productGID}",
          price: "${price}",
          options: ["${optionValue}"]
        }) {
          productVariant {
            id
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
  };

  try {
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphqlQuery),
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(500).json({ error: 'Failed to create variant', details: data.errors });
    }

    const errors = data.data.productVariantCreate.userErrors;
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Variant creation error', details: errors });
    }

    return res.json({ success: true, variant: data.data.productVariantCreate.productVariant });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
