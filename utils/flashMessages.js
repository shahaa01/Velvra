// Enhanced flash message utility
const createFlashMessage = (type, message, options = {}) => {
  const baseClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400',
    warning: 'text-yellow-400'
  };

  const icons = {
    success: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
    </svg>`,
    error: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
    </svg>`,
    info: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
    </svg>`,
    warning: `<svg class="w-5 h-5 ${iconClasses[type]}" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
    </svg>`
  };

  return {
    type,
    message,
    classes: baseClasses[type] || baseClasses.info,
    icon: icons[type] || icons.info,
    ...options
  };
};

// SweetAlert toast configuration
const swalToastConfig = {
  success: {
    icon: 'success',
    title: 'Success!',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#f0fdf4',
    color: '#166534'
  },
  error: {
    icon: 'error',
    title: 'Error!',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    background: '#fef2f2',
    color: '#dc2626'
  },
  info: {
    icon: 'info',
    title: 'Info',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#eff6ff',
    color: '#2563eb'
  },
  warning: {
    icon: 'warning',
    title: 'Warning',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    background: '#fffbeb',
    color: '#d97706'
  }
};

// Show SweetAlert toast
const showSwalToast = (type, message) => {
  if (typeof Swal !== 'undefined') {
    const config = { ...swalToastConfig[type] };
    config.text = message;
    Swal.fire(config);
  }
};

// Enhanced flash message middleware
const enhancedFlashMiddleware = (req, res, next) => {
  // Add enhanced flash methods to res.locals
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  res.locals.warning = req.flash('warning');

  // Create enhanced flash objects
  res.locals.flashMessages = [];
  
  if (res.locals.success.length > 0) {
    res.locals.flashMessages.push(createFlashMessage('success', res.locals.success[0]));
  }
  if (res.locals.error.length > 0) {
    res.locals.flashMessages.push(createFlashMessage('error', res.locals.error[0]));
  }
  if (res.locals.info.length > 0) {
    res.locals.flashMessages.push(createFlashMessage('info', res.locals.info[0]));
  }
  if (res.locals.warning.length > 0) {
    res.locals.flashMessages.push(createFlashMessage('warning', res.locals.warning[0]));
  }

  next();
};

module.exports = {
  createFlashMessage,
  showSwalToast,
  enhancedFlashMiddleware,
  swalToastConfig
}; 