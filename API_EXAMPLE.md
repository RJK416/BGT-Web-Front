# API Integration Guide

Your API needs to provide the following endpoints to work with the catalog:

## Required Endpoints

### 1. GET /api/products
Returns a list of all products.

**Response Format:**
```json
[
  {
    "id": 1,
    "name": "Wireless Bluetooth Headphones",
    "category": "Electronics",
    "price": 89.99,
    "image": "https://example.com/headphones.jpg",
    "description": "High-quality wireless headphones with noise cancellation"
  },
  {
    "id": 2,
    "name": "Organic Cotton T-Shirt",
    "category": "Clothing",
    "price": 24.99,
    "image": "https://example.com/tshirt.jpg",
    "description": "Comfortable organic cotton t-shirt in various colors"
  }
]
```

### 2. GET /api/categories
Returns a list of all product categories.

**Response Format:**
```json
[
  {
    "id": "electronics",
    "name": "Electronics"
  },
  {
    "id": "clothing",
    "name": "Clothing"
  },
  {
    "id": "home-garden",
    "name": "Home & Garden"
  }
]
```

## Configuration

### Environment Variables
Create a `.env.local` file in your project root:

```env
# Your API base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### API Configuration
The API configuration is in `src/config/api.ts`. You can modify:
- `BASE_URL`: Your API server URL
- `ENDPOINTS`: API endpoint paths
- `TIMEOUT`: Request timeout (default: 10 seconds)

## Example API Implementation (Node.js/Express)

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Sample data
const products = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    price: 89.99,
    image: "https://example.com/headphones.jpg",
    description: "High-quality wireless headphones with noise cancellation"
  },
  // ... more products
];

const categories = [
  { id: "electronics", name: "Electronics" },
  { id: "clothing", name: "Clothing" },
  // ... more categories
];

// GET /api/products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// GET /api/categories
app.get('/api/categories', (req, res) => {
  res.json(categories);
});

app.listen(3001, () => {
  console.log('API server running on port 3001');
});
```

## Features Included

✅ **Loading States** - Shows spinner while fetching data  
✅ **Error Handling** - Displays error messages with retry button  
✅ **Search Functionality** - Real-time product search  
✅ **Category Filtering** - Filter products by category  
✅ **Sorting Options** - Sort by name, price (low/high)  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Image Support** - Displays product images with fallbacks  
✅ **TypeScript Types** - Full type safety for API data  

## Next Steps

1. **Create your API** with the required endpoints
2. **Update the API URL** in `src/config/api.ts` or set `NEXT_PUBLIC_API_URL` environment variable
3. **Test the connection** by running both your API and the frontend
4. **Customize the design** and add more features as needed

The frontend is now ready to connect to your API! 🚀 