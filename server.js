const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = 6010;
const db = new sqlite3.Database('./ecommerce.db');

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_on DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        rating DECIMAL(2, 1),
        image_url TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 1,
        total_price DECIMAL(10, 2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
    )`);

    // Insert sample products
    db.get('SELECT COUNT(*) as count FROM products', [], (err, row) => {
        if (!err && row.count === 0) {
            const products = [
                ['Summer Salad', 'Salad', 125, 4.0, '/images/plate-1.png'],
                ['Russian Salad', 'Salad', 150, 3.0, '/images/plate-2.png'],
                ['Greek Salad', 'Salad', 150, 4.0, '/images/plate-3.png'],
                ['Cottage Pie', 'Main Course', 175, 5.0, '/images/plate-3.png'],
                ['Caesar Salad', 'Salad', 135, 4.5, '/images/plate-1.png'],
                ['Garden Salad', 'Salad', 120, 4.0, '/images/plate-2.png']
            ];
            const stmt = db.prepare('INSERT INTO products (name, type, price, rating, image_url) VALUES (?, ?, ?, ?, ?)');
            products.forEach(p => stmt.run(p));
            stmt.finalize();
            console.log('✓ Sample products inserted');
        }
    });
});

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// Parse JSON body
function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch(e) {
                resolve({});
            }
        });
    });
}

// Create server
const server = http.createServer(async (req, res) => {
    const url = req.url;
    const method = req.method;

    //CORS HEADERS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${method} ${url}`);

    // API Routes
    if (url === '/api/products' && method === 'GET') {
        db.all('SELECT * FROM products', [], (err, rows) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ products: rows || [] }));
        });
        return;
    }

    if (url === '/api/orders' && method === 'POST') {
        const { items, total_price } = await parseBody(req);
        
        db.run('INSERT INTO orders (user_id, total_price) VALUES (1, ?)', [total_price], function(err) {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                return;
            }

            const orderId = this.lastID;
            const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
            items.forEach(item => stmt.run([orderId, item.product_id, item.quantity, item.price]));
            stmt.finalize();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, order_id: orderId }));
        });
        return;
    }

    // Static file serving - serve from src folder
    let filePath;
    
    if (url === '/') {
        filePath = 'index.html';
    } else if (url.startsWith('/src/')) {
        filePath = `.${url}`;
    } else if (url.startsWith('/fonts/') || url.startsWith('/images/') || url.startsWith('/icons/')) {
        filePath = `.${url}`;
    } else {
        // Try src folder first for HTML, CSS, JS
        filePath = `./src${url}`;
    }
    
    // Security check
    if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // If not found in src, try root
            const rootPath = `.${url}`;
            fs.readFile(rootPath, (err2, data2) => {
                if (err2) {
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }
                const ext = path.extname(rootPath);
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                res.end(data2);
            });
            return;
        }
        
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Database initialized');
});
