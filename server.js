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

// Debug endpoint to test Shopify connection
app.get('/test-shopify', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  console.log('Testing Shopify connection...');
  console.log('Domain:', storeDomain);
  console.log('Token exists:', !!token);
  
  res.json({
    domain: storeDomain,
    tokenExists: !!token,
    tokenLength: token ? token.length : 0,
    envVars: Object.keys(process.env).filter(key => key.includes('SHOPIFY'))
  });
});

// Get product details
app.get('/get-product/:productId', async (req, res) => {
  const { productId } = req.params;
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  console.log('Get product request:', {
    productId,
    domain: storeDomain,
    tokenExists: !!token
  });

  if (!storeDomain || !token) {
    return res.status(500).json({ 
      error: 'Missing Shopify configuration',
      details: 'SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN must be set in environment variables'
    });
  }

  const url = `https://${storeDomain}/admin/api/2024-04/products/${productId}.json`;

  try {
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('Shopify API error:', data);
      return res.status(response.status).json({ 
        error: 'Failed to get product', 
        details: data,
        url: url,
        status: response.status
      });
    }

    res.json({
      product: {
        id: data.product.id,
        title: data.product.title,
        options: data.product.options,
        variants: data.product.variants.map(v => ({
          id: v.id,
          title: v.title,
          option1: v.option1,
          option2: v.option2,
          option3: v.option3,
          price: v.price
        }))
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      url: url
    });
  }
});

// List all products (first 50)
app.get('/list-products', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  console.log('List products request:', {
    domain: storeDomain,
    tokenExists: !!token
  });

  if (!storeDomain || !token) {
    return res.status(500).json({ 
      error: 'Missing Shopify configuration',
      details: 'SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN must be set in environment variables'
    });
  }

  const url = `https://${storeDomain}/admin/api/2024-04/products.json?limit=50`;

  try {
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.log('Shopify API error:', data);
      return res.status(response.status).json({ 
        error: 'Failed to list products', 
        details: data,
        url: url,
        status: response.status
      });
    }

    res.json({
      products: data.products.map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        options: p.options,
        variant_count: p.variants.length
      }))
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message,
      url: url
    });
  }
});

app.post('/create-variant', async (req, res) => {
  console.log('Received request body:', req.body);
  
  let { productId, optionValues, optionValue, price } = req.body;

  // Handle both optionValues array and single optionValue
  if (!optionValues && optionValue) {
    optionValues = [optionValue];
  }

  // Validate required fields
  if (!productId) {
    return res.status(400).json({ 
      error: 'Missing productId', 
      received: req.body,
      expected: 'productId, optionValues (array), price'
    });
  }
  
  if (!optionValues || !Array.isArray(optionValues)) {
    return res.status(400).json({ 
      error: 'Missing or invalid optionValues (should be an array)', 
      received: req.body,
      expected: 'productId, optionValues (array), price'
    });
  }
  
  if (!price) {
    return res.status(400).json({ 
      error: 'Missing price', 
      received: req.body,
      expected: 'productId, optionValues (array), price'
    });
  }

  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!storeDomain || !token) {
    return res.status(500).json({ 
      error: 'Missing Shopify configuration',
      details: 'SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN must be set in environment variables'
    });
  }

  const url = `https://${storeDomain}/admin/api/2024-04/products/${productId}/variants.json`;

  const variantData = {
    variant: {
      option1: optionValues[0] || null,
      option2: optionValues[1] || null,
      option3: optionValues[2] || null,
      price: price.toString(),
      inventory_management: "shopify",
      inventory_quantity: 1000 // Set initial inventory
    }
  };

  console.log('Creating variant with data:', JSON.stringify(variantData, null, 2));

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
      return res.status(response.status).json({ 
        error: 'Failed to create variant', 
        details: data,
        shopifyStatus: response.status
      });
    }

    console.log('Variant created successfully:', data.variant.id);
    res.status(200).json({ 
      message: 'Variant created successfully', 
      variant: data.variant 
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Make sure these environment variables are set:');
  console.log('- SHOPIFY_DOMAIN');
  console.log('- SHOPIFY_ACCESS_TOKEN');
});