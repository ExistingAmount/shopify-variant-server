
# Shopify Variant Creator Server (Heroku-Ready)

## ✅ What This Does
- Accepts user inputs via POST (`/create-variant`)
- Calculates price based on dimensions + options
- Creates a new **variant** under a fixed Shopify product
- Returns variant ID + checkout link

## 🔧 Setup

1. Clone this repo or upload to Heroku
2. Create a `.env` file and set the following:
   - `SHOPIFY_DOMAIN=your-store.myshopify.com`
   - `SHOPIFY_ACCESS_TOKEN=your custom app's Admin API token`
   - `PRODUCT_ID=the product ID you want to add variants to`

3. Deploy using Heroku or Vercel
4. Call `/create-variant` with JSON like:
```
{
  "widthA": 16,
  "widthB": 18,
  "height": 25,
  "endCap": true,
  "zipDigit": 0
}
```

## 🔄 Response
Returns:
```json
{
  "variantId": 1234567890,
  "checkoutUrl": "https://yourstore.myshopify.com/cart/1234567890:1"
}
```

Now you can redirect the user straight to checkout!
