const Product = require('../models/product');
const Order = require('../models/order');
const cartCheck = require('../middleware/user-cart-control');
exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find();
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products',
            isAuthenticated: req.session.isLoggedIn,
        });
    } catch (err) {
        console.log(err);
    }
};

exports.getProduct = async (req, res, next) => {
    const prodId = req.params.productId;
    try {
        const product = await Product.findById(prodId);
        res.render('shop/product-detail', {
            product: product,
            pageTitle: product.title,
            path: '/products',
            isAuthenticated: req.session.isLoggedIn,
        });
    } catch (err) {
        console.log(err);
    }
};

exports.getIndex = async (req, res, next) => {
    try {
        const products = await Product.find();
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
        });
    } catch (err) {
        console.log(err);
    }
};

exports.getCart = async (req, res, next) => {
    try { 
      await cartCheck(req.user._id);
   
      const user = await req.user.populate('cart.items.productId');
      
      const userCart = user.cart.items.filter(item => item.productId !== null);
   
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: userCart,
        
      });
    } catch (err) {
      console.error(err);
    }
  };

exports.postCart = async (req, res, next) => {
    const prodId = req.body.productId;
    try {
        const product = await Product.findById(prodId);
        await req.user.addToCart(product);
        res.redirect('/cart');
    } catch (err) {
        console.log(err);
    }
};

exports.postCartDeleteProduct = async (req, res, next) => {
    const prodId = req.body.productId;
    try {
        await req.user.removeFromCart(prodId);
        res.redirect('/cart');
    } catch (err) {
        console.log(err);
    }
};

exports.postOrder = async (req, res, next) => {
    try {
        const user = await req.user.populate('cart.items.productId');
        const products = user.cart.items.map(i => {
            return { quantity: i.quantity, product: { ...i.productId._doc } };
        });
        const order = new Order({
            user: {
                email: req.user.email,
                userId: req.user,
            },
            products: products,
        });
        await order.save();
        await req.user.clearCart();
        res.redirect('/orders');
    } catch (err) {
        console.log(err);
    }
};

exports.getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ 'user.userId': req.user._id });
        res.render('shop/orders', {
            path: '/orders',
            pageTitle: 'Your Orders',
            orders: orders,
            isAuthenticated: req.session.isLoggedIn,
        });
    } catch (err) {
        console.log(err);
    }
};
