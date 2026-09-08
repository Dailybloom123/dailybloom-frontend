import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import L from 'leaflet';
import { Package, IndianRupee, Clock, MapPin, Phone, Mail, Calendar, AlertTriangle, CheckCircle, XCircle, ArrowRight, RefreshCw, Plus, User, LogOut, Trash2, Home, Check, ShoppingBag, Search, Sparkles, Archive, RotateCcw, Heart, CreditCard, Banknote, X, MessageCircle, Navigation, Activity, AlertCircle } from 'lucide-react';
import analytics from './analytics-light.js';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error, errorInfo) {
    return { hasError: true, error, errorInfo };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: 20, 
          background: COLORS.bg,
          fontFamily: "'Manrope', sans-serif"
        }}>
          <div style={{ 
            background: COLORS.card, 
            borderRadius: 16, 
            padding: 40, 
            maxWidth: 500, 
            textAlign: 'center',
            border: `1px solid ${COLORS.line}`
          }}>
            <AlertCircle size={48} color={COLORS.danger} style={{ marginBottom: 20 }} />
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
              Something went wrong
            </h2>
            <p style={{ color: COLORS.inkSoft, marginBottom: 24 }}>
              We encountered an unexpected error. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ 
                background: COLORS.marigold, 
                color: COLORS.ink, 
                border: 'none', 
                borderRadius: 8, 
                padding: '12px 24px', 
                fontWeight: 700, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: '0 auto'
              }}
            >
              <RefreshCw size={16} />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// API Response Handler with Retry Logic
const handleAPIResponse = async (response, retryCount = 0, maxRetries = 2) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - clear session
      localStorage.removeItem('dailybloom_admin_token');
      localStorage.removeItem('dailybloom_admin_user');
      localStorage.removeItem('dailybloom_partner_token');
      localStorage.removeItem('dailybloom_partner_user');
      throw new Error('Session expired. Please login again.');
    }
    
    if (response.status === 403) {
      throw new Error('Access denied. You don\'t have permission for this action.');
    }
    
    if (response.status === 429) {
      // Rate limited - implement exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return { shouldRetry: true, retryCount: retryCount + 1 };
      }
      throw new Error('Too many requests. Please try again later.');
    }
    
    if (response.status >= 500) {
      // Server error - retry with backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return { shouldRetry: true, retryCount: retryCount + 1 };
      }
      throw new Error('Server error. Please try again later.');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return { shouldRetry: false, data: await response.json() };
};

// Robust API fetch wrapper
const robustFetch = async (url, options = {}, retryCount = 0) => {
  try {
    const response = await fetch(url, options);
    const result = await handleAPIResponse(response, retryCount);
    
    if (result.shouldRetry) {
      return robustFetch(url, options, result.retryCount);
    }
    
    return result.data;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
};

const API_BASE = 'https://dailybloom-x82y.onrender.com/api';

// Currency Configuration for Indian Market
const CURRENCY = 'INR';
const CURRENCY_SYMBOL = '₹';
const CURRENCY_LOCALE = 'en-IN';

// Utility function for formatting Indian currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const COLORS = {
  bg: '#F8F9F5',
  ink: '#1A2E23',
  inkSoft: '#4A5D52',
  marigold: '#F0B429',
  marigoldDark: '#D4941A',
  marigoldLight: '#FDE8C8',
  card: '#FFFFFF',
  line: '#E8EFE8',
  danger: '#E85D75',
  dairy: '#5A8A6E',
  dairyLight: '#E8F0EC',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};

