// Lightweight Google Analytics 4 implementation
// Uses direct gtag.js instead of react-ga4 to reduce bundle size

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
const isProduction = import.meta.env.MODE === 'production';

// Initialize GA4
export const initAnalytics = () => {
  if (isProduction && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    // Load gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
    
    console.log('Google Analytics initialized');
  }
};

// Track page views
export const trackPageView = (path) => {
  if (isProduction && window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path
    });
  }
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (isProduction && window.gtag) {
    window.gtag('event', eventName, parameters);
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