const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Send index.html for root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// (Optional) Handle Shopify variant creation (add later if needed)
// app.post("/create-variant", ... )

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
