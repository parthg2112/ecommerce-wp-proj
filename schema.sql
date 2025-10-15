-- schema.sql
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_on DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(2, 1),
    image_url TEXT
);

CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

-- Insert sample products
INSERT INTO products (name, type, price, rating, image_url) VALUES
('BATATA WADA', 'Snack', 32.00, 4.5, './images/food1.png'),
('BREAD BUTTER', 'Breakfast', 23.00, 4.2, './images/food2.png'),
('BUN MASKA', 'Breakfast', 25.00, 4.8, './images/food3.png'),
('PANI PURI', 'Snack', 30.00, 4.7, './images/food4.png'),
('DOSA', 'Breakfast', 45.00, 4.6, './images/food5.png'),
('SAMOSA', 'Snack', 20.00, 4.3, './images/food6.png');