const STATUS_LABELS = {
  pending_approval: 'Pending Approval',
  confirmed: 'Order Confirmed',
  packed: 'Order Packed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Order Delivered',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

// FOUR MAIN CATEGORIES
const CATEGORIES = [
  { id: 'cat_dairy', name: 'Dairy', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80', desc: 'Farm-fresh milk, curd, ghee & cream from rural farms' },
  { id: 'cat_bakery', name: 'Bakery', image: 'https://images.unsplash.com/photo-1768672522683-7962c0028c03?auto=format&fit=crop&w=400&q=80', desc: 'Fresh daily breads & baked goods' },
  { id: 'cat_honey', name: 'Organic Essentials', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d30?auto=format&fit=crop&w=400&q=80', desc: 'Pure organic honey & traditional jaggery' },
  { id: 'cat_flowers', name: 'Fresh Flowers', image: 'https://images.unsplash.com/photo-1772559108641-0f5af229282d?auto=format&fit=crop&w=400&q=80', desc: 'Fresh puja flowers for morning aarti & rituals' },
];

const GUWAHATI_PINCODES = {
  '781001': ['pan bazar', 'fancy bazar', 'ambari', 'athgaon', 'uzan bazar', 'latasil', 'machkuwa'],
  '781003': ['silpukhuri', 'chandmari', 'chenikuthi', 'rajgarh', 'geetanagar'],
  '781005': ['christian basti', 'bhangagarh', 'supermarket', 'sarumotoria'],
  '781006': ['ganeshguri', 'dispur', 'ghoramara'],
  '781007': ['ulubari', 'sarania', 'sarabhhati'],
  '781008': ['rehabari', 'paltan bazar', 'machkhowa', 'nepali mandir'],
  '781022': ['khanapara', 'six mile'],
  '781024': ['zoo road', 'ambikagiri nagar'],
  '781028': ['beltola', 'beltola chariali', 'last gate', 'survey road'],
  '781029': ['basistha', 'bhetapara'],
  '781038': ['hatigaon', 'hatigaon chariali'],
};

const getPincodeFromLocality = (locality) => {
  try {
    if (!locality || typeof locality !== 'string') return null;
    const normalizedLocality = locality.toLowerCase().trim();
    if (normalizedLocality.length === 0) return null;
    
    for (const [pincode, localities] of Object.entries(GUWAHATI_PINCODES)) {
      if (!Array.isArray(localities)) continue;
      for (const loc of localities) {
        if (typeof loc !== 'string') continue;
        const normalizedLoc = loc.toLowerCase().trim();
        if (normalizedLoc === normalizedLocality || 
            normalizedLocality.includes(normalizedLoc) ||
            normalizedLoc.includes(normalizedLocality)) {
          return pincode;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

const MOCK_PRODUCTS = [
  // Dairy Products - Pre-order before 9PM, Subscription available
  { id: 'prod_1', category_id: 'cat_dairy', name: 'Cow Milk', price: 65, unit: '1L', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: true, instantOrder: false, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_2', category_id: 'cat_dairy', name: 'Buffalo Milk', price: 70, unit: '1L', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: true, instantOrder: false, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_3', category_id: 'cat_dairy', name: 'Curd made from Cow Milk', price: 45, unit: '500g', image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: true, instantOrder: false, inStock: true, earlyMorningDelivery: true },
  { id: 'prod_4', category_id: 'cat_dairy', name: 'Curd made from Buffalo Milk', price: 50, unit: '500g', image: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: true, instantOrder: false, inStock: true, earlyMorningDelivery: true },
  { id: 'prod_5', category_id: 'cat_dairy', name: 'Organic Ghee', price: 450, unit: '500ml', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: true, instantOrder: false, inStock: true, earlyMorningDelivery: true },
  { id: 'prod_6', category_id: 'cat_dairy', name: 'Fresh Cream made from Cow Milk', price: 80, unit: '200ml', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: true, instantOrder: false, inStock: true, earlyMorningDelivery: true },
  { id: 'prod_6a', category_id: 'cat_dairy', name: 'Paneer', price: 90, unit: '200g', image: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: true, instantOrder: false, inStock: true, earlyMorningDelivery: true },
  
  // Bakery - Most items instant + subscription, Croissant instant only
  { id: 'prod_7', category_id: 'cat_bakery', name: 'Whole Wheat Unsliced Bread', price: 45, unit: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_8', category_id: 'cat_bakery', name: 'Whole Wheat Sliced Bread', price: 48, unit: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_9', category_id: 'cat_bakery', name: 'Sliced Milk Bread', price: 40, unit: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_10', category_id: 'cat_bakery', name: 'Unsliced Milk Bread', price: 38, unit: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_11', category_id: 'cat_bakery', name: 'White Sandwich Bread', price: 42, unit: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_12', category_id: 'cat_bakery', name: 'Brown Sandwich Bread', price: 48, unit: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_13', category_id: 'cat_bakery', name: 'Multigrain Bread', price: 55, unit: '400g', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_14', category_id: 'cat_bakery', name: 'Kulcha Bread', price: 35, unit: '4 pcs', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_15', category_id: 'cat_bakery', name: 'Bun Bread', price: 30, unit: '4 pcs', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_16', category_id: 'cat_bakery', name: 'Pav Bread', price: 32, unit: '8 pcs', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_17', category_id: 'cat_bakery', name: 'Croissant', price: 60, unit: '1 pc', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80', subscribable: false, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  
  // Organic Essentials - Instant order only
  { id: 'prod_18', category_id: 'cat_honey', name: 'Organic Honey', price: 350, unit: '500g', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d30?auto=format&fit=crop&w=300&q=80', subscribable: false, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_19', category_id: 'cat_honey', name: 'Organic Jaggery', price: 180, unit: '500g', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d30?auto=format&fit=crop&w=300&q=80', subscribable: false, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  
  // Fresh Flowers - Both subscription + instant order
  { id: 'prod_21', category_id: 'cat_flowers', name: 'Marigold', price: 50, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1574167227613-81927d583814?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_22', category_id: 'cat_flowers', name: 'Lotus', price: 80, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_23', category_id: 'cat_flowers', name: 'Kathanda', price: 45, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_24', category_id: 'cat_flowers', name: 'Chameli', price: 55, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_25', category_id: 'cat_flowers', name: 'Aparajita (Blue)', price: 60, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1518882605630-8a58d8f09e4d?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_26', category_id: 'cat_flowers', name: 'Aparajita (White)', price: 60, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1468327768560-75b778cbb551?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_27', category_id: 'cat_flowers', name: 'Dhruva', price: 40, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_28', category_id: 'cat_flowers', name: 'Tulsi', price: 35, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1628022777348-3a0d1c93b283?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_29', category_id: 'cat_flowers', name: 'Aak', price: 45, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_30', category_id: 'cat_flowers', name: 'Kaner/Karabi', price: 50, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_31', category_id: 'cat_flowers', name: 'Nayantara', price: 40, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1568737346870-284011925606?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_32', category_id: 'cat_flowers', name: 'Red Hibiscus', price: 45, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1518882605630-8a58d8f09e4d?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_33', category_id: 'cat_flowers', name: 'Dhatura Flower', price: 55, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_34', category_id: 'cat_flowers', name: 'Rajnigandha', price: 70, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_35', category_id: 'cat_flowers', name: 'Barmala', price: 60, unit: '1 Bunch', image: 'https://images.unsplash.com/photo-1574167227613-81927d583814?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_36', category_id: 'cat_flowers', name: 'Bel Leaves (108 leaves)', price: 80, unit: '108 Leaves', image: 'https://images.unsplash.com/photo-1628022777348-3a0d1c93b283?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
  { id: 'prod_37', category_id: 'cat_flowers', name: 'Betel Leaves', price: 25, unit: '10 Leaves', image: 'https://images.unsplash.com/photo-1628022777348-3a0d1c93b283?auto=format&fit=crop&w=300&q=80', subscribable: true, preOrder: false, instantOrder: true, inStock: true, earlyMorningDelivery: false },
];

// Time-based ordering constants for IST timezone
const EARLY_MORNING_DELIVERY_START = 6.5; // 6:30 AM
const EARLY_MORNING_DELIVERY_END = 8.5; // 8:30 AM
const NEXT_DAY_STOCK_CUTOFF = 21; // 9:00 PM
const SAME_DAY_STOCK_UPDATE_START = 6.5; // 6:30 AM
const SAME_DAY_STOCK_UPDATE_END = 18.5; // 6:30 PM
const getCurrentISTHour = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.getHours() + istTime.getMinutes() / 60;
};

const isEarlyMorningDeliveryWindow = () => {
  const currentHour = getCurrentISTHour();
  return currentHour >= EARLY_MORNING_DELIVERY_START && currentHour <= EARLY_MORNING_DELIVERY_END;
};

const isStockUpdateAllowed = (isNextDayStock = false) => {
  const currentHour = getCurrentISTHour();
  if (isNextDayStock) {
    // Next-day stock can only be updated before 9 PM
    return currentHour < NEXT_DAY_STOCK_CUTOFF;
  } else {
    // Same-day stock updates allowed 6:30 AM to 6:30 PM
    return currentHour >= SAME_DAY_STOCK_UPDATE_START && currentHour <= SAME_DAY_STOCK_UPDATE_END;
  }
};

const isPreOrderWindowOpen = () => {
  const currentHour = getCurrentISTHour();
  // Pre-orders can be placed anytime before 9 PM for next day delivery
  return currentHour < NEXT_DAY_STOCK_CUTOFF;
};

const getProductOrderStatus = (product) => {
  if (!product.inStock) {
    return { available: false, message: 'Out of Stock' };
  }
  
  // For now, make all products available for testing
  // Remove strict time-based filtering during development
  if (product.earlyMorningDelivery) {
    return { available: true, message: 'Available for early morning delivery (6:30-8:30 AM)' };
  }
  
  if (product.preOrder && !product.instantOrder) {
    return { available: true, message: 'Pre-order available (cutoff 9 PM)' };
  }
  
  return { available: true, message: 'Available for instant order' };
};

// Helper to load Razorpay Checkout Script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function playNotificationSound(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    if (type === 'success') {
      // Play a pleasant success melody (C-E-G-C arpeggio)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + (index * duration));
        
        gain.gain.setValueAtTime(0, ctx.currentTime + (index * duration));
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + (index * duration) + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + (index * duration) + duration);
        
        osc.start(ctx.currentTime + (index * duration));
        osc.stop(ctx.currentTime + (index * duration) + duration);
      });
    } else {
      // Basic notification sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.error('Error playing notification sound:', e);
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[date.getDay()]}, ${dateStr.slice(0, 10)}`;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fixed UUID for the default address
const DEFAULT_ADDRESS_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('landing');
  const [activeTab, setActiveTab] = useState('store');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);

  const [addresses, setAddresses] = useState([]);
  
  const [cart, setCart] = useState({});
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  // Memoized filtered products to avoid unnecessary recalculations
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => {
      const matchesCat = !selectedCategory || p.category_id === selectedCategory;
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const orderStatus = getProductOrderStatus(p);
      const isAvailable = orderStatus.available;
      return matchesCat && matchesSearch && isAvailable;
    });
  }, [selectedCategory, searchQuery]);

  // Memoized cart total calculation
  const cartTotal = useMemo(() => {
    return MOCK_PRODUCTS.reduce((total, product) => {
      const qty = cart[product.id] || 0;
      return total + (product.price * qty);
    }, 0);
  }, [cart]);

  // Memoized delivery charge calculation
  const deliveryCharge = useMemo(() => {
    return cartTotal >= 500 ? 0 : 30;
  }, [cartTotal]);

  // Memoized final total
  const finalTotal = useMemo(() => {
    return cartTotal + deliveryCharge;
  }, [cartTotal, deliveryCharge]);

  // Initialize analytics on mount
  useEffect(() => {
    analytics.initAnalytics();
    analytics.trackPageView('/');
  }, []);
  
  // New Address Form State
  const [newAddressForm, setNewAddressForm] = useState({
    orderingFor: 'Myself',
    recipientName: '',
    recipientPhone: '',
    addressType: 'Home',
    customAddressType: '',
    line1: '',
    flatHouseNumber: '',
    streetBuildingSociety: '',
    locality: '',
    pincode: '',
    landmark: '',
    latitude: 26.1445,
    longitude: 91.7362,
  });

  // Saved Payment Methods State
  const [savedCards, setSavedCards] = useState([
    { id: 'card_1', cardType: 'Visa', last4: '4242', expMonth: '12', expYear: '28', holderName: 'Cardholder' },
    { id: 'card_2', cardType: 'Mastercard', last4: '8888', expMonth: '10', expYear: '29', holderName: 'Cardholder' }
  ]);
  const [savedUpi, setSavedUpi] = useState([
    { id: 'upi_1', upiId: 'user@okaxis', provider: 'Google Pay' },
    { id: 'upi_2', upiId: 'user@ybl', provider: 'PhonePe' },
    { id: 'upi_3', upiId: 'user@pz', provider: 'PayZapp' }
  ]);
  const [savedWallets, setSavedWallets] = useState([
    { id: 'wallet_1', name: 'Paytm Wallet', phone: '9876543210' }
  ]);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cards');

  // Subscription State
  const [subscriptions, setSubscriptions] = useState([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedProductForSubscription, setSelectedProductForSubscription] = useState(null);
  const [subscriptionType, setSubscriptionType] = useState('daily'); // daily, weekly, monthly

  // Feedback/Complaint State
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('complaint'); // complaint or feedback

  // Pre-order deadline check (9PM for dairy products)
  const isAfterPreOrderDeadline = () => {
    return !isPreOrderWindowOpen();
  };

  // WhatsApp ordering
  const WHATSAPP_BUSINESS_NUMBER = '919910217309'; // DailyBloom WhatsApp Business number
  const handleWhatsAppOrder = () => {
    const orderMessage = formatWhatsAppOrderMessage();
    const whatsappUrl = `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(orderMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatWhatsAppOrderMessage = () => {
    if (cartItemCount === 0) {
      return 'Hi! I would like to place an order with DailyBloom.';
    }

    let message = `🌸 *New Order - DailyBloom*\n\n`;
    message += `*Items:*\n`;
    
    cartItemsList.forEach((item, index) => {
      message += `${index + 1}. ${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
    });
    
    message += `\n*Total: ₹${cartTotal}*\n`;
    message += `*Delivery Charge: ₹${deliveryCharge}*\n`;
    message += `*Final Total: ₹${finalTotal}*\n`;
    message += `Please confirm my order and provide delivery details.`;
    
    return message;
  };

  const [mapPinLocation, setMapPinLocation] = useState({ lat: 26.1445, lng: 91.7362 });
  const [mapLocationSelected, setMapLocationSelected] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);

  // My Account Details Form & Edit Mode State
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', email: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [wishlist, setWishlist] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  
  // Live tracking state
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingMilestones, setTrackingMilestones] = useState([]);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // OTP authentication state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);

  // Handle Google OAuth callback on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleCode = urlParams.get('code');
    
    if (googleCode) {
      // Clear the code from URL immediately to prevent re-processing
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const handleGoogleCallback = async () => {
        try {
          console.log('Processing Google OAuth code:', googleCode);
          const res = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: googleCode })
          });
          
          const data = await res.json();
          console.log('Google auth response:', data);
          
          if (res.ok) {
            localStorage.setItem('token', data.token);
            setUser(data.user || { id: 1, name: 'Google User', email: 'google@dailybloom.com' });
            setAuthView('main');
            console.log('Google login successful:', data.user);
          } else {
            console.error('Google auth error:', data.error);
            setError(data.error || 'Google login failed');
          }
        } catch (e) {
          console.error('Google callback error:', e);
          setError('Google authentication failed');
        }
      };
      
      handleGoogleCallback();
    }
  }, []);

  const [complaints, setComplaints] = useState([
    { id: 'comp_1', orderId: 'ord_998', issue: 'Delay in morning milk delivery', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), slaHours: 4, status: 'In Progress' }
  ]);
  const [complaintText, setComplaintText] = useState('');
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  const cartItemsList = useMemo(() => {
    return Object.keys(cart).map(id => {
      const product = MOCK_PRODUCTS.find(p => p.id === id);
      return product ? { ...product, quantity: cart[id] } : null;
    }).filter(Boolean);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cartItemsList.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItemsList]);

  // Initialize Leaflet map
  useEffect(() => {
    if (showAddAddressModal && !mapLocationSelected && mapRef.current && !mapInitialized) {
      try {
        const map = L.map(mapRef.current, {
          center: [26.1445, 91.7362],
          zoom: 14,
          zoomControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        const LocateButton = L.Control.extend({
          options: { position: 'bottomright' },
          onAdd: function() {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button = L.DomUtil.create('button', '', container);
            button.innerHTML = `
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
            `;
            button.style.cssText = `
              background: white; border: 2px solid #ccc; border-radius: 50%;
              width: 40px; height: 40px; cursor: pointer; display: flex;
              align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2)
            `;
            button.title = 'Locate Me';
            
            L.DomEvent.disableClickPropagation(button);
            L.DomEvent.disableScrollPropagation(button);
            
            button.addEventListener('click', function() {
              if (!navigator.geolocation) {
                setError('Location services are not supported.');
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const { latitude, longitude } = pos.coords;
                  map.setView([latitude, longitude], 15);
                  setMapPinLocation({ lat: latitude, lng: longitude });
                  reverseGeocode(latitude, longitude);
                },
                () => setError('Unable to fetch location.')
              );
            });
            return container;
          }
        });
        
        map.addControl(new LocateButton());
        
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #FF6B35; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });
        
        const marker = L.marker([mapPinLocation.lat, mapPinLocation.lng], {
          draggable: false,
          icon: customIcon
        }).addTo(map);
        
        map.on('move', () => {
          const center = map.getCenter();
          marker.setLatLng([center.lat, center.lng]);
          setMapPinLocation({ lat: center.lat, lng: center.lng });
        });

        map.on('moveend', () => {
          const center = map.getCenter();
          reverseGeocode(center.lat, center.lng);
        });
        
        mapInstanceRef.current = map;
        markerRef.current = marker;
        setMapInitialized(true);
        setTimeout(() => { if (map && map.invalidateSize) map.invalidateSize(); }, 100);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
    
    return () => {
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (e) {}
        mapInstanceRef.current = null;
      }
      setMapInitialized(false);
    };
  }, [showAddAddressModal, mapLocationSelected]);

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
        headers: { 'User-Agent': 'DailyBloomCustomerApp/1.0' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.display_name) {
        const street = data.address?.road || data.address?.street || data.address?.building || data.display_name.split(',')[0];
        const city = data.address?.city || data.address?.suburb || 'Guwahati';
        const localPincode = getPincodeFromLocality(city) || data.address?.postcode || '';
        
        setNewAddressForm(prev => ({
          ...prev,
          line1: street || '',
          locality: city,
          pincode: localPincode,
          latitude: lat,
          longitude: lon,
        }));
      }
    } catch (e) {}
  };

  const handleAddAddress = useCallback((e) => {
    e.preventDefault();
    const autoPincode = getPincodeFromLocality(newAddressForm.locality) || newAddressForm.pincode;
    const addressTitle = newAddressForm.addressType === 'Other' 
      ? newAddressForm.customAddressType || 'Other' 
      : newAddressForm.addressType;
    
    const fullLine = `${newAddressForm.flatHouseNumber ? newAddressForm.flatHouseNumber + ', ' : ''}${newAddressForm.streetBuildingSociety ? newAddressForm.streetBuildingSociety + ', ' : ''}${newAddressForm.line1}`;

    const newAddress = {
      id: generateUUID(),
      title: addressTitle,
      orderingFor: newAddressForm.orderingFor,
      recipientName: newAddressForm.recipientName,
      recipientPhone: newAddressForm.recipientPhone,
      addressType: newAddressForm.addressType,
      line1: fullLine,
      locality: newAddressForm.locality,
      city: 'Guwahati',
      pincode: autoPincode,
      landmark: newAddressForm.landmark,
      latitude: newAddressForm.latitude,
      longitude: newAddressForm.longitude,
      is_default: addresses.length === 0,
      status: 'active'
    };

    setAddresses([...addresses, newAddress]);
    setShowAddAddressModal(false);
    setMapLocationSelected(false);
    
    setNewAddressForm({
      orderingFor: 'Myself',
      recipientName: '',
      recipientPhone: '',
      addressType: 'Home',
      customAddressType: '',
      line1: '',
      flatHouseNumber: '',
      streetBuildingSociety: '',
      locality: '',
      pincode: '',
      landmark: '',
      latitude: 26.1445,
      longitude: 91.7362,
    });
    setSuccessMsg('Address added successfully!');
    playNotificationSound('success');
  }, [newAddressForm, addresses]);

// Removed handleGuestLogin - Customers must create account to access DailyBloom

const handleGoogleLogin = useCallback(() => {
  try {
    // Initialize Google OAuth flow with direct redirect (more reliable)
    const clientId = '54659216683-mpoqi9n9j6sqldeo6opisic3cflkvm1u.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:5173/'; // Use trailing slash to match Google Cloud Console
    const scope = 'email profile';
    
    // Save current URL to return after login
    sessionStorage.setItem('returnUrl', window.location.href);
    
    // Direct redirect to Google OAuth
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline`;
    
    window.location.href = authUrl;
  } catch (e) {
    console.error('Google login error:', e);
    setError('Failed to initiate Google login');
  }
}, []);

const handleRequestOtp = useCallback(async () => {
  setError(null);
  try {
    const body = profileForm.email ? { email: profileForm.email } : { phone: profileForm.phone };
    const res = await fetch(`${API_BASE}/auth/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    setOtpSent(true);
    setDevOtp(null);
    setSuccessMsg('OTP sent successfully!');
  } catch (e) {
    setError(e.message || 'Failed to send OTP');
  }
}, [profileForm]);

const handleVerifyOtp = useCallback(async () => {
  setError(null);
  try {
    const body = profileForm.email 
      ? { email: profileForm.email, otp, name: profileForm.name }
      : { phone: profileForm.phone, otp, name: profileForm.name };
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid OTP');
    localStorage.setItem('token', data.token);
    setUser(data.user || { id: 1, name: 'Phone User', email: 'phone@dailybloom.com' });
    setAuthView('main');
    setSuccessMsg('Login successful!');
    
    // Track login event
    analytics.trackEvent('login', { method: 'otp' });
  } catch (e) {
    setError(e.message || 'OTP verification failed');
  }
}, [profileForm, otp]);

  const handleLogout = useCallback(() => {
    setUser(null);
    setAuthView('landing');
    setActiveTab('store');
    setSelectedCategory(null);
    setShowProfileDropdown(false);
  }, []);

  const submitComplaint = useCallback((e) => {
    e.preventDefault();
    const newComplaint = {
      id: 'comp_' + Date.now(),
      orderId: 'ord_' + Math.floor(Math.random() * 1000),
      issue: complaintText,
      createdAt: new Date().toISOString(),
      slaHours: 4,
      status: 'Open'
    };
    setComplaints([...complaints, newComplaint]);
    setComplaintText('');
    setShowComplaintModal(false);
    setSuccessMsg('Support ticket created successfully!');
    playNotificationSound('success');
  }, [complaintText, complaints]);

  // Live tracking functions
  const startLiveTracking = async (orderId) => {
    try {
      setSelectedOrderForTracking(orderId);
      setShowTrackingModal(true);
      
      // Fetch initial tracking data
      await fetchTrackingData(orderId);
      
      // Set up polling for live updates (every 10 seconds)
      const interval = setInterval(() => fetchTrackingData(orderId), 10000);
      setTrackingInterval(interval);
    } catch (error) {
      console.error('Error starting live tracking:', error);
      setError('Failed to start live tracking');
    }
  };

  const fetchTrackingData = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [latestRes, milestonesRes] = await Promise.all([
        fetch(`${API_BASE}/tracking/${orderId}/latest`, { headers }),
        fetch(`${API_BASE}/tracking/${orderId}/milestones`, { headers })
      ]);

      if (latestRes.ok) {
        const latestData = await latestRes.json();
        setTrackingData(latestData);
      }

      if (milestonesRes.ok) {
        const milestonesData = await milestonesRes.json();
        setTrackingMilestones(milestonesData);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    }
  };

  const stopLiveTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    setShowTrackingModal(false);
    setSelectedOrderForTracking(null);
    setTrackingData(null);
    setTrackingMilestones([]);
  };

  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

// Checkout Form Submission Handler with full Backend & Razorpay Integration
  const handleCheckoutSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (cartItemsList.length === 0) return;

    setError(null);
    setIsLoading(true);

    // Track checkout begin
    analytics.trackBeginCheckout(cartItemsList, finalTotal);

    const addressId = selectedAddressId || (addresses[0] && addresses[0].id);
    if (!addressId) {
      setError('Please add or select a delivery address.');
      setIsLoading(false);
      return;
    }

    // Case 1: Cash on Delivery
    if (selectedPaymentMethod === 'cod') {
      const newOrder = {
        id: 'ord_' + Date.now().toString().slice(-4),
        status: 'pending',
        total: finalTotal,
        createdAt: new Date().toISOString(),
        items: cartItemsList,
        paymentMethod: 'cod'
      };
      setOrders(prev => [...prev, newOrder]);
      setCart({});
      setSuccessMsg('Order placed successfully via Cash on Delivery!');
      playNotificationSound('success');
      setIsLoading(false);
      
      // Track purchase
      analytics.trackPurchase(newOrder.id, finalTotal, cartItemsList);
      
      // Redirect to orders page after a short delay for sound to play
      setTimeout(() => {
        setActiveTab('orders');
      }, 500);
      return;
    }

    // Case 2: Cards / UPI / Wallet via Razorpay
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      setError('Failed to load Razorpay SDK. Please check your internet connection.');
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Call backend /api/payments/create to generate a real Razorpay Order ID
      const createOrderPayload = {
        address_id: addressId,
        delivery_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        delivery_slot: '06:00 AM - 08:00 AM',
        items: cartItemsList.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      const token = localStorage.getItem('token'); // Get auth token if required

      // Ensure we have a token before proceeding
      let authToken = token;
      if (!authToken) {
        setError('Please login to place an order. Guest access is not available.');
        setIsLoading(false);
        return;
      }

      console.log('Creating payment order with payload:', createOrderPayload);
      console.log('Using token:', authToken);

      const response = await fetch(`${API_BASE}/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(createOrderPayload)
      });

      console.log('Payment create response status:', response.status);
      const data = await response.json();
      console.log('Payment create response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment order on server');
      }

      const { razorpay_order_id, amount, currency, key_id, order_id } = data;

      // Step 2: Configure Razorpay modal with server-generated order_id & key_id
      const options = {
        key: key_id || 'rzp_test_YourActualTestKeyHere', // Returned from backend env or fallback
        amount: amount, // Amount in paise returned by server
        currency: currency || CURRENCY, // Always use INR for Indian market
        name: 'DailyBloom',
        description: 'Daily Morning Essentials Order',
        order_id: razorpay_order_id, // CRITICAL: Must pass order_id from backend!
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=200&q=80',
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
          emi: true,
          paylater: true
        },
        config: {
          display: {
            blocks: {
              utib: {
                name: 'Pay via UTI',
                instruments: [
                  {
                    method: 'netbanking',
                    flows: ['online']
                  }
                ]
              },
              other: {
                name: 'Other Payment Modes',
                instruments: [
                  {
                    method: 'card',
                    flows: ['emi']
                  },
                  {
                    method: 'app',
                    flows: ['qr']
                  }
                ]
              }
            },
            sequence: ['block.utib', 'block.other'],
            preferences: {
              payment_default_order: ['card', 'netbanking', 'upi', 'wallet']
            }
          }
        },
        handler: async function (razorpayResponse) {
          try {
            // Step 3: Verify Razorpay signature on backend
            const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                items: cartItemsList.map(item => ({
                  product_id: item.id,
                  quantity: item.quantity
                }))
              })
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            // Payment verified & order confirmed!
            console.log('Payment verification successful, order data:', verifyData);
            
            // Add order to orders list
            setOrders(prev => [...prev, verifyData]);
            setCart({});
            setSuccessMsg(`Payment Successful! ${formatCurrency(finalTotal)} paid via Razorpay. Payment ID: ${razorpayResponse.razorpay_payment_id}`);
            playNotificationSound('success');
            setIsLoading(false);
            
            // Track purchase
            analytics.trackPurchase(verifyData.id, finalTotal, cartItemsList);
            
            // Ensure user stays authenticated after payment
            if (!user) {
              setError('Session expired. Please login again.');
              setIsLoading(false);
              return;
            }
            
            // Redirect to orders page after a short delay for sound to play
            setTimeout(() => {
              setActiveTab('orders');
              setAuthView('main'); // Ensure we're not on landing page
              console.log('Redirected to orders page');
            }, 500);
          } catch (verifyErr) {
            console.error('Payment Verification Error:', verifyErr);
            setError(verifyErr.message || 'Payment completed but verification failed.');
            setIsLoading(false);
          }
        },
        prefill: {
          name: user?.name || profileForm.name || 'Customer',
          email: user?.email || profileForm.email || 'customer@dailybloom.com',
          contact: user?.phone || profileForm.phone || '9876543210'
        },
        theme: {
          color: COLORS.marigold
        }
      };

      const paymentObject = new window.Razorpay(options);

      paymentObject.on('payment.failed', function (response) {
        console.error('Razorpay Payment Failed:', response.error);
        setError(`Payment failed: ${response.error.description || 'Transaction cancelled or declined.'}`);
        setIsLoading(false);
      });

      paymentObject.open();
    } catch (err) {
      console.error('Razorpay Checkout Error:', err);
      setError(err.message || 'Could not initiate payment. Please try again.');
      setIsLoading(false);
    }
  }, [cartItemsList, selectedAddressId, addresses, selectedPaymentMethod, finalTotal, user]);

  if (authView === 'landing' && !user) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '24px 20px' }}>
        <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 32, color: COLORS.ink, marginBottom: 8 }}>DailyBloom</h1>
          <p style={{ color: COLORS.inkSoft, marginBottom: 24 }}>Fresh daily morning essentials delivered 6AM–8AM in Guwahati</p>
          
          {/* Email/Phone Login */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              inputMode="email"
              placeholder="Email/Mobile Number"
              value={profileForm.email || profileForm.phone || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Determine if email or phone
                if (value.includes('@')) {
                  setProfileForm(prev => ({ ...prev, email: value, phone: '' }));
                } else {
                  setProfileForm(prev => ({ ...prev, phone: value, email: '' }));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !otpSent) {
                  handleRequestOtp();
                }
              }}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                border: `1px solid ${COLORS.line}`, 
                borderRadius: 10, 
                fontSize: 14,
                marginBottom: 12,
                background: COLORS.card
              }}
            />
            
            {!otpSent ? (
              <button 
                onClick={handleRequestOtp}
                style={{ width: '100%', background: COLORS.marigold, border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                Send OTP
              </button>
            ) : (
              <>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyOtp();
                    }
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: `1px solid ${COLORS.line}`, 
                    borderRadius: 10, 
                    fontSize: 14,
                    marginBottom: 12,
                    background: COLORS.card
                  }}
                />
                <button 
                  onClick={handleVerifyOtp}
                  style={{ width: '100%', background: COLORS.marigold, border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                >
                  Verify & Login
                </button>
              </>
            )}
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: COLORS.line }}></div>
            <span style={{ padding: '0 12px', color: COLORS.inkSoft, fontSize: 12 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: COLORS.line }}></div>
          </div>

          {/* Google OAuth */}
          <button 
            onClick={handleGoogleLogin}
            style={{ 
              width: '100%', 
              background: COLORS.card, 
              border: `1px solid ${COLORS.line}`, 
              borderRadius: 10, 
              padding: 14, 
              fontWeight: 600, 
              fontSize: 15, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Removed Guest Option - Customers must create account to access DailyBloom */}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "Manrope, sans-serif", display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 20px 80px 20px', flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 840, margin: '0 auto', paddingBottom: 60 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'relative' }}>
          <h2 style={{ fontFamily: "Fraunces, serif", margin: 0, color: COLORS.ink, cursor: 'pointer' }} onClick={() => { setActiveTab('store'); setSelectedCategory(null); }}>DailyBloom</h2>
          
          <button 
            onClick={() => setShowProfileDropdown(prev => !prev)}
            title="My Account"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: '10px', cursor: 'pointer', color: COLORS.ink }}
          >
            <User size={20} />
          </button>
          
          {/* PROFILE DROPDOWN MENU */}
          {showProfileDropdown && (
            <div 
              onMouseLeave={() => setShowProfileDropdown(false)}
              style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1000, minWidth: 200, padding: 8 }}
            >
              
              <div style={{ padding: '8px 12px', borderBottom: `1px solid ${COLORS.line}`, marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>{user?.name || 'User'}</div>
              </div>
              
              <button onClick={() => { setActiveTab('addresses'); setShowProfileDropdown(false); }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                <MapPin size={16} /> Address
              </button>
              
              <button onClick={() => { setActiveTab('orders'); setShowProfileDropdown(false); }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                <Package size={16} /> Orders
              </button>
              
              <button onClick={() => { setActiveTab('support'); setShowProfileDropdown(false); }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                <Archive size={16} /> Support ({complaints.length})
              </button>
              
              <button onClick={() => { setActiveTab('payment-methods'); setShowProfileDropdown(false); }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                <Check size={16} /> Payment Method
              </button>
              
              <div style={{ borderTop: `1px solid ${COLORS.line}`, marginTop: 8, marginBottom: 8 }}></div>
              
              <button onClick={() => { 
                setProfileForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' }); 
                setIsEditingProfile(false);
                setSuccessMsg(null);
                setError(null);
                setActiveTab('my-account'); 
                setShowProfileDropdown(false); 
              }} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                <User size={16} /> My Account
              </button>
              
              <button onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', padding: '10px 12px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, color: COLORS.danger }}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ background: '#FDEDE4', color: '#7A3418', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{error}</div>}
        {successMsg && <div style={{ background: '#E4F0E8', color: COLORS.dairy, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{successMsg}</div>}

        {/* STORE TAB */}
        {activeTab === 'store' && (
          <div>
            {/* Search Bar */}
            <div style={{ marginBottom: 20 }}>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Search products..." 
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: 12, border: `1px solid ${COLORS.line}`, fontSize: 14, background: COLORS.card }}
              />
            </div>

            {/* VIEW 1: THREE CATEGORY CARDS VIEW */}
            {!selectedCategory && !searchQuery && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                  {CATEGORIES.map((cat) => (
                    <div 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(cat.id)}
                      style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        loading="lazy"
                        style={{ width: '100%', height: 150, objectFit: 'cover' }}
                      />
                      <div style={{ padding: 16 }}>
                        <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>
                          {cat.name}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.inkSoft, lineHeight: 1.4 }}>
                          {cat.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 2: CATEGORY / SEARCH PRODUCTS GRID VIEW */}
            {(selectedCategory || searchQuery) && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: COLORS.card, padding: '12px 16px', borderRadius: 12, border: `1px solid ${COLORS.line}` }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>
                    {searchQuery ? `Search Results for "${searchQuery}"` : CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  </div>
                  <button
                    onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}
                  >
                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to Categories
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                  {filteredProducts.map((product) => {
                    const qty = cart[product.id] || 0;
                    const orderStatus = getProductOrderStatus(product);
                    return (
                      <div key={product.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          loading="lazy"
                          style={{ width: '100%', height: 140, objectFit: 'cover' }}
                        />
                        <button onClick={() => setWishlist(prev => prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id])} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Heart size={16} fill={wishlist.includes(product.id) ? COLORS.danger : 'none'} color={wishlist.includes(product.id) ? COLORS.danger : COLORS.inkSoft} />
                        </button>
                        <div style={{ padding: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>{product.name}</div>
                          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 8 }}>{product.unit}</div>
                          
                          {/* Product attributes badges */}
                          <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                            {product.subscribable && (
                              <span style={{ fontSize: 9, background: '#E8F5E9', color: '#2E7D32', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Subscription</span>
                            )}
                            {product.preOrder && (
                              <span style={{ fontSize: 9, background: '#FFF3E0', color: '#E65100', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Pre-order (9PM)</span>
                            )}
                            {product.instantOrder && (
                              <span style={{ fontSize: 9, background: '#E3F2FD', color: '#1565C0', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Instant</span>
                            )}
                            {product.earlyMorningDelivery && (
                              <span style={{ fontSize: 9, background: '#F3E5F5', color: '#7B1FA2', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Early Morning (6:30-8:30 AM)</span>
                            )}
                          </div>
                          
                          {/* Order status message */}
                          <div style={{ fontSize: 10, color: COLORS.inkSoft, marginBottom: 8, fontStyle: 'italic' }}>
                            {orderStatus.message}
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(product.price)}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {product.subscribable && (
                                <button 
                                  onClick={() => {
                                    setSelectedProductForSubscription(product);
                                    setShowSubscriptionModal(true);
                                  }}
                                  style={{ background: '#4CAF50', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 11, cursor: 'pointer', color: 'white' }}
                                >
                                  Subscribe
                                </button>
                              )}
                              {(!orderStatus.available) ? (
                                <button 
                                  disabled
                                  style={{ background: '#ccc', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 11, cursor: 'not-allowed', color: '#666' }}
                                  title={orderStatus.message}
                                >
                                  Unavailable
                                </button>
                              ) : qty === 0 ? (
                                <button 
                                  onClick={() => {
                                    setCart(prev => ({ ...prev, [product.id]: 1 }));
                                    analytics.trackAddToCart(product);
                                  }} 
                                  style={{ background: COLORS.marigold, border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                                >
                                  {product.preOrder || product.earlyMorningDelivery ? 'Pre-order' : 'Add'}
                                </button>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.line}` }}>
                                  <button onClick={() => {
                                    const newQty = Math.max(0, qty - 1);
                                    setCart(prev => ({ ...prev, [product.id]: newQty }));
                                    if (newQty === 0) {
                                      analytics.trackRemoveFromCart(product);
                                    }
                                  }} style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>-</button>
                                  <span style={{ fontSize: 12, fontWeight: 700, padding: '0 4px' }}>{qty}</span>
                                  <button onClick={() => setCart(prev => ({ ...prev, [product.id]: qty + 1 }))} style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY ACCOUNT TAB */}
        {activeTab === 'my-account' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 20 }}>
              My Account
            </div>

            <form onSubmit={(e) => { 
              e.preventDefault(); 
              setUser({ ...user, ...profileForm }); 
              setIsEditingProfile(false);
              setSuccessMsg('Account details saved successfully!'); 
            }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  disabled={!isEditingProfile}
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} 
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    padding: 12, 
                    borderRadius: 8, 
                    border: `1px solid ${COLORS.line}`, 
                    fontSize: 13,
                    background: isEditingProfile ? '#fff' : '#F5F5F5',
                    color: COLORS.ink,
                    cursor: isEditingProfile ? 'text' : 'not-allowed'
                  }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Phone Number</label>
                <input 
                  type="tel" 
                  disabled={!isEditingProfile}
                  value={profileForm.phone} 
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} 
                  placeholder="10-digit Mobile Number"
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    padding: 12, 
                    borderRadius: 8, 
                    border: `1px solid ${COLORS.line}`, 
                    fontSize: 13,
                    background: isEditingProfile ? '#fff' : '#F5F5F5',
                    color: COLORS.ink,
                    cursor: isEditingProfile ? 'text' : 'not-allowed'
                  }} 
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Email Address</label>
                <input 
                  type="email" 
                  disabled={!isEditingProfile}
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} 
                  placeholder="name@example.com"
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    padding: 12, 
                    borderRadius: 8, 
                    border: `1px solid ${COLORS.line}`, 
                    fontSize: 13,
                    background: isEditingProfile ? '#fff' : '#F5F5F5',
                    color: COLORS.ink,
                    cursor: isEditingProfile ? 'text' : 'not-allowed'
                  }} 
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                {!isEditingProfile ? (
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSuccessMsg(null);
                      setIsEditingProfile(true);
                    }} 
                    style={{ background: COLORS.marigold, border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 13, color: COLORS.ink }}
                  >
                    Edit Details
                  </button>
                ) : (
                  <>
                    <button 
                      type="submit" 
                      style={{ background: COLORS.marigold, border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontSize: 13, color: COLORS.ink }}
                    >
                      Save Changes
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setProfileForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
                        setIsEditingProfile(false);
                      }} 
                      style={{ background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '12px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 13, color: COLORS.ink }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div style={{ background: COLORS.card, borderRadius: 16, padding: 40, textAlign: 'center', border: `1px solid ${COLORS.line}` }}>
                <Package size={32} color={COLORS.inkSoft} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink, marginBottom: 6 }}>No orders found</div>
                <button onClick={() => { setActiveTab('store'); setSelectedCategory(null); }} style={{ background: COLORS.marigold, border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Start Shopping</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 20, cursor: 'pointer' }} onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink }}>Order #{order.id.slice(-6)}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#E4F0E8', color: COLORS.dairy }}>{STATUS_LABELS[order.status] || order.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>{formatDateTime(order.createdAt)} · {order.items?.length || 0} items</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink }}>{formatCurrency(parseFloat(order.total))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'addresses' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink }}>Delivery Addresses</div>
              <button onClick={() => { setShowAddAddressModal(true); setMapLocationSelected(false); }} style={{ background: COLORS.marigold, border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} /> Add Address
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {addresses.filter(addr => addr.status !== 'deleted').map((addr) => (
                <div key={addr.id} style={{ border: `2px solid ${selectedAddressId === addr.id ? COLORS.marigold : COLORS.line}`, borderRadius: 12, padding: 16, background: selectedAddressId === addr.id ? COLORS.marigoldLight : '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{addr.title}</div>
                    {addr.orderingFor === 'Someone Else' && (
                      <div style={{ fontSize: 12, color: COLORS.marigoldDark, fontWeight: 600 }}>Ordering for: {addr.recipientName} ({addr.recipientPhone})</div>
                    )}
                    <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>{addr.line1}, {addr.locality} - {addr.pincode}</div>
                  </div>
                  <button 
                    onClick={() => setAddresses(addresses.map(a => a.id === addr.id ? { ...a, status: 'deleted' } : a))}
                    style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', padding: 4 }}
                    title="Delete address"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink }}>Support & Complaints</div>
              <button onClick={() => setShowComplaintModal(true)} style={{ background: COLORS.marigold, border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={15} /> Raise Ticket
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {complaints.map((comp) => (
                <div key={comp.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, background: '#FAFAFA' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>Ticket #{comp.id.slice(-6)} · Order #{comp.orderId}</div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>{comp.issue}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENT METHODS TAB */}
        {activeTab === 'payment-methods' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 20 }}>
              Payment Methods
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* CARDS */}
              <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, background: '#FAFAFA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={18} color={COLORS.marigoldDark} /> Cards
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
                      Supported: <strong>Visa</strong>, <strong>Mastercard</strong>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      const cardType = prompt("Select Card Type (Enter 'Visa' or 'Mastercard'):", "Visa");
                      const num = prompt("Enter card number:");
                      if (num && num.length >= 4) {
                        const typeFormatted = cardType && cardType.toLowerCase().includes('master') ? 'Mastercard' : 'Visa';
                        setSavedCards([...savedCards, { id: 'card_' + Date.now(), cardType: typeFormatted, last4: num.slice(-4), expMonth: '12', expYear: '29', holderName: user?.name || 'Cardholder' }]);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: COLORS.dairy, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={14} /> Add Card
                  </button>
                </div>

                {savedCards.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>No saved cards found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {savedCards.map(card => (
                      <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: `1px solid ${COLORS.line}`, padding: '10px 14px', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, display: 'flex', alignItems: 'center' }}>
                            <span style={{ background: card.cardType === 'Visa' ? '#1A1F71' : '#EB001B', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 4, marginRight: 8, fontWeight: 700 }}>
                              {card.cardType}
                            </span>
                            •••• {card.last4}
                          </div>
                          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4 }}>Expires {card.expMonth}/{card.expYear} · {card.holderName}</div>
                        </div>
                        <button type="button" onClick={() => setSavedCards(savedCards.filter(c => c.id !== card.id))} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* UPI */}
              <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, background: '#FAFAFA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check size={18} color={COLORS.marigoldDark} /> UPI
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
                      Supports Google Pay, PhonePe, PayZapp & all major Indian UPI apps
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      const provider = prompt("Select UPI App (e.g. Google Pay, PhonePe, PayZapp, Paytm, BHIM):", "Google Pay");
                      const upi = prompt("Enter your UPI VPA Handle (e.g. name@okaxis, name@ybl, name@pz):");
                      if (upi && upi.includes('@')) {
                        setSavedUpi([...savedUpi, { id: 'upi_' + Date.now(), upiId: upi.trim(), provider: provider || 'UPI' }]);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: COLORS.dairy, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={14} /> Add UPI
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {['Google Pay', 'PhonePe', 'PayZapp', 'Paytm', 'BHIM', 'Amazon Pay', 'CRED UPI'].map((appName, idx) => (
                    <span key={idx} style={{ fontSize: 11, background: '#fff', border: `1px solid ${COLORS.line}`, padding: '3px 8px', borderRadius: 12, fontWeight: 600, color: COLORS.inkSoft }}>
                      {appName}
                    </span>
                  ))}
                </div>

                {savedUpi.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>No saved UPI accounts found.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {savedUpi.map(upi => (
                      <div key={upi.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: `1px solid ${COLORS.line}`, padding: '10px 14px', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{upi.upiId}</div>
                          <div style={{ fontSize: 11, color: COLORS.dairy, fontWeight: 600 }}>{upi.provider}</div>
                        </div>
                        <button type="button" onClick={() => setSavedUpi(savedUpi.filter(u => u.id !== upi.id))} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WALLETS */}
              <div style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, background: '#FAFAFA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Banknote size={18} color={COLORS.marigoldDark} /> Wallets
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      const walletName = prompt("Enter Wallet Provider Name (e.g. Paytm, PhonePe Wallet):");
                      if (walletName) {
                        setSavedWallets([...savedWallets, { id: 'wallet_' + Date.now(), name: walletName, phone: user?.phone || 'Linked' }]);
                      }
                    }}
                    style={{ background: 'none', border: 'none', color: COLORS.dairy, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={14} /> Link Wallet
                  </button>
                </div>

                {savedWallets.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: COLORS.inkSoft }}>No linked wallets.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {savedWallets.map(w => (
                      <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: `1px solid ${COLORS.line}`, padding: '10px 14px', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>{w.name}</div>
                          <div style={{ fontSize: 11, color: COLORS.inkSoft }}>Account: {w.phone}</div>
                        </div>
                        <button type="button" onClick={() => setSavedWallets(savedWallets.filter(item => item.id !== w.id))} style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* CHECKOUT TAB */}
        {activeTab === 'checkout' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 16 }}>Checkout</div>
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Cart Items ({cartItemCount})</div>
                {cartItemsList.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, background: '#FAFAFA', borderRadius: 8, marginBottom: 6 }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Select Payment Option</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cards')}
                    style={{
                      background: selectedPaymentMethod === 'cards' ? COLORS.marigold : '#fff',
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: 8,
                      padding: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <CreditCard size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Cards / UPI / Wallet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('cod')}
                    style={{
                      background: selectedPaymentMethod === 'cod' ? COLORS.marigold : '#fff',
                      border: `1px solid ${COLORS.line}`,
                      borderRadius: 8,
                      padding: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Banknote size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Cash on Delivery</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                <span>Total</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
              <button type="submit" disabled={cartItemsList.length === 0 || isLoading} style={{ width: '100%', background: COLORS.marigold, border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 15, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                {isLoading ? 'Processing...' : (selectedPaymentMethod === 'cards' ? `Pay ${formatCurrency(finalTotal)} via Razorpay` : `Place Order (${formatCurrency(finalTotal)})`)}
              </button>
            </form>
          </div>
        )}

        {/* FAQ TAB */}
        {activeTab === 'faq' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 20 }}>Help Center / FAQs</div>
            <div style={{ background: '#FAFAFA', borderRadius: 8, padding: 12, border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.ink }}>When do you deliver?</div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>DailyBloom active delivery hours are strictly between 6 AM and 8 AM every morning in Guwahati.</div>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === 'about' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 20 }}>About DailyBloom</div>
            <div style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6 }}>
              DailyBloom is a daily morning essentials delivery service tailored specifically for households in Guwahati. We deliver fresh farm dairy, puja flowers directly from local vendors, organic sugarcane and date palm jaggery, organic honey, and fresh daily bakery goods.
            </div>
          </div>
        )}

        {/* CONTACT TAB */}
        {activeTab === 'contact' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 20 }}>Contact Us</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: COLORS.inkSoft }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={18} color={COLORS.marigold} /> +91 9876543210</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={18} color={COLORS.marigold} /> support@dailybloom.com</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={18} color={COLORS.marigold} /> Guwahati, Assam 781001</div>
            </div>
          </div>
        )}

        {/* TERMS TAB */}
        {activeTab === 'terms' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 20 }}>Terms & Conditions</div>
            <div style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6 }}>
              Dairy products must be pre-ordered the night before. Delivery hours are 6:00 AM - 8:00 AM in Guwahati.
            </div>
          </div>
        )}

        {/* PRIVACY TAB */}
        {activeTab === 'privacy' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 24 }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink, marginBottom: 20 }}>Privacy Policy</div>
            <div style={{ fontSize: 14, color: COLORS.inkSoft, lineHeight: 1.6 }}>
              We collect location and contact details strictly for delivering your daily essentials safely and on time in Guwahati.
            </div>
          </div>
        )}

        {/* ADD ADDRESS MODAL */}
        {showAddAddressModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, border: `1px solid ${COLORS.line}`, maxHeight: '90vh', overflowY: 'auto' }}>
              
              {!mapLocationSelected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Select Delivery Location</h3>
                    <button type="button" onClick={() => setShowAddAddressModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft }}>
                      <X size={20} />
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Position the pin on your exact location in Guwahati or tap the floating locate button.</div>
                  <div ref={mapRef} style={{ width: '100%', height: 360, borderRadius: 12, overflow: 'hidden', position: 'relative', border: `1px solid ${COLORS.line}` }}></div>
                  
                  <div>
                    <button 
                      type="button"
                      onClick={() => setMapLocationSelected(true)}
                      style={{ width: '100%', background: COLORS.marigold, border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer', color: COLORS.ink }}
                    >
                      Complete Address Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Complete Address Details</h3>
                    <button type="button" onClick={() => setShowAddAddressModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft }}>
                      <X size={20} />
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}>For whom am I ordering for?</label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="orderingFor" 
                          value="Myself" 
                          checked={newAddressForm.orderingFor === 'Myself'} 
                          onChange={() => setNewAddressForm(prev => ({ 
                            ...prev, 
                            orderingFor: 'Myself', 
                            addressType: prev.addressType === 'Other' ? 'Home' : prev.addressType,
                            customAddressType: ''
                          }))} 
                        /> Myself
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="orderingFor" 
                          value="Someone Else" 
                          checked={newAddressForm.orderingFor === 'Someone Else'} 
                          onChange={() => setNewAddressForm(prev => ({ 
                            ...prev, 
                            orderingFor: 'Someone Else', 
                            addressType: 'Other' 
                          }))} 
                        /> Someone Else
                      </label>
                    </div>
                  </div>

                  {newAddressForm.orderingFor === 'Someone Else' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.inkSoft }}>Recipient Name</label>
                        <input type="text" required value={newAddressForm.recipientName} onChange={(e) => setNewAddressForm({ ...newAddressForm, recipientName: e.target.value })} placeholder="Full Name" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, marginTop: 4, fontSize: 13 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.inkSoft }}>Recipient Phone</label>
                        <input type="tel" required value={newAddressForm.recipientPhone} onChange={(e) => setNewAddressForm({ ...newAddressForm, recipientPhone: e.target.value })} placeholder="Phone Number" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, marginTop: 4, fontSize: 13 }} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 6 }}>Address Type</label>
                    {newAddressForm.orderingFor === 'Myself' ? (
                      <select 
                        value={newAddressForm.addressType === 'Other' ? 'Home' : newAddressForm.addressType} 
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, addressType: e.target.value })} 
                        style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, background: '#fff' }}
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work</option>
                      </select>
                    ) : (
                      <select 
                        value="Other" 
                        disabled
                        style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, background: '#f5f5f5', color: COLORS.inkSoft }}
                      >
                        <option value="Other">Other</option>
                      </select>
                    )}
                  </div>

                  {newAddressForm.orderingFor === 'Someone Else' && (
                    <div>
                      <input 
                        type="text" 
                        required 
                        value={newAddressForm.customAddressType} 
                        onChange={(e) => setNewAddressForm({ ...newAddressForm, customAddressType: e.target.value })} 
                        placeholder="Enter address type (e.g. Temple, Relative's House)" 
                        style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }} 
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Address Line 1</label>
                    <div style={{ position: 'relative' }}>
                      <input type="text" required value={newAddressForm.line1} onChange={(e) => setNewAddressForm({ ...newAddressForm, line1: e.target.value })} placeholder="Selected area from map" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, paddingRight: 40 }} />
                      <button type="button" onClick={() => setMapLocationSelected(false)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.dairy }}><MapPin size={18} /></button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Flat / House Number</label>
                    <input type="text" required value={newAddressForm.flatHouseNumber} onChange={(e) => setNewAddressForm({ ...newAddressForm, flatHouseNumber: e.target.value })} placeholder="e.g. Flat 302, House No. 12" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Street / Building Name / Society Name</label>
                    <input type="text" required value={newAddressForm.streetBuildingSociety} onChange={(e) => setNewAddressForm({ ...newAddressForm, streetBuildingSociety: e.target.value })} placeholder="e.g. Green Valley Apartments, MG Road" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Locality / Area</label>
                    <input type="text" required value={newAddressForm.locality} onChange={(e) => { const loc = e.target.value; const pincode = getPincodeFromLocality(loc); setNewAddressForm({ ...newAddressForm, locality: loc, pincode: pincode || newAddressForm.pincode }); }} placeholder="e.g. Beltola, Zoo Road" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Pincode</label>
                    <input type="text" required value={newAddressForm.pincode} onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })} placeholder="Pincode (Auto-detected)" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Landmark (Optional)</label>
                    <input type="text" value={newAddressForm.landmark} onChange={(e) => setNewAddressForm({ ...newAddressForm, landmark: e.target.value })} placeholder="e.g. Near Ganesh Temple" style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button type="button" onClick={() => setMapLocationSelected(false)} style={{ flex: 1, background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10, fontWeight: 600, cursor: 'pointer' }}>Back to Map</button>
                    <button type="submit" style={{ flex: 1, background: COLORS.marigold, border: 'none', borderRadius: 8, padding: 10, fontWeight: 700, cursor: 'pointer' }}>Save Address</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* SUPPORT TICKET MODAL */}
        {showComplaintModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Raise Support Ticket</div>
              <form onSubmit={submitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea rows={4} required value={complaintText} onChange={(e) => setComplaintText(e.target.value)} placeholder="Describe your issue in detail..." style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={() => setShowComplaintModal(false)} style={{ flex: 1, background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, background: COLORS.marigold, border: 'none', borderRadius: 8, padding: 10, fontWeight: 700, cursor: 'pointer' }}>Submit</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ORDER DETAIL MODAL */}
        {showOrderDetail && selectedOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, border: `1px solid ${COLORS.line}`, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink }}>
                  Order #{selectedOrder.id.slice(-6)}
                </div>
                <button onClick={() => setShowOrderDetail(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft }}>
                  <X size={20} />
                </button>
              </div>

              {/* Order Status Timeline */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Order Status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { status: 'pending_approval', label: 'Pending Approval' },
                    { status: 'confirmed', label: 'Order Confirmed' },
                    { status: 'packed', label: 'Order Packed' },
                    { status: 'out_for_delivery', label: 'Out for Delivery' },
                    { status: 'delivered', label: 'Order Delivered' }
                  ].map((step, index) => {
                    const isActive = selectedOrder.status === step.status;
                    const isCompleted = index < [
                      'pending_approval', 'confirmed', 'packed', 'out_for_delivery', 'delivered'
                    ].indexOf(selectedOrder.status);
                    
                    return (
                      <div key={step.status} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: isActive ? COLORS.marigold : isCompleted ? COLORS.success : '#e0e0e0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isCompleted || isActive ? <Check size={14} color="white" /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <div style={{ fontSize: 13, color: isActive ? COLORS.ink : isCompleted ? COLORS.inkSoft : '#ccc', fontWeight: isActive ? 600 : 400 }}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Live Tracking Button for Out for Delivery */}
                {selectedOrder.status === 'out_for_delivery' && (
                  <button
                    onClick={() => startLiveTracking(selectedOrder.id)}
                    style={{
                      marginTop: 16,
                      width: '100%',
                      background: COLORS.marigold,
                      color: COLORS.ink,
                      border: 'none',
                      borderRadius: 10,
                      padding: 12,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <Navigation size={18} />
                    Track Live Location
                  </button>
                )}
              </div>

              {/* Order Items */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 8 }}>Items</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: COLORS.inkSoft }}>
                      <span>{item.product_name || item.name} x{item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.line}`, fontSize: 14, fontWeight: 700, color: COLORS.ink, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>

              {/* Feedback Button (only shown 1 hour after delivery) */}
              {selectedOrder.status === 'delivered' && (() => {
                const deliveryTime = new Date(selectedOrder.updated_at || selectedOrder.created_at);
                const oneHourLater = new Date(deliveryTime.getTime() + 60 * 60 * 1000);
                const canProvideFeedback = new Date() >= oneHourLater;
                
                return canProvideFeedback ? (
                  <button
                    onClick={() => {
                      setSelectedOrderForFeedback(selectedOrder);
                      setFeedbackModalOpen(true);
                    }}
                    style={{ width: '100%', background: COLORS.marigold, border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                  >
                    Provide Feedback / Report Issue
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, textAlign: 'center', padding: 8 }}>
                    Feedback available 1 hour after delivery
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* FEEDBACK/COMPLAINT MODAL */}
        {feedbackModalOpen && selectedOrderForFeedback && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>
                Feedback / Report Issue
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 16 }}>
                Order #{selectedOrderForFeedback.id.slice(-6)}
              </div>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setFeedbackType('complaint')}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: feedbackType === 'complaint' ? COLORS.marigoldLight : 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Report Issue
                </button>
                <button
                  onClick={() => setFeedbackType('feedback')}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: feedbackType === 'feedback' ? COLORS.marigoldLight : 'transparent', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Provide Feedback
                </button>
              </div>

              <textarea
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder={feedbackType === 'complaint' ? 'Describe the issue with your order...' : 'Share your feedback about the order...'}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, fontFamily: 'inherit', marginBottom: 12, resize: 'vertical' }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    setFeedbackModalOpen(false);
                    setSelectedOrderForFeedback(null);
                    setFeedbackText('');
                    setFeedbackType('complaint');
                  }}
                  style={{ flex: 1, background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Submit feedback/complaint
                    setSuccessMsg(`${feedbackType === 'complaint' ? 'Issue reported' : 'Feedback submitted'} successfully`);
                    setFeedbackModalOpen(false);
                    setSelectedOrderForFeedback(null);
                    setFeedbackText('');
                    setFeedbackType('complaint');
                    setTimeout(() => setSuccessMsg(null), 3000);
                  }}
                  style={{ flex: 1, background: COLORS.marigold, border: 'none', borderRadius: 8, padding: 10, fontWeight: 700, cursor: 'pointer' }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION MODAL */}
        {showSubscriptionModal && selectedProductForSubscription && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Subscribe to {selectedProductForSubscription.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>Choose subscription type:</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, border: `1px solid ${subscriptionType === 'daily' ? COLORS.marigold : COLORS.line}`, borderRadius: 8, background: subscriptionType === 'daily' ? '#FFF8E1' : 'transparent' }}>
                    <input type="radio" name="subscriptionType" value="daily" checked={subscriptionType === 'daily'} onChange={(e) => setSubscriptionType(e.target.value)} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Daily</div>
                      <div style={{ fontSize: 11, color: COLORS.inkSoft }}>Delivered every day</div>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, border: `1px solid ${subscriptionType === 'weekly' ? COLORS.marigold : COLORS.line}`, borderRadius: 8, background: subscriptionType === 'weekly' ? '#FFF8E1' : 'transparent' }}>
                    <input type="radio" name="subscriptionType" value="weekly" checked={subscriptionType === 'weekly'} onChange={(e) => setSubscriptionType(e.target.value)} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Weekly</div>
                      <div style={{ fontSize: 11, color: COLORS.inkSoft }}>Delivered once a week</div>
                    </div>
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: 12, border: `1px solid ${subscriptionType === 'monthly' ? COLORS.marigold : COLORS.line}`, borderRadius: 8, background: subscriptionType === 'monthly' ? '#FFF8E1' : 'transparent' }}>
                    <input type="radio" name="subscriptionType" value="monthly" checked={subscriptionType === 'monthly'} onChange={(e) => setSubscriptionType(e.target.value)} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>Monthly</div>
                      <div style={{ fontSize: 11, color: COLORS.inkSoft }}>Delivered once a month</div>
                    </div>
                  </label>
                </div>

                <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 8 }}>
                  Price: {formatCurrency(selectedProductForSubscription.price)} per {selectedProductForSubscription.unit}
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowSubscriptionModal(false);
                      setSelectedProductForSubscription(null);
                      setSubscriptionType('daily');
                    }} 
                    style={{ flex: 1, background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 10, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      const newSubscription = {
                        id: `sub_${Date.now()}`,
                        productId: selectedProductForSubscription.id,
                        productName: selectedProductForSubscription.name,
                        productPrice: selectedProductForSubscription.price,
                        unit: selectedProductForSubscription.unit,
                        type: subscriptionType,
                        startDate: new Date().toISOString(),
                        status: 'active'
                      };
                      setSubscriptions(prev => [...prev, newSubscription]);
                      setShowSubscriptionModal(false);
                      setSelectedProductForSubscription(null);
                      setSubscriptionType('daily');
                      setSuccessMsg(`Successfully subscribed to ${selectedProductForSubscription.name} (${subscriptionType})`);
                      setTimeout(() => setSuccessMsg(null), 3000);
                    }}
                    style={{ flex: 1, background: COLORS.marigold, border: 'none', borderRadius: 8, padding: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* LIVE TRACKING MODAL */}
      {showTrackingModal && selectedOrderForTracking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200 }}>
          <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, border: `1px solid ${COLORS.line}`, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: COLORS.ink }}>
                Live Tracking
              </div>
              <button onClick={stopLiveTracking} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft }}>
                <X size={20} />
              </button>
            </div>

            {/* Live Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: 12, background: '#E4F0E8', borderRadius: 10 }}>
              <Activity size={20} color={COLORS.dairy} />
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                {trackingData ? 'Live tracking active' : 'Connecting to tracking service...'}
              </div>
            </div>

            {/* Milestones */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>Delivery Progress</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trackingMilestones.length > 0 ? (
                  trackingMilestones.map((milestone, index) => (
                    <div key={milestone.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: COLORS.marigold,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Check size={14} color="white" />
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>
                        {milestone.milestone_type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.inkSoft, marginLeft: 'auto' }}>
                        {new Date(milestone.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>Waiting for tracking updates...</div>
                )}
              </div>
            </div>

            {/* Simple Map Placeholder */}
            <div style={{ height: 200, background: '#E8EFE8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', color: COLORS.inkSoft }}>
                <MapPin size={32} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 13 }}>Live Map View</div>
                <div style={{ fontSize: 11 }}>Tracking partner location in real-time</div>
              </div>
            </div>

            {/* Current Location Info */}
            {trackingData && (
              <div style={{ padding: 12, background: '#F8F9F5', borderRadius: 10, fontSize: 12, color: COLORS.inkSoft }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Current Partner Location:</div>
                <div>Lat: {trackingData.latitude}</div>
                <div>Lng: {trackingData.longitude}</div>
                <div>Last updated: {new Date(trackingData.timestamp).toLocaleTimeString()}</div>
                {trackingData.speed && <div>Speed: {trackingData.speed} km/h</div>}
              </div>
            )}

            <button
              onClick={stopLiveTracking}
              style={{
                marginTop: 16,
                width: '100%',
                background: COLORS.line,
                color: COLORS.ink,
                border: 'none',
                borderRadius: 10,
                padding: 12,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              Close Tracking
            </button>
          </div>
        </div>
      )}

        </div>
      </div>

      {/* BOTTOM NAV BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: COLORS.card, borderTop: `1px solid ${COLORS.line}`, padding: '12px 20px', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 100 }}>
        <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => { setActiveTab('store'); setSelectedCategory(null); }} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'store' ? COLORS.marigoldDark : COLORS.inkSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('checkout')} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: activeTab === 'checkout' ? COLORS.marigoldDark : COLORS.inkSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, position: 'relative' }}
          >
            <ShoppingBag size={20} />
            {cartItemCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: COLORS.danger, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cartItemCount}
              </span>
            )}
            <span>Cart</span>
          </button>
        </div>
      </div>

      {/* WHATSAPP FLOATING BUTTON */}
      <button
        onClick={handleWhatsAppOrder}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: '#25D366',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
          zIndex: 1000,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Order via WhatsApp"
      >
        <MessageCircle size={28} color="white" />
      </button>

      {/* FOOTER */}
      {user && (
        <div style={{ background: COLORS.card, borderTop: `1px solid ${COLORS.line}`, padding: '12px 20px 50px', marginTop: 10, boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 12, justifyContent: 'center' }}>
              <button onClick={() => setActiveTab('about')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, fontSize: 12, padding: 0 }}>About Us</button>
              <button onClick={() => setActiveTab('faq')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, fontSize: 12, padding: 0 }}>FAQs</button>
              <button onClick={() => setActiveTab('terms')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, fontSize: 12, padding: 0 }}>Terms & Conditions</button>
              <button onClick={() => setActiveTab('privacy')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, fontSize: 12, padding: 0 }}>Privacy Policy</button>
              <button onClick={() => setActiveTab('contact')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft, fontSize: 12, padding: 0 }}>Contact Us</button>
            </div>
            
            <div style={{ borderTop: `1px solid ${COLORS.line}`, paddingTop: 8, textAlign: 'center' }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
                DailyBloom
              </div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft }}>
                © DailyBloom. All rights reserved. Made with ❤️ in Guwahati
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap the entire app with ErrorBoundary
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;