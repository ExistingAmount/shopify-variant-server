const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Enable CORS for your frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

app.get('/ping-shopify', async (req, res) => {
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const url = `https://${storeDomain}/admin/api/2023-10/shop.json`;

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
        error: 'Failed to ping shop',
        details: data
      });
    }

    res.json({
      message: 'Ping successful',
      shop: data.shop
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.get('/get-product/:productId', async (req, res) => {
  const { productId } = req.params;
  const storeDomain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  const url = `https://${storeDomain}/admin/api/2023-10/products/${productId}.json`;

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
  const url = `https://${storeDomain}/admin/api/2023-10/products.json?limit=50`;

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
  const url = `https://${storeDomain}/admin/api/2023-10/products/${productId}/variants.json`;

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

// NEW ENDPOINTS FOR CART INTEGRATION

// Calculate pricing based on configuration
app.post('/calculate-price', (req, res) => {
  try {
    const { widthA, widthB, height, lipSize, endCap, zipDigit } = req.body;

    // Validate inputs
    if (!widthA || !widthB || !height) {
      return res.status(400).json({ error: 'Missing required dimensions' });
    }

    // Calculate surface area (all 6 sides of the box)
    const surfaceArea = 2 * (widthA * height + widthB * height + widthA * widthB);
    
    // Base cost calculation (adjust these rates based on your pricing)
    const materialCostPerSqIn = 0.15; // $0.15 per square inch
    const baseCost = surfaceArea * materialCostPerSqIn;
    
    // Lip/flange cost
    const lipCostPerSqIn = 0.02; // Additional $0.02 per sq in for lip/flange
    const lipCost = (lipSize > 0) ? surfaceArea * lipCostPerSqIn : 0;
    
    // End cap cost
    const endCapCost = endCap ? 12.50 : 0;
    
    // Shipping cost based on zip code first digit
    const shippingRates = {
      '0': 25, '1': 30, '2': 35, '3': 40, '4': 20,
      '5': 25, '6': 30, '7': 35, '8': 40, '9': 45
    };
    const shippingCost = shippingRates[zipDigit] || 25;
    
    // Labor/fabrication cost (adjust as needed)
    const laborCost = Math.max(50, surfaceArea * 0.05); // Minimum $50 or $0.05 per sq in
    
    const subtotal = baseCost + lipCost + endCapCost + laborCost;
    const totalCost = subtotal + shippingCost;

    res.json({
      configuration: { widthA, widthB, height, lipSize, endCap, zipDigit },
      pricing: {
        surfaceArea: Math.round(surfaceArea * 100) / 100,
        baseCost: Math.round(baseCost * 100) / 100,
        lipCost: Math.round(lipCost * 100) / 100,
        endCapCost,
        laborCost: Math.round(laborCost * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        shippingCost,
        totalCost: Math.round(totalCost * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error calculating price', details: error.message });
  }
});

// Create a draft order in Shopify
app.post('/create-draft-order', async (req, res) => {
  try {
    const { configuration, pricing, customerInfo } = req.body;

    if (!configuration || !pricing) {
      return res.status(400).json({ error: 'Missing configuration or pricing data' });
    }

    const storeDomain = process.env.SHOPIFY_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    
    // Create product title and description
    const productTitle = `Custom Sheet Metal Plenum - ${configuration.widthA}"×${configuration.widthB}"×${configuration.height}"`;
    const lipDescription = configuration.lipSize === 0 ? 'No Lip/Flange' : `${configuration.lipSize}" Lip/Flange`;
    const endCapDescription = configuration.endCap ? 'With End Cap (+$12.50)' : 'No End Cap';
    
    const draftOrderData = {
      draft_order: {
        line_items: [{
          title: productTitle,
          price: pricing.totalCost.toString(),
          quantity: 1,
          properties: [
            { name: 'Width A (inches)', value: configuration.widthA },
            { name: 'Width B (inches)', value: configuration.widthB },
            { name: 'Height (inches)', value: configuration.height },
            { name: 'Surface Area (sq in)', value: pricing.surfaceArea },
            { name: 'Lip/Flange', value: lipDescription },
            { name: 'End Cap', value: endCapDescription },
            { name: 'Shipping Zone', value: `Zone ${configuration.zipDigit}` },
            { name: 'Base Material Cost', value: `$${pricing.baseCost}` },
            { name: 'Lip Cost', value: `$${pricing.lipCost}` },
            { name: 'End Cap Cost', value: `$${pricing.endCapCost}` },
            { name: 'Labor Cost', value: `$${pricing.laborCost}` },
            { name: 'Shipping Cost', value: `$${pricing.shippingCost}` },
            { name: 'Configuration Date', value: new Date().toISOString() }
          ]
        }],
        shipping_line: {
          title: `Shipping to Zone ${configuration.zipDigit}`,
          price: pricing.shippingCost.toString()
        },
        note: `Custom plenum configuration: ${configuration.widthA}"W × ${configuration.widthB}"W × ${configuration.height}"H`,
        tags: ['custom-plenum', 'configurator'],
        ...(customerInfo && customerInfo.email && {
          customer: {
            email: customerInfo.email
          }
        })
      }
    };

    const url = `https://${storeDomain}/admin/api/2023-10/draft_orders.json`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftOrderData)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to create draft order',
        details: data
      });
    }

    // Create checkout URL
    const checkoutUrl = `https://${process.env.SHOPIFY_STORE_DOMAIN || storeDomain.replace('.myshopify.com', '.com')}/cart/${data.draft_order.id}:${data.draft_order.invoice_url.split('/').pop()}`;

    res.json({
      success: true,
      draftOrder: data.draft_order,
      checkoutUrl: data.draft_order.invoice_url, // Use Shopify's invoice URL for checkout
      message: 'Draft order created successfully'
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error creating draft order', 
      details: error.message 
    });
  }
});

// Alternative: Add to cart using Shopify's Cart API (requires base product)
app.post('/add-to-cart', async (req, res) => {
  try {
    const { configuration, pricing, baseProductVariantId } = req.body;

    if (!configuration || !pricing) {
      return res.status(400).json({ error: 'Missing configuration or pricing data' });
    }

    // If you have a base product variant ID, you can add it to cart
    // Note: Shopify's cart API doesn't allow dynamic pricing, so you'd need
    // to handle pricing via Shopify Scripts, Flow, or checkout extensions

    const cartData = {
      items: [{
        id: baseProductVariantId || process.env.BASE_PRODUCT_VARIANT_ID,
        quantity: 1,
        properties: {
          'Width A (inches)': configuration.widthA,
          'Width B (inches)': configuration.widthB,
          'Height (inches)': configuration.height,
          'Lip/Flange Size': configuration.lipSize === 0 ? 'No Lip/Flange' : `${configuration.lipSize}"`,
          'End Cap': configuration.endCap ? 'Yes (+$12.50)' : 'No',
          'Shipping Zone': `Zone ${configuration.zipDigit}`,
          'Calculated Total': `$${pricing.totalCost}`,
          'Configuration Date': new Date().toISOString()
        }
      }]
    };

    res.json({
      success: true,
      cartData,
      message: 'Ready to add to cart',
      note: 'Use draft orders for dynamic pricing, or implement Shopify Scripts for cart pricing'
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error preparing cart data', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});