const Analytics = require('../models/analytics');
const Order = require('../models/order');
const Product = require('../models/product');
const Seller = require('../models/Seller');
const Review = require('../models/Review');
const asyncWrap = require('../utils/asyncWrap');
const AppError = require('../utils/AppError');

// Track user interaction
const trackInteraction = asyncWrap(async (req, res) => {
  const { productId, action, sessionId } = req.body;
  
  if (!productId || !action || !sessionId) {
    throw new AppError('Missing required fields', 400);
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const analytics = new Analytics({
    product: productId,
    seller: product.seller,
    user: req.user?._id,
    action,
    sessionId,
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
    referrer: req.get('Referrer')
  });

  await analytics.save();
  
  res.status(200).json({ success: true });
});

// Get seller performance analytics
const getSellerAnalytics = asyncWrap(async (req, res) => {
  const { period = 'week' } = req.query;
  const seller = await Seller.findOne({ user: req.user._id });
  
  if (!seller) {
    throw new AppError('Seller not found', 404);
  }

  // Calculate date range based on period
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  endDate = now;

  // Get analytics data
  const analyticsData = await Analytics.aggregate([
    {
      $match: {
        seller: seller._id,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.action',
        dailyData: {
          $push: {
            date: '$_id.date',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);

  // Get previous period data for comparison
  const previousStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
  const previousAnalyticsData = await Analytics.aggregate([
    {
      $match: {
        seller: seller._id,
        timestamp: { $gte: previousStartDate, $lt: startDate }
      }
    },
    {
      $group: {
        _id: '$action',
        total: { $sum: 1 }
      }
    }
  ]);

  // Get orders data
  const orders = await Order.find({
    'items.seller': seller._id,
    createdAt: { $gte: startDate, $lte: endDate }
  }).populate('items.product');

  const previousOrders = await Order.find({
    'items.seller': seller._id,
    createdAt: { $gte: previousStartDate, $lt: startDate }
  }).populate('items.product');

  // Calculate revenue and order metrics
  let totalRevenue = 0;
  let totalOrders = 0;
  let completedOrders = 0;
  let productSales = {};

  orders.forEach(order => {
    const sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
    const orderTotalForSeller = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
      totalRevenue += orderTotalForSeller;
      completedOrders++;
    }
    
    totalOrders++;
    
    sellerItems.forEach(item => {
      if (item.product) {
        const productId = String(item.product._id);
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: item.product.name,
            image: item.product.images[0],
            sales: 0,
            revenue: 0
          };
        }
        productSales[productId].sales += item.quantity;
        productSales[productId].revenue += item.totalPrice || 0;
      }
    });
  });

  // Calculate previous period metrics
  let previousRevenue = 0;
  let previousOrdersCount = 0;
  let previousCompletedOrders = 0;

  previousOrders.forEach(order => {
    const sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
    const orderTotalForSeller = sellerItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    
    if (order.orderStatus === 'delivered' || order.orderStatus === 'completed') {
      previousRevenue += orderTotalForSeller;
      previousCompletedOrders++;
    }
    previousOrdersCount++;
  });

  // Get top performing products
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Calculate conversion rates
  const analyticsMap = {};
  analyticsData.forEach(item => {
    analyticsMap[item._id] = item.total;
  });

  const previousAnalyticsMap = {};
  previousAnalyticsData.forEach(item => {
    previousAnalyticsMap[item._id] = item.total;
  });

  const views = analyticsMap['view'] || 0;
  const clicks = analyticsMap['click'] || 0;
  const addToCart = analyticsMap['add_to_cart'] || 0;
  const checkout = analyticsMap['checkout'] || 0;
  const purchase = analyticsMap['purchase'] || 0;

  const previousViews = previousAnalyticsMap['view'] || 0;
  const previousClicks = previousAnalyticsMap['click'] || 0;
  const previousAddToCart = previousAnalyticsMap['add_to_cart'] || 0;
  const previousCheckout = previousAnalyticsMap['checkout'] || 0;
  const previousPurchase = previousAnalyticsMap['purchase'] || 0;

  // Calculate conversion funnel
  const conversionFunnel = [
    { stage: 'Views', count: views, percentage: 100 },
    { stage: 'Clicks', count: clicks, percentage: views > 0 ? Math.round((clicks / views) * 100) : 0 },
    { stage: 'Add to Cart', count: addToCart, percentage: clicks > 0 ? Math.round((addToCart / clicks) * 100) : 0 },
    { stage: 'Checkout', count: checkout, percentage: addToCart > 0 ? Math.round((checkout / addToCart) * 100) : 0 },
    { stage: 'Purchase', count: purchase, percentage: checkout > 0 ? Math.round((purchase / checkout) * 100) : 0 }
  ];

  // Calculate performance metrics
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = views > 0 ? (purchase / views) * 100 : 0;
  
  // Calculate customer retention (simplified - based on repeat orders)
  const uniqueCustomers = new Set();
  const repeatCustomers = new Set();
  
  orders.forEach(order => {
    uniqueCustomers.add(String(order.user));
  });
  
  previousOrders.forEach(order => {
    if (uniqueCustomers.has(String(order.user))) {
      repeatCustomers.add(String(order.user));
    }
  });
  
  const customerRetention = uniqueCustomers.size > 0 ? (repeatCustomers.size / uniqueCustomers.size) * 100 : 0;

  // Get average rating
  const reviews = await Review.aggregate([
    {
      $lookup: {
        from: 'products',
        localField: 'productId',
        foreignField: '_id',
        as: 'product'
      }
    },
    {
      $match: {
        'product.seller': seller._id,
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const averageRating = reviews.length > 0 ? reviews[0].averageRating : 0;

  // Calculate percentage changes
  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = calculatePercentageChange(totalRevenue, previousRevenue);
  const viewsChange = calculatePercentageChange(views, previousViews);
  const clicksChange = calculatePercentageChange(clicks, previousClicks);
  const ordersChange = calculatePercentageChange(totalOrders, previousOrdersCount);

  // Generate chart data for sales overview
  const salesChartData = [];
  const ordersChartData = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter(order => 
      order.createdAt.toISOString().slice(0, 10) === dateStr
    );
    
    const dayRevenue = dayOrders.reduce((sum, order) => {
      const sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
      return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.totalPrice || 0), 0);
    }, 0);
    
    salesChartData.push(dayRevenue);
    ordersChartData.push(dayOrders.length);
  }

  // Format dates for chart labels
  const chartLabels = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    chartLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  res.json({
    success: true,
    data: {
      // KPI Cards
      kpis: {
        views: {
          value: views.toLocaleString(),
          change: viewsChange,
          trend: viewsChange >= 0 ? 'up' : 'down'
        },
        clicks: {
          value: clicks.toLocaleString(),
          change: clicksChange,
          trend: clicksChange >= 0 ? 'up' : 'down'
        },
        sales: {
          value: `Rs. ${totalRevenue.toLocaleString()}`,
          change: revenueChange,
          trend: revenueChange >= 0 ? 'up' : 'down'
        },
        returnRate: {
          value: '2.1%', // This would need more complex logic to calculate
          change: -0.5,
          trend: 'down'
        }
      },
      
      // Charts
      charts: {
        salesOverview: {
          labels: chartLabels,
          revenue: salesChartData,
          orders: ordersChartData
        },
        conversionFunnel: conversionFunnel
      },
      
      // Top Products
      topProducts: topProducts,
      
      // Performance Summary
      performanceSummary: {
        averageOrderValue: {
          value: `Rs. ${averageOrderValue.toFixed(2)}`,
          change: calculatePercentageChange(averageOrderValue, previousRevenue / previousOrdersCount || 0),
          trend: 'up'
        },
        conversionRate: {
          value: `${conversionRate.toFixed(1)}%`,
          change: calculatePercentageChange(conversionRate, previousViews > 0 ? (previousPurchase / previousViews) * 100 : 0),
          trend: 'up'
        },
        customerRetention: {
          value: `${customerRetention.toFixed(0)}%`,
          change: 5, // This would need more complex logic
          trend: 'up'
        },
        averageRating: {
          value: averageRating.toFixed(1),
          stars: Math.round(averageRating)
        }
      }
    }
  });
});

// Export analytics data
const exportAnalytics = asyncWrap(async (req, res) => {
  const { period = 'week' } = req.query;
  const seller = await Seller.findOne({ user: req.user._id });
  
  if (!seller) {
    throw new AppError('Seller not found', 404);
  }

  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Get analytics data
  const analytics = await Analytics.find({
    seller: seller._id,
    timestamp: { $gte: startDate, $lte: now }
  }).populate('product');

  // Get orders data
  const orders = await Order.find({
    'items.seller': seller._id,
    createdAt: { $gte: startDate, $lte: now }
  }).populate('items.product user');

  // Format data for CSV
  const csvData = [];
  
  // Add headers
  csvData.push(['Date', 'Action', 'Product', 'Revenue', 'Orders']);
  
  // Group by date
  const dailyData = {};
  
  analytics.forEach(record => {
    const date = record.timestamp.toISOString().slice(0, 10);
    if (!dailyData[date]) {
      dailyData[date] = { views: 0, clicks: 0, addToCart: 0, checkout: 0, purchase: 0 };
    }
    dailyData[date][record.action] = (dailyData[date][record.action] || 0) + 1;
  });
  
  orders.forEach(order => {
    const date = order.createdAt.toISOString().slice(0, 10);
    if (!dailyData[date]) {
      dailyData[date] = { views: 0, clicks: 0, addToCart: 0, checkout: 0, purchase: 0 };
    }
  });
  
  // Convert to CSV rows
  Object.keys(dailyData).sort().forEach(date => {
    const data = dailyData[date];
    const dayOrders = orders.filter(order => 
      order.createdAt.toISOString().slice(0, 10) === date
    );
    
    const revenue = dayOrders.reduce((sum, order) => {
      const sellerItems = order.items.filter(item => String(item.seller) === String(seller._id));
      return sum + sellerItems.reduce((itemSum, item) => itemSum + (item.totalPrice || 0), 0);
    }, 0);
    
    csvData.push([
      date,
      `${data.views} views, ${data.clicks} clicks, ${data.addToCart} cart, ${data.checkout} checkout, ${data.purchase} purchase`,
      'N/A',
      revenue.toFixed(2),
      dayOrders.length
    ]);
  });

  // Convert to CSV string
  const csvContent = csvData.map(row => row.join(',')).join('\n');
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="seller-analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvContent);
});

// Test function for development
const getTestAnalytics = asyncWrap(async (req, res) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Generate sample data for the last 7 days
  const chartLabels = [];
  const salesData = [];
  const ordersData = [];
  
  for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
    chartLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    salesData.push(Math.floor(Math.random() * 5000) + 1000);
    ordersData.push(Math.floor(Math.random() * 20) + 5);
  }

  res.json({
    success: true,
    data: {
      kpis: {
        views: {
          value: '1,234',
          change: 12.5,
          trend: 'up'
        },
        clicks: {
          value: '567',
          change: 8.3,
          trend: 'up'
        },
        sales: {
          value: 'Rs. 15,678',
          change: 15.2,
          trend: 'up'
        },
        returnRate: {
          value: '2.1%',
          change: -0.5,
          trend: 'down'
        }
      },
      charts: {
        salesOverview: {
          labels: chartLabels,
          revenue: salesData,
          orders: ordersData
        },
        conversionFunnel: [
          { stage: 'Views', count: 1234, percentage: 100 },
          { stage: 'Clicks', count: 567, percentage: 46 },
          { stage: 'Add to Cart', count: 234, percentage: 19 },
          { stage: 'Checkout', count: 89, percentage: 7 },
          { stage: 'Purchase', count: 45, percentage: 4 }
        ]
      },
      topProducts: [
        {
          id: '1',
          name: 'Leather Jacket',
          image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=40&h=40&fit=crop',
          sales: 45,
          revenue: 13500
        },
        {
          id: '2',
          name: 'Silk Dress',
          image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=40&h=40&fit=crop',
          sales: 38,
          revenue: 7200
        },
        {
          id: '3',
          name: 'Designer Bag',
          image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=40&h=40&fit=crop',
          sales: 28,
          revenue: 12600
        }
      ],
      performanceSummary: {
        averageOrderValue: {
          value: 'Rs. 127.50',
          change: 12.5,
          trend: 'up'
        },
        conversionRate: {
          value: '3.2%',
          change: 0.4,
          trend: 'up'
        },
        customerRetention: {
          value: '68%',
          change: 5,
          trend: 'up'
        },
        averageRating: {
          value: '4.7',
          stars: 5
        }
      }
    }
  });
});

module.exports = {
  trackInteraction,
  getSellerAnalytics,
  exportAnalytics,
  getTestAnalytics
}; 