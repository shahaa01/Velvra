//sample products
const sampleProducts = [
  {
    "name": "Classic Cotton T-Shirt",
    "brand": "NordStyle",
    "description": "Premium cotton t-shirt with a comfortable fit and breathable fabric. Perfect for everyday wear.",
    "price": 29.99,
    "salePrice": 19.99,
    "sale": true,
    "salePercentage": 33,
    "images": [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "White",
        "hex": "#FFFFFF"
      },
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "men",
    "tags": ["t-shirt", "casual", "cotton", "basics"],
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-06-01T14:45:00.000Z"
  },
  {
    "name": "Slim Fit Jeans",
    "brand": "DenimCo",
    "description": "Modern slim fit jeans with stretch technology for maximum comfort and mobility.",
    "price": 79.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Dark Blue",
        "hex": "#00008B"
      },
      {
        "name": "Light Blue",
        "hex": "#ADD8E6"
      },
      {
        "name": "Black",
        "hex": "#000000"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "men",
    "tags": ["jeans", "denim", "slim fit", "casual"],
    "createdAt": "2025-02-10T09:15:00.000Z",
    "updatedAt": "2025-02-10T09:15:00.000Z"
  },
  {
    "name": "Floral Summer Dress",
    "brand": "Blooms",
    "description": "Lightweight floral dress with adjustable straps and flowy silhouette. Perfect for summer days.",
    "price": 59.99,
    "salePrice": 39.99,
    "sale": true,
    "salePercentage": 33,
    "images": [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Pink",
        "hex": "#FFC0CB"
      },
      {
        "name": "Blue",
        "hex": "#0000FF"
      }
    ],
    "sizes": ["XS", "S", "M", "L"],
    "category": "women",
    "tags": ["dress", "summer", "floral", "casual"],
    "createdAt": "2025-03-05T11:20:00.000Z",
    "updatedAt": "2025-05-28T16:30:00.000Z"
  },
  {
    "name": "Athletic Performance Shorts",
    "brand": "SportiFit",
    "description": "Lightweight, moisture-wicking athletic shorts with built-in liner for maximum comfort during workouts.",
    "price": 34.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1565932887479-b18108f07ffd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590918203039-7e357bf33c97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Grey",
        "hex": "#808080"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "men",
    "tags": ["athletic", "shorts", "workout", "gym"],
    "createdAt": "2025-01-20T14:00:00.000Z",
    "updatedAt": "2025-01-20T14:00:00.000Z"
  },
  {
    "name": "Cashmere Sweater",
    "brand": "LuxuryWear",
    "description": "Ultra-soft cashmere sweater with ribbed cuffs and hem. Elegant and warm for cooler days.",
    "price": 149.99,
    "salePrice": 99.99,
    "sale": true,
    "salePercentage": 33,
    "images": [
      "https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511664829744-4aaea0f3bc00?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Cream",
        "hex": "#FFFDD0"
      },
      {
        "name": "Burgundy",
        "hex": "#800020"
      },
      {
        "name": "Charcoal",
        "hex": "#36454F"
      }
    ],
    "sizes": ["S", "M", "L"],
    "category": "women",
    "tags": ["sweater", "cashmere", "luxury", "winter"],
    "createdAt": "2024-12-10T10:00:00.000Z",
    "updatedAt": "2025-06-05T15:15:00.000Z"
  },
  {
    "name": "Leather Bomber Jacket",
    "brand": "UrbanEdge",
    "description": "Classic leather bomber jacket with ribbed cuffs and collar. Features multiple pockets and full-zip front.",
    "price": 199.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559551409-dadc959f76b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Brown",
        "hex": "#964B00"
      },
      {
        "name": "Black",
        "hex": "#000000"
      }
    ],
    "sizes": ["M", "L", "XL"],
    "category": "men",
    "tags": ["jacket", "leather", "bomber", "outerwear"],
    "createdAt": "2025-02-15T13:45:00.000Z",
    "updatedAt": "2025-02-15T13:45:00.000Z"
  },
  {
    "name": "High-Waisted Yoga Leggings",
    "brand": "ZenFlex",
    "description": "Four-way stretch fabric with moisture-wicking technology. High-waisted design with hidden pocket.",
    "price": 64.99,
    "salePrice": 49.99,
    "sale": true,
    "salePercentage": 23,
    "images": [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1548663545-a14a38f692cc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      },
      {
        "name": "Burgundy",
        "hex": "#800020"
      },
      {
        "name": "Grey",
        "hex": "#808080"
      }
    ],
    "sizes": ["XS", "S", "M", "L", "XL"],
    "category": "women",
    "tags": ["leggings", "yoga", "activewear", "workout"],
    "createdAt": "2025-01-05T16:30:00.000Z",
    "updatedAt": "2025-05-15T12:45:00.000Z"
  },
  {
    "name": "Formal Oxford Shirt",
    "brand": "GentlemenEssentials",
    "description": "Crisp cotton oxford shirt with button-down collar. Perfect for formal occasions or professional settings.",
    "price": 69.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1598032895397-b9472444bf93?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1588359348347-9bc6cbbb689e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "White",
        "hex": "#FFFFFF"
      },
      {
        "name": "Light Blue",
        "hex": "#ADD8E6"
      },
      {
        "name": "Pink",
        "hex": "#FFC0CB"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "men",
    "tags": ["shirt", "formal", "oxford", "business"],
    "createdAt": "2025-03-20T09:30:00.000Z",
    "updatedAt": "2025-03-20T09:30:00.000Z"
  },
  {
    "name": "Silk Blouse",
    "brand": "LuxuryWear",
    "description": "Elegant silk blouse with relaxed fit and hidden button placket. Versatile piece for work or special occasions.",
    "price": 89.99,
    "salePrice": 69.99,
    "sale": true,
    "salePercentage": 22,
    "images": [
      "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1552474840-2c3147722cb7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Ivory",
        "hex": "#FFFFF0"
      },
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      }
    ],
    "sizes": ["XS", "S", "M", "L"],
    "category": "women",
    "tags": ["blouse", "silk", "formal", "workwear"],
    "createdAt": "2025-02-25T11:45:00.000Z",
    "updatedAt": "2025-05-10T10:30:00.000Z"
  },
  {
    "name": "Vintage Denim Jacket",
    "brand": "DenimCo",
    "description": "Classic denim jacket with a vintage wash and button front. Features chest pockets and adjustable waistband.",
    "price": 89.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1527016021513-b09758b777bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Light Blue",
        "hex": "#ADD8E6"
      },
      {
        "name": "Dark Blue",
        "hex": "#00008B"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "unisex",
    "tags": ["jacket", "denim", "vintage", "casual"],
    "createdAt": "2025-01-30T15:20:00.000Z",
    "updatedAt": "2025-01-30T15:20:00.000Z"
  },
  {
    "name": "Performance Running Shoes",
    "brand": "SportiFit",
    "description": "Lightweight running shoes with responsive cushioning and breathable mesh upper. Ideal for long-distance runs.",
    "price": 129.99,
    "salePrice": 99.99,
    "sale": true,
    "salePercentage": 23,
    "images": [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Black/Red",
        "hex": "#FF0000"
      },
      {
        "name": "Grey/Blue",
        "hex": "#0000FF"
      },
      {
        "name": "White/Green",
        "hex": "#00FF00"
      }
    ],
    "sizes": ["S", "M", "L"],
    "category": "unisex",
    "tags": ["shoes", "running", "athletic", "performance"],
    "createdAt": "2025-03-10T12:10:00.000Z",
    "updatedAt": "2025-06-02T09:45:00.000Z"
  },
  {
    "name": "Hooded Sweatshirt",
    "brand": "UrbanEdge",
    "description": "Cozy cotton-blend hoodie with kangaroo pocket and adjustable drawstring hood. Perfect for layering.",
    "price": 49.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1572495673508-57984d990abb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Grey",
        "hex": "#808080"
      },
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      },
      {
        "name": "Burgundy",
        "hex": "#800020"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "unisex",
    "tags": ["hoodie", "sweatshirt", "casual", "streetwear"],
    "createdAt": "2025-02-05T13:15:00.000Z",
    "updatedAt": "2025-02-05T13:15:00.000Z"
  },
  {
    "name": "Pleated Midi Skirt",
    "brand": "Blooms",
    "description": "Elegant pleated midi skirt with elastic waistband. Versatile piece that transitions from day to evening.",
    "price": 69.99,
    "salePrice": 49.99,
    "sale": true,
    "salePercentage": 29,
    "images": [
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1557418669-db3f781a58c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      },
      {
        "name": "Burgundy",
        "hex": "#800020"
      }
    ],
    "sizes": ["XS", "S", "M", "L"],
    "category": "women",
    "tags": ["skirt", "midi", "pleated", "formal"],
    "createdAt": "2025-03-15T10:45:00.000Z",
    "updatedAt": "2025-05-20T14:30:00.000Z"
  },
  {
    "name": "Waterproof Hiking Jacket",
    "brand": "OutdoorElements",
    "description": "Technical waterproof jacket with sealed seams and adjustable hood. Designed for challenging weather conditions.",
    "price": 159.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1557128398-e076a6c64d5f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Red",
        "hex": "#FF0000"
      },
      {
        "name": "Blue",
        "hex": "#0000FF"
      },
      {
        "name": "Black",
        "hex": "#000000"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "unisex",
    "tags": ["jacket", "hiking", "waterproof", "outdoor"],
    "createdAt": "2025-01-25T11:30:00.000Z",
    "updatedAt": "2025-01-25T11:30:00.000Z"
  },
  {
    "name": "Linen Button-Down Shirt",
    "brand": "NordStyle",
    "description": "Lightweight linen shirt with relaxed fit and button-down front. Perfect for warm weather and casual occasions.",
    "price": 59.99,
    "salePrice": 39.99,
    "sale": true,
    "salePercentage": 33,
    "images": [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "White",
        "hex": "#FFFFFF"
      },
      {
        "name": "Beige",
        "hex": "#F5F5DC"
      },
      {
        "name": "Light Blue",
        "hex": "#ADD8E6"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "men",
    "tags": ["shirt", "linen", "summer", "casual"],
    "createdAt": "2025-03-25T14:50:00.000Z",
    "updatedAt": "2025-05-30T11:15:00.000Z"
  },
  {
    "name": "Leather Crossbody Bag",
    "brand": "LuxuryWear",
    "description": "Compact leather crossbody bag with adjustable strap and multiple compartments. Stylish accessory for everyday use.",
    "price": 119.99,
    "salePrice": 89.99,
    "sale": true,
    "salePercentage": 25,
    "images": [
      "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Brown",
        "hex": "#964B00"
      },
      {
        "name": "Tan",
        "hex": "#D2B48C"
      }
    ],
    "sizes": ["S", "M"],
    "category": "accessories",
    "tags": ["bag", "leather", "crossbody", "accessory"],
    "createdAt": "2025-02-20T10:15:00.000Z",
    "updatedAt": "2025-06-04T16:10:00.000Z"
  },
  {
    "name": "Fitted Blazer",
    "brand": "GentlemenEssentials",
    "description": "Classic fitted blazer with notched lapels and two-button closure. Versatile piece for formal and smart-casual outfits.",
    "price": 149.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Navy",
        "hex": "#000080"
      },
      {
        "name": "Charcoal",
        "hex": "#36454F"
      },
      {
        "name": "Black",
        "hex": "#000000"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "men",
    "tags": ["blazer", "formal", "jacket", "business"],
    "createdAt": "2025-03-05T15:40:00.000Z",
    "updatedAt": "2025-03-05T15:40:00.000Z"
  },
  {
    "name": "Knit Beanie Hat",
    "brand": "UrbanEdge",
    "description": "Warm knit beanie with ribbed cuff. Simple design perfect for cold weather.",
    "price": 24.99,
    "salePrice": 19.99,
    "sale": true,
    "salePercentage": 20,
    "images": [
      "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517686175653-241ea34c495b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Grey",
        "hex": "#808080"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      },
      {
        "name": "Burgundy",
        "hex": "#800020"
      }
    ],
    "sizes": ["S", "M", "L"],
    "category": "unisex",
    "tags": ["hat", "beanie", "winter", "accessory"],
    "createdAt": "2025-01-15T09:20:00.000Z",
    "updatedAt": "2025-05-25T13:40:00.000Z"
  },
  {
    "name": "Lounge Sweatpants",
    "brand": "ZenFlex",
    "description": "Soft cotton blend sweatpants with elastic waistband and cuffs. Designed for maximum comfort at home.",
    "price": 39.99,
    "salePrice": null,
    "sale": false,
    "salePercentage": 0,
    "images": [
      "https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600369671738-fa7f2fc1ec53?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Grey",
        "hex": "#808080"
      },
      {
        "name": "Black",
        "hex": "#000000"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      }
    ],
    "sizes": ["S", "M", "L", "XL"],
    "category": "unisex",
    "tags": ["sweatpants", "lounge", "comfort", "casual"],
    "createdAt": "2025-02-28T12:35:00.000Z",
    "updatedAt": "2025-02-28T12:35:00.000Z"
  },
  {
    "name": "Wrap Midi Dress",
    "brand": "Blooms",
    "description": "Elegant wrap dress with V-neckline and tie waist. Flattering silhouette suitable for multiple occasions.",
    "price": 79.99,
    "salePrice": 59.99,
    "sale": true,
    "salePercentage": 25,
    "images": [
      "https://images.unsplash.com/photo-1619086303291-0ef7699e4b31?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566174053879-31528523f8c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    ],
    "colors": [
      {
        "name": "Burgundy",
        "hex": "#800020"
      },
      {
        "name": "Navy",
        "hex": "#000080"
      },
      {
        "name": "Emerald",
        "hex": "#50C878"
      }
    ],
    "sizes": ["XS", "S", "M", "L"],
    "category": "women",
    "tags": ["dress", "wrap", "midi", "formal"],
    "createdAt": "2025-03-18T11:25:00.000Z",
    "updatedAt": "2025-06-10T15:50:00.000Z"
  },

  {
      name: "Velvra Architectural Wool Coat",
      brand: "Velvra",
      description: "A sculptural masterpiece in virgin wool, featuring precise tailoring and an oversized silhouette that redefines contemporary outerwear.",
      price: 42000,
      salePrice: 42000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1544966503-7cc5ac882d5c?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Charcoal", hex: "#36454f" },
        { name: "Ivory", hex: "#fffff0" },
        { name: "Camel", hex: "#c19a6b" }
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      category: "women",
      tags: ["coat", "wool", "premium", "editorial", "outerwear"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Maison Lumière Silk Midi Dress",
      brand: "Maison Lumière",
      description: "Fluid silk crepe dress with minimalist draping and an asymmetrical hemline. Modern elegance distilled to its purest form.",
      price: 28000,
      salePrice: 19600,
      sale: true,
      salePercentage: 30,
      images: [
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583496661160-fb5886a13804?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Sage", hex: "#9caf88" },
        { name: "Midnight", hex: "#191970" }
      ],
      sizes: ["XS", "S", "M", "L"],
      category: "women",
      tags: ["dress", "silk", "midi", "minimalist", "editorial"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Studio Oversized Hoodie",
      brand: "Velvra",
      description: "Luxury streetwear reimagined in premium cotton fleece. Oversized fit with architectural details and tonal embroidery.",
      price: 16000,
      salePrice: 16000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Stone", hex: "#928e85" },
        { name: "Black", hex: "#000000" },
        { name: "Cream", hex: "#f5f5dc" }
      ],
      sizes: ["S", "M", "L", "XL"],
      category: "unisex",
      tags: ["hoodie", "streetwear", "premium", "oversized", "cotton"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Noiré Tailored Blazer",
      brand: "Noiré",
      description: "Sharp-shouldered blazer in Italian wool-silk blend. Contemporary power dressing with subtle feminine undertones.",
      price: 35000,
      salePrice: 24500,
      sale: true,
      salePercentage: 30,
      images: [
        "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1616847220575-5d4ad0bb52a9?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Navy", hex: "#000080" },
        { name: "Pinstripe Grey", hex: "#708090" }
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      category: "women",
      tags: ["blazer", "tailored", "formalwear", "wool", "professional"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Deconstructed Denim Jacket",
      brand: "Velvra",
      description: "Classic trucker jacket reimagined with raw edges and asymmetrical seaming. Premium Japanese selvedge denim meets avant-garde design.",
      price: 22000,
      salePrice: 22000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Indigo", hex: "#4b0082" },
        { name: "Washed Black", hex: "#2f2f2f" }
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      category: "unisex",
      tags: ["denim", "jacket", "deconstructed", "selvedge", "streetwear"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Maison Lumière Leather Ankle Boots",
      brand: "Maison Lumière",
      description: "Hand-crafted Italian leather boots with architectural heel and minimalist silhouette. Modern luxury grounded in artisanal tradition.",
      price: 32000,
      salePrice: 25600,
      sale: true,
      salePercentage: 20,
      images: [
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Black", hex: "#000000" },
        { name: "Cognac", hex: "#9f4a00" },
        { name: "Taupe", hex: "#483c32" }
      ],
      sizes: ["36", "37", "38", "39", "40", "41"],
      category: "women",
      tags: ["boots", "leather", "luxury", "italian", "ankle"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Cashmere Turtleneck",
      brand: "Velvra",
      description: "Ultra-fine Mongolian cashmere in a relaxed fit. The perfect foundation piece for modern layering and effortless sophistication.",
      price: 18000,
      salePrice: 14400,
      sale: true,
      salePercentage: 20,
      images: [
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1609205807107-171bd2ba5cdf?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Oatmeal", hex: "#f0e68c" },
        { name: "Charcoal", hex: "#36454f" },
        { name: "Ivory", hex: "#fffff0" }
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      category: "women",
      tags: ["turtleneck", "cashmere", "luxury", "basics", "layering"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Noiré Wide-Leg Trousers",
      brand: "Noiré",
      description: "High-waisted trousers in virgin wool crepe with flowing wide legs. Timeless elegance meets contemporary proportions.",
      price: 24000,
      salePrice: 24000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1609205807107-171bd2ba5cdf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1566479179817-0dc17b12d02d?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Black", hex: "#000000" },
        { name: "Camel", hex: "#c19a6b" },
        { name: "Navy", hex: "#000080" }
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      category: "women",
      tags: ["trousers", "wide-leg", "wool", "high-waisted", "editorial"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Minimalist T-Shirt",
      brand: "Velvra",
      description: "Premium Pima cotton tee with perfect drape and subtle texture. Elevated basics that form the foundation of a modern wardrobe.",
      price: 9000,
      salePrice: 6300,
      sale: true,
      salePercentage: 30,
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583743814966-8936f37f4efa?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "White", hex: "#ffffff" },
        { name: "Black", hex: "#000000" },
        { name: "Stone Grey", hex: "#928e85" }
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      category: "unisex",
      tags: ["t-shirt", "cotton", "basics", "minimalist", "pima"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Maison Lumière Silk Scarf",
      brand: "Maison Lumière",
      description: "Hand-rolled silk twill scarf featuring abstract geometric patterns. A sophisticated accent piece for the discerning wardrobe.",
      price: 12000,
      salePrice: 12000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1596467173082-b33b2a25f5c6?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1609205807107-171bd2ba5cdf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1616847220575-5d4ad0bb52a9?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Emerald", hex: "#50c878" },
        { name: "Burgundy", hex: "#800020" }
      ],
      sizes: ["One Size"],
      category: "women",
      tags: ["scarf", "silk", "accessories", "luxury", "geometric"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Structured Shoulder Bag",
      brand: "Velvra",
      description: "Architectural leather handbag with clean lines and minimal hardware. Contemporary craftsmanship meets timeless functionality.",
      price: 38000,
      salePrice: 30400,
      sale: true,
      salePercentage: 20,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Black", hex: "#000000" },
        { name: "Tan", hex: "#d2b48c" }
      ],
      sizes: ["One Size"],
      category: "women",
      tags: ["handbag", "leather", "structured", "luxury", "accessories"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Noiré Silk Slip Dress",
      brand: "Noiré",
      description: "Bias-cut silk charmeuse dress with delicate spaghetti straps. Understated sensuality in its most refined form.",
      price: 26000,
      salePrice: 15600,
      sale: true,
      salePercentage: 40,
      images: [
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583496661160-fb5886a13804?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Champagne", hex: "#f7e7ce" },
        { name: "Black", hex: "#000000" },
        { name: "Deep Rose", hex: "#c21807" }
      ],
      sizes: ["XS", "S", "M", "L"],
      category: "women",
      tags: ["dress", "silk", "slip", "bias-cut", "evening"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Men's Merino Crew Neck",
      brand: "Velvra",
      description: "Extra-fine merino wool sweater with a perfect fit. Sophisticated comfort for the modern gentleman's wardrobe.",
      price: 20000,
      salePrice: 20000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Navy", hex: "#000080" },
        { name: "Heather Grey", hex: "#d3d3d3" },
        { name: "Forest Green", hex: "#228b22" }
      ],
      sizes: ["S", "M", "L", "XL"],
      category: "men",
      tags: ["sweater", "merino", "crew-neck", "luxury", "wool"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Maison Lumière Pleated Midi Skirt",
      brand: "Maison Lumière",
      description: "Knife-pleated skirt in luxurious wool gabardine. Classic tailoring with a contemporary edge and fluid movement.",
      price: 21000,
      salePrice: 21000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1609205807107-171bd2ba5cdf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1616847220575-5d4ad0bb52a9?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1566479179817-0dc17b12d02d?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Camel", hex: "#c19a6b" },
        { name: "Black", hex: "#000000" }
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      category: "women",
      tags: ["skirt", "pleated", "midi", "wool", "tailored"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Leather Chelsea Boots",
      brand: "Velvra",
      description: "Italian calfskin Chelsea boots with refined proportions and subtle elastic goring. Timeless style with contemporary comfort.",
      price: 35000,
      salePrice: 28000,
      sale: true,
      salePercentage: 20,
      images: [
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Black", hex: "#000000" },
        { name: "Cognac Brown", hex: "#9f4a00" }
      ],
      sizes: ["40", "41", "42", "43", "44", "45"],
      category: "men",
      tags: ["boots", "chelsea", "leather", "italian", "luxury"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Noiré Asymmetric Hem Top",
      brand: "Noiré",
      description: "Fluid viscose top with dramatic asymmetric hemline and subtle draping. Modern femininity with architectural undertones.",
      price: 15000,
      salePrice: 10500,
      sale: true,
      salePercentage: 30,
      images: [
        "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1583743814966-8936f37f4efa?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1609205807107-171bd2ba5cdf?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Sage Green", hex: "#9caf88" },
        { name: "Black", hex: "#000000" }
      ],
      sizes: ["XS", "S", "M", "L"],
      category: "women",
      tags: ["top", "asymmetric", "viscose", "draping", "contemporary"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Velvra Tailored Chinos",
      brand: "Velvra",
      description: "Precision-cut chinos in premium cotton twill with refined details. Smart-casual sophistication for the discerning wardrobe.",
      price: 17000,
      salePrice: 17000,
      sale: false,
      salePercentage: 0,
      images: [
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Khaki", hex: "#c3b091" },
        { name: "Navy", hex: "#000080" },
        { name: "Stone", hex: "#928e85" }
      ],
      sizes: ["30", "32", "34", "36", "38"],
      category: "men",
      tags: ["chinos", "cotton", "tailored", "smart-casual", "trousers"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: "Maison Lumière Statement Earrings",
      brand: "Maison Lumière",
      description: "Sculptural gold-plated earrings with geometric forms. Bold yet refined pieces that elevate any ensemble.",
      price: 14000,
      salePrice: 11200,
      sale: true,
      salePercentage: 20,
      images: [
        "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1616847220575-5d4ad0bb52a9?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1609205807107-171bd2ba5cdf?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=1000&fit=crop"
      ],
      colors: [
        { name: "Gold", hex: "#ffd700" },
        { name: "Silver", hex: "#c0c0c0" }
      ],
      sizes: ["One Size"],
      category: "women",
      tags: ["earrings", "jewelry", "gold-plated", "statement", "sculptural"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
]

module.exports = sampleProducts;
