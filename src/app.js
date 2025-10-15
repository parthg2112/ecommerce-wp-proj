// Cart management
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Hardcoded products - updated with salad names
const products = [
    { product_id: 1, name: 'Summer Salad', price: 125, image: '/images/plate-1.png' },
    { product_id: 2, name: 'Russian Salad', price: 150, image: '/images/plate-2.png' },
    { product_id: 3, name: 'Greek Salad', price: 150, image: '/images/plate-3.png' },
    { product_id: 4, name: 'Cottage Pie', price: 175, image: '/images/plate-3.png' },
    { product_id: 5, name: 'Caesar Salad', price: 135, image: '/images/plate-1.png' },
    { product_id: 6, name: 'Garden Salad', price: 120, image: '/images/plate-2.png' }
];

// Initialize
$(document).ready(function(){
    // Initialize slider if present
    if ($('.food-slider').length) {
        $('.food-slider').slick({
            autoplay: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            prevArrow: ".prev-btn",
            nextArrow: ".next-btn",
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 2
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        slidesToShow: 1
                    }
                }
            ]
        });
    }
    
    updateCartCount();
    setupCartButtons();
    
    // Initialize cart page if on cart page
    if (window.location.pathname.includes('cart.html')) {
        renderCart();
    }
});

// Setup add to cart buttons
function setupCartButtons() {
    $('.add-to-cart').off('click').on('click', function(e) {
        e.preventDefault();
        const id = parseInt($(this).data('product-id'));
        const product = products.find(p => p.product_id === id);
        
        if (product) {
            const existingItem = cart.find(item => item.product_id === id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }
            
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            showNotification('Added to cart!');
        }
    });
}

// Update cart count
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    $('.cart-badge').text(count);
}

// Show notification
function showNotification(message) {
    const notif = $('<div class="notification">' + message + '</div>');
    $('body').append(notif);
    setTimeout(() => notif.addClass('show'), 10);
    setTimeout(() => {
        notif.removeClass('show');
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// Cart page functions
function renderCart() {
    const container = $('#cart-items');
    const billContainer = $('#bill-details');
    
    if (!container.length) return;
    
    if (cart.length === 0) {
        container.html('<p class="empty-cart">Your cart is empty</p>');
        billContainer.html('');
        return;
    }
    
    container.html(cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p class="item-price">${item.price.toFixed(2)}</p>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="updateQty(${item.product_id}, -1)">−</button>
                <span class="quantity">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQty(${item.product_id}, 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeItem(${item.product_id})">×</button>
        </div>
    `).join(''));
    
    const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxes = itemTotal * 0.05;
    const total = itemTotal + taxes;
    
    billContainer.html(`
        <h2>Bill Details</h2>
        <div class="bill-row"><span>Item Total</span><span>${itemTotal.toFixed(2)}</span></div>
        <div class="bill-row"><span>Taxes & Charges</span><span>${taxes.toFixed(2)}</span></div>
        <hr>
        <div class="bill-row total"><span>TO PAY</span><span>${total.toFixed(2)}</span></div>
        <button class="btn btn-primary place-order-btn" onclick="placeOrder()">Place Order</button>
    `);
}

// Update quantity
function updateQty(id, change) {
    const item = cart.find(i => i.product_id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.product_id !== id);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }
}

// Remove item
function removeItem(id) {
    cart = cart.filter(i => i.product_id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

// Place order - FIXED: Use relative URL
async function placeOrder() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }
    
    const itemTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxes = itemTotal * 0.05;
    const total = itemTotal + taxes;
    
    const orderData = {
        items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
        })),
        total_price: total.toFixed(2)
    };
    
    try {
        // CHANGED: Use relative URL instead of hardcoded localhost
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showOrderSuccess(data.order_id);
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        } else {
            showNotification('Order failed. Please try again.');
        }
    } catch (error) {
        console.error('Order error:', error);
        showNotification('Error placing order. Please try again.');
    }
}

// Show order success
function showOrderSuccess(orderId) {
    const modal = $(`
        <div class="order-modal">
            <div class="order-success">
                <div class="checkmark-circle">
                    <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
                        <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
                <h2>ORDER PLACED!</h2>
                <p>Order ID: #${orderId.toString().padStart(6, '0')}</p>
                <button class="btn btn-primary" onclick="continueShopping()">Continue Shopping</button>
            </div>
        </div>
    `);
    
    $('body').append(modal);
    setTimeout(() => modal.addClass('show'), 10);
}

// Continue shopping
function continueShopping() {
    $('.order-modal').remove();
    window.location.href = '../index.html';
}


