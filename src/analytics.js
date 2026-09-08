import ReactGA from 'react-ga4';

// Initialize Google Analytics 4
const MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || 'G-XXXXXXXXXX'; // Add your GA4 Measurement ID

export const initAnalytics = () => {
  if (process.env.NODE_ENV === 'production' && MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    ReactGA.initialize(MEASUREMENT_ID);
    console.log('Google Analytics initialized');
  }
};

// Track page views
export const trackPageView = (path) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (process.env.NODE_ENV === 'production') {
    ReactGA.event(eventName, parameters);
  }
};

// E-commerce event tracking
export const trackAddToCart = (product) => {
  trackEvent('add_to_cart', {
    currency: 'INR',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: 1
    }]
  });
};

export const trackRemoveFromCart = (product) => {
  trackEvent('remove_from_cart', {
    currency: 'INR',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: 1
    }]
  });
};

export const trackBeginCheckout = (cartItems, total) => {
  trackEvent('begin_checkout', {
    currency: 'INR',
    value: total,
    items: cartItems.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });
};

export const trackPurchase = (orderId, total, items) => {
  trackEvent('purchase', {
    transaction_id: orderId,
    currency: 'INR',
    value: total,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  });
};

export const trackSearch = (searchQuery) => {
  trackEvent('search', {
    search_term: searchQuery
  });
};

export const trackCategoryView = (categoryName) => {
  trackEvent('view_item_list', {
    item_list_name: categoryName,
    items: []
  });
};

export const trackProductView = (product) => {
  trackEvent('view_item', {
    currency: 'INR',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: 1
    }]
  });
};

export const trackCheckoutStep = (step, option) => {
  trackEvent('checkout_progress', {
    checkout_step: step,
    checkout_option: option
  });
};

export const trackError = (error, context) => {
  trackEvent('error', {
    error_message: error,
    error_context: context
  });
};

export default {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackCategoryView,
  trackProductView,
  trackCheckoutStep,
  trackError
};