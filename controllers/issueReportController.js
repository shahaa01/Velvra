const IssueReport = require('../models/issueReport');
const Order = require('../models/order');
const Joi = require('joi');
const path = require('path');

const issueReportSchema = Joi.object({
  orderId: Joi.string().required(),
  productId: Joi.string().required(),
  sellerId: Joi.string().required(),
  category: Joi.string().valid('Damaged', 'Wrong Item', 'Missing', 'Quality', 'Shipping', 'Other').required(),
  description: Joi.string().min(10).required(),
  preferredResolution: Joi.string().allow('').optional()
});

exports.createIssueReport = async (req, res) => {
  try {
    console.log('DEBUG: req.body:', req.body);
    console.log('DEBUG: req.files:', req.files);
    
    // Validate form data
    const { error, value } = issueReportSchema.validate(req.body);
    if (error) {
      console.log('DEBUG: Validation error:', error.details);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: error.details.map(e => e.message).join(', ') });
      }
      req.flash('error', error.details.map(e => e.message).join(', '));
      return res.redirect('/dashboard/report-issue');
    }
    console.log('DEBUG: Validation passed');

    // Handle file uploads (multer saves files to req.files as an array)
    let photoPaths = [];
    if (req.files && req.files.length) {
      photoPaths = req.files.map(file => path.join('/uploads/issues/', file.filename));
    }
    console.log('DEBUG: Photo paths:', photoPaths);

    // Save to DB
    console.log('DEBUG: Creating issue report with data:', {
      userId: req.user._id,
      orderId: value.orderId,
      productId: value.productId,
      sellerId: value.sellerId,
      category: value.category,
      description: value.description,
      preferredResolution: value.preferredResolution,
      photos: photoPaths
    });
    
    const issue = new IssueReport({
      userId: req.user._id,
      orderId: value.orderId,
      productId: value.productId,
      sellerId: value.sellerId,
      category: value.category,
      description: value.description,
      preferredResolution: value.preferredResolution,
      photos: photoPaths
    });
    
    console.log('DEBUG: About to save issue to database');
    await issue.save();
    console.log('DEBUG: Issue saved successfully, ID:', issue._id);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      console.log('DEBUG: Sending JSON response');
      return res.json({ success: true, reportId: issue._id });
    }
    console.log('DEBUG: Sending redirect response');
    req.flash('success', 'Issue reported successfully. We\'ll get back to you soon!');
    res.redirect('/dashboard/report-issue?tab=existing');
  } catch (err) {
    console.error('Issue report error:', err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Failed to submit issue. Please try again.' });
    }
    req.flash('error', 'Failed to submit issue. Please try again.');
    res.redirect('/dashboard/report-issue');
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const reports = await IssueReport.find({ userId: req.user._id })
      .populate('orderId')
      .sort({ createdAt: -1 });
    res.render('page/UserDashboard/userReportIssue', {
      title: 'Report Issues - Velvra',
      user: req.user,
      stats: res.locals.stats,
      reports,
      currentPage: 'report-issue'
    });
  } catch (err) {
    console.error('Fetch user reports error:', err);
    req.flash('error', 'Failed to load your reports.');
    res.redirect('/dashboard');
  }
}; 