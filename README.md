# ecommerce-wp-proj

Food ordering store with a vanilla HTML/CSS/JS frontend and a dependency-free Node.js backend backed by SQLite.

## Features

- Menu listing with a responsive food slider (slick carousel)
- Cart with localStorage persistence, quantity controls, and a bill breakdown with taxes
- Order placement against a REST endpoint, with an order-success modal
- Node HTTP server with static file serving, CORS headers, and path-traversal protection
- SQLite database auto-initialized with users, products, orders, and order_items tables; sample products seeded on first run

## Tech Stack

Node.js (built-in `http` module), SQLite3, jQuery, slick-carousel

## Setup

```bash
npm install
npm start
```

The server runs on http://localhost:6010.

## API

| endpoint | method | description |
|---|---|---|
| `/api/products` | GET | list all products |
| `/api/orders` | POST | place an order (`{ items, total_price }`) |

No environment variables required; `ecommerce.db` is created automatically.
