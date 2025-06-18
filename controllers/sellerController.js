const Seller = require('../models/Seller');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const { sellerSchema } = require('../validations/sellerValidation');
const Product = require('../models/product');
const Order = require('../models/order');

// Render the seller form page
exports.renderSellerForm = (req, res) => {
  res.render('page/seller', { errors: req.flash('error'), old: req.flash('old')[0] || {} });
};

// Handle seller registration POST
exports.handleSellerRegistration = async (req, res) => {
  try {
    // Joi validation
    const joiData = { ...req.body };
    // Convert file fields to string for Joi (phone, panVatNumber)
    joiData.phone = String(joiData.phone);
    joiData.panVatNumber = String(joiData.panVatNumber);
    const { error: joiError } = sellerSchema.validate(joiData, { abortEarly: false });
    if (joiError) {
      req.flash('error', joiError.details.map(e => e.message));
      req.flash('old', req.body);
      return res.redirect('/seller');
    }

    // Validate fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array().map(e => e.msg));
      req.flash('old', req.body);
      return res.redirect('/seller');
    }

    // Handle file upload (panVatDocument)
    if (!req.files || !req.files.panVatDocument) {
      req.flash('error', 'PAN/VAT registration document is required');
      req.flash('old', req.body);
      return res.redirect('/seller');
    }
    const file = req.files.panVatDocument;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.mimetype)) {
      req.flash('error', 'Invalid file type for PAN/VAT document');
      req.flash('old', req.body);
      return res.redirect('/seller');
    }
    if (file.size > 5 * 1024 * 1024) {
      req.flash('error', 'PAN/VAT document must be less than 5MB');
      req.flash('old', req.body);
      return res.redirect('/seller');
    }
    // Save file
    const uploadDir = path.join(__dirname, '../public/uploads/panvat');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    await file.mv(filePath);
    const fileUrl = `/uploads/panvat/${fileName}`;

    // Save seller data
    const seller = new Seller({
      user: req.user._id,
      brandName: req.body.brandName,
      instagram: req.body.instagram,
      contactPerson: req.body.contactPerson,
      phone: req.body.phone,
      email: req.body.email,
      businessType: req.body.businessType,
      ownerName: req.body.ownerName,
      panVatNumber: req.body.panVatNumber,
      panVatDocument: fileUrl,
      location: req.body.location,
      city: req.body.city,
      message: req.body.message
    });
    await seller.save();

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { role: 'seller' });

    // Redirect to seller dashboard
    res.redirect('/seller/dashboard');
  } catch (err) {
    console.error('Seller registration error:', err);
    req.flash('error', 'An error occurred while processing your application. Please try again.');
    req.flash('old', req.body);
    res.redirect('/seller');
  }
};

// Seller Dashboard - Dynamic Data
exports.getSellerDashboard = async (req, res) => {
  try {
    // 1. Find the seller for the logged-in user
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) return res.redirect('/seller');

    // 2. Get all products for this seller
    const products = await Product.find({ seller: seller._id });
    const productIds = products.map(p => p._id);

    // 3. Get all orders that include any of the seller's products
    const orders = await Order.find({ 'items.seller': seller._id }).lean();

    // 4. Calculate stats
    let totalEarnings = 0;
    let pendingOrders = [];
    let completedOrders = [];
    let returns = 0;
    let productSales = {};
    let chartData = {};
    let orderHistory = [];

    orders.forEach(order => {
      let sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
      let orderTotalForSeller = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      if (order.orderStatus === 'pending' || order.orderStatus === 'processing') {
        pendingOrders.push({ ...order, sellerItems });
      }
      if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
        completedOrders.push({ ...order, sellerItems });
        totalEarnings += orderTotalForSeller;
      }
      // Count returns (if you have a returns field, otherwise skip)
      // if (order.orderStatus === 'returned') returns++;
      // Count sales per product
      sellerItems.forEach(item => {
        productSales[item.product] = (productSales[item.product] || 0) + item.quantity;
      });
      // Chart data: group by day
      const day = new Date(order.createdAt).toISOString().slice(0, 10);
      chartData[day] = (chartData[day] || 0) + orderTotalForSeller;
      // Order history for table
      orderHistory.push({ ...order, sellerItems });
    });

    // Top product by sales
    let topProductId = Object.keys(productSales).sort((a, b) => productSales[b] - productSales[a])[0];
    let topProduct = products.find(p => p._id.equals(topProductId));
    let topProductSales = productSales[topProductId] || 0;

    // Inventory stats using new fields
    let lowStock = products.filter(p => p.inStock && p.stock <= 3 && p.stock > 0);
    let outOfStock = products.filter(p => !p.inStock || p.stock === 0);
    let inStock = products.filter(p => p.inStock && p.stock > 0).length;

    // Chart data for last 7 days
    const chartLabels = [];
    const chartValues = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      chartLabels.push(key);
      chartValues.push(chartData[key] || 0);
    }

    res.render('page/sellerDashboard', {
      user: req.user,
      seller,
      products,
      orders,
      pendingOrders,
      completedOrders,
      totalEarnings,
      returns,
      topProduct,
      topProductSales,
      productSales,
      lowStock,
      outOfStock,
      inStock,
      chartLabels,
      chartValues,
      orderHistory
    });
  } catch (err) {
    console.error('Seller dashboard error:', err);
    res.status(500).render('page/sellerDashboard', { error: 'Failed to load dashboard', user: req.user });
  }
}; 