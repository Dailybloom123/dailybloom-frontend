import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Lock, Package, IndianRupee, Clock, MapPin, Phone, Mail, ChevronDown, ChevronUp, Calendar, AlertTriangle, XCircle, Plus, Users, Building2, Store, TrendingUp, Shield, Edit, Trash2, MessageCircle, Send, BarChart3, PieChart, ArrowRight, X, Check, LogOut } from 'lucide-react';
import analytics from './analytics-light.js';
import VirtualOrderList from './components/VirtualOrderList.jsx';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:4000/api'
  : 'https://dailybloom-x82y.onrender.com/api';
const DAILYBLOOM_WHATSAPP_BUSINESS = '919910217309';

const COLORS = {
  marigold: '#F6A623',
  marigoldDark: '#D4881A',
  marigoldLight: '#FFF8E1',
  dairy: '#4CAF50',
  dairyLight: '#E8F5E9',
  ink: '#1A1A1A',
  inkSoft: '#666666',
  line: '#E0E0E0',
  card: '#FFFFFF',
  bg: '#FAFAFA', // Clean light gray
  danger: '#EF4444',
  dangerBg: '#FEE2E2',
  rose: '#E57373',
  success: '#22C55E',
  primary: '#2563EB', // Professional blue
  secondary: '#64748B', // Slate gray
  accent: '#0F172A', // Dark slate
};

// WhatsApp Business Functions
const openWhatsAppChat = (message, phoneNumber = DAILYBLOOM_WHATSAPP_BUSINESS) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

const openWhatsAppPartnerSupport = (partnerId, issue) => {
  const message = `🆘 *Admin to Partner - DailyBloom* 🆘\n\n` +
    `*Partner ID:* ${partnerId}\n` +
    `*Issue:* ${issue}\n\n` +
    `Please address this matter urgently. Thank you!`;
  openWhatsAppChat(message);
};

export default function ManagementPortal() {
  const [loginType, setLoginType] = useState(null); // 'admin' or 'partner'
  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });
  const [partnerCredentials, setPartnerCredentials] = useState({ partnerId: '', category: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [error, setError] = useState(null);

  // Admin State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState({ dashboard: true });
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [salesPeriod, setSalesPeriod] = useState('weekly'); // 'weekly' or 'monthly'
  const [loading, setLoading] = useState(false);
  const [stockNotifications, setStockNotifications] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderTracking, setOrderTracking] = useState([]);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    phone: '',
    email: '',
    category: '',
    address: '',
    isActive: true
  });

  // Partner State
  const [partnerOrders, setPartnerOrders] = useState([]);
  const [partnerCategory, setPartnerCategory] = useState('');
  const [partnerStockNotifications, setPartnerStockNotifications] = useState([]);
  const [selectedPartnerOrder, setSelectedPartnerOrder] = useState(null);
  const [partnerOrderTracking, setPartnerOrderTracking] = useState([]);

  // Check for existing admin session on load
  useEffect(() => {
    const adminToken = localStorage.getItem('dailybloom_admin_token');
    const adminUser = localStorage.getItem('dailybloom_admin_user');
    if (adminToken && adminUser) {
      setIsAdmin(true);
      setLoginType(null);
      // Delay fetching data to ensure token is properly set
      setTimeout(() => fetchAdminData(), 100);
    }
  }, []);

  // Check for existing partner session on load
  useEffect(() => {
    const partnerToken = localStorage.getItem('dailybloom_partner_token');
    const partnerUser = localStorage.getItem('dailybloom_partner_user');
    if (partnerToken && partnerUser) {
      const user = JSON.parse(partnerUser);
      setIsPartner(true);
      setPartnerCategory(user.category);
      setLoginType(null);
      fetchPartnerOrders();
    }
  }, []);

  const handleAdminLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCredentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('dailybloom_admin_token', data.token);
        localStorage.setItem('dailybloom_admin_user', JSON.stringify(data.user));
        setIsAdmin(true);
        setLoginType(null);
        
        // Track admin login
        analytics.trackEvent('login', { method: 'admin', portal: 'management' });
        
        // Delay fetching data to ensure token is properly set
        setTimeout(() => fetchAdminData(), 100);
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (e) {
      console.error('Admin login error:', e);
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/partner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerCredentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('dailybloom_partner_token', data.token);
        localStorage.setItem('dailybloom_partner_user', JSON.stringify(data.user));
        setIsPartner(true);
        setPartnerCategory(partnerCredentials.category);
        setLoginType(null);
        setError(null);
        fetchPartnerOrders();
      } else {
        setError(data.error || 'Login failed. Please check your Partner ID and category.');
      }
    } catch (e) {
      console.error('Partner login error:', e);
      setError('Network error. Please check if the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Fetch all admin data including complaints and feedback
      const [ordersRes, partnersRes, complaintsRes, feedbackRes, stockNotifRes, lowStockRes] = await Promise.all([
        fetch(`${API_BASE}/admin/orders`, { headers }),
        fetch(`${API_BASE}/admin/partners`, { headers }),
        fetch(`${API_BASE}/complaints`, { headers }),
        fetch(`${API_BASE}/feedback`, { headers }),
        fetch(`${API_BASE}/stock/notifications`, { headers }),
        fetch(`${API_BASE}/stock/low-stock`, { headers }),
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (partnersRes.ok) setPartners(await partnersRes.json());
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());
      if (feedbackRes.ok) setFeedback(await feedbackRes.json());
      if (stockNotifRes.ok) setStockNotifications(await stockNotifRes.json());
      if (lowStockRes.ok) setLowStockAlerts(await lowStockRes.json());

      // Mock stock data (fallback if API fails)
      setStockData([
        { id: 1, name: 'Fresh Milk', category: 'dairy', stock: 150, unit: 'liters', reorderLevel: 50 },
        { id: 2, name: 'Brown Bread', category: 'bakery', stock: 80, unit: 'pieces', reorderLevel: 30 },
        { id: 3, name: 'Organic Honey', category: 'honey', stock: 45, unit: 'bottles', reorderLevel: 15 },
        { id: 4, name: 'Red Roses', category: 'flowers', stock: 200, unit: 'stems', reorderLevel: 50 },
      ]);

      // Mock sales data
      setSalesData([
        { locality: 'Fancy Bazar', sales: 45000, orders: 120 },
        { locality: 'Panbazar', sales: 38000, orders: 95 },
        { locality: 'Uzan Bazar', sales: 32000, orders: 80 },
        { locality: 'Bhangagarh', sales: 28000, orders: 70 },
        { locality: 'Ulubari', sales: 25000, orders: 65 },
      ]);
    } catch (e) {
      console.error('Error fetching admin data:', e);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPartner = async () => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const response = await fetch(`${API_BASE}/admin/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPartnerForm)
      });

      if (response.ok) {
        const newPartner = await response.json();
        setPartners([...partners, newPartner]);
        setShowAddPartnerModal(false);
        setNewPartnerForm({
          name: '',
          phone: '',
          email: '',
          category: '',
          address: '',
          isActive: true
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add partner');
      }
    } catch (e) {
      console.error('Error adding partner:', e);
      setError('Failed to add partner');
    }
  };

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const [adminChatMessages, setAdminChatMessages] = useState({});
  const [adminNewMessage, setAdminNewMessage] = useState({});

  const sendAdminMessage = async (recipientType, recipientId, message) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      
      // In a real implementation, this would send to a communication API
      // For now, we'll simulate it with localStorage
      const chatKey = `admin_chat_${recipientType}_${recipientId}`;
      const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
      
      const newMessageObj = {
        id: Date.now(),
        sender: 'admin',
        message: message,
        timestamp: new Date().toISOString()
      };
      
      existingMessages.push(newMessageObj);
      localStorage.setItem(chatKey, JSON.stringify(existingMessages));
      
      setAdminChatMessages(prev => ({
        ...prev,
        [`${recipientType}_${recipientId}`]: existingMessages
      }));
      
      setAdminNewMessage(prev => ({
        ...prev,
        [`${recipientType}_${recipientId}`]: ''
      }));
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const loadAdminChat = (recipientType, recipientId) => {
    const chatKey = `admin_chat_${recipientType}_${recipientId}`;
    const existingMessages = JSON.parse(localStorage.getItem(chatKey) || '[]');
    setAdminChatMessages(prev => ({
      ...prev,
      [`${recipientType}_${recipientId}`]: existingMessages
    }));
  };

  const handleComplaintResolve = async (complaintId) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const response = await fetch(`${API_BASE}/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      });
      
      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (e) {
      console.error('Error resolving complaint:', e);
    }
  };

  const handleComplaintWarnPartner = async (complaintId) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const response = await fetch(`${API_BASE}/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'resolved',
          partner_action: 'warn',
          admin_notes: 'Partner warned due to complaint'
        })
      });
      
      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (e) {
      console.error('Error warning partner:', e);
    }
  };

  const handleWarnPartner = async (partnerId) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const response = await fetch(`${API_BASE}/admin/partners/${partnerId}/warn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (e) {
      console.error('Error warning partner:', e);
    }
  };

  const handleBlockPartner = async (partnerId) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const response = await fetch(`${API_BASE}/admin/partners/${partnerId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (e) {
      console.error('Error blocking partner:', e);
    }
  };

  const handleUnblockPartner = async (partnerId) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const response = await fetch(`${API_BASE}/admin/partners/${partnerId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchAdminData(); // Refresh data
      }
    } catch (e) {
      console.error('Error unblocking partner:', e);
    }
  };

  const handleAdminLogout = () => { 
    localStorage.removeItem('dailybloom_admin_token');
    localStorage.removeItem('dailybloom_admin_user');
    setIsAdmin(false); 
    setLoginType(null); 
  };

  const fetchOrderTracking = async (orderId) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_BASE}/order-tracking/${orderId}/tracking`, { headers });
      if (res.ok) {
        setOrderTracking(await res.json());
      }
    } catch (e) {
      console.error('Error fetching order tracking:', e);
    }
  };

  const updateOrderStatus = async (orderId, status, notes) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      
      const res = await fetch(`${API_BASE}/order-tracking/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, notes }),
      });

      if (res.ok) {
        fetchAdminData(); // Refresh orders
        if (selectedOrder?.id === orderId) {
          fetchOrderTracking(orderId); // Refresh tracking
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update order status');
      }
    } catch (e) {
      console.error('Error updating order status:', e);
      setError('Failed to update order status');
    }
  };

  const assignOrderToPartner = async (orderId, partnerId) => {
    try {
      const token = localStorage.getItem('dailybloom_admin_token');
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      
      const res = await fetch(`${API_BASE}/order-tracking/${orderId}/assign`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ partner_id: partnerId }),
      });

      if (res.ok) {
        fetchAdminData(); // Refresh orders
        if (selectedOrder?.id === orderId) {
          fetchOrderTracking(orderId); // Refresh tracking
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to assign order');
      }
    } catch (e) {
      console.error('Error assigning order:', e);
      setError('Failed to assign order');
    }
  };

  const fetchPartnerOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('dailybloom_partner_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [ordersRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/partner/orders`, {
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ partner_id: partnerCredentials.partnerId, category: partnerCredentials.category }),
          method: 'POST',
        }),
        fetch(`${API_BASE}/stock/notifications`, { headers }),
      ]);
      
      if (ordersRes.ok) setPartnerOrders(await ordersRes.json());
      if (notifRes.ok) setPartnerStockNotifications(await notifRes.json());
    } catch (e) {
      console.error('Error fetching partner data:', e);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerOrderTracking = async (orderId) => {
    try {
      const token = localStorage.getItem('dailybloom_partner_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const res = await fetch(`${API_BASE}/order-tracking/${orderId}/tracking`, { headers });
      if (res.ok) {
        setPartnerOrderTracking(await res.json());
      }
    } catch (e) {
      console.error('Error fetching partner order tracking:', e);
    }
  };

  const updatePartnerOrderStatus = async (orderId, status, notes, currentLocation) => {
    try {
      const token = localStorage.getItem('dailybloom_partner_token');
      const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
      
      const res = await fetch(`${API_BASE}/order-tracking/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status, notes, current_location: currentLocation }),
      });

      if (res.ok) {
        fetchPartnerOrders(); // Refresh orders
        if (selectedPartnerOrder?.id === orderId) {
          fetchPartnerOrderTracking(orderId); // Refresh tracking
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update order status');
      }
    } catch (e) {
      console.error('Error updating partner order status:', e);
      setError('Failed to update order status');
    }
  };

  // Login Selection Screen
  if (!loginType) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "Manrope, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 500, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
              DailyBloom
            </h1>
            <p style={{ color: COLORS.inkSoft, fontSize: 14 }}>Admin & Partner Portal</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button
              onClick={() => setLoginType('admin')}
              style={{
                background: COLORS.primary,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: 20,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              <Shield size={24} />
              Admin Login
            </button>

            <button
              onClick={() => setLoginType('partner')}
              style={{
                background: COLORS.secondary,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: 20,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              <Users size={24} />
              Partner/Vendor Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Login Form
  if (loginType === 'admin' && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "Manrope, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%' }}>
          <button
            onClick={() => setLoginType(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: COLORS.inkSoft }}
          >
            <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
            Back
          </button>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
            Admin Login
          </h2>
          <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>Access DailyBloom Management System</p>

          {error && (
            <div style={{ background: COLORS.dangerBg, color: COLORS.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 6, display: 'block' }}>Email</label>
              <input
                type="email"
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, email: e.target.value })}
                placeholder="admin@dailybloom.com"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 6, display: 'block' }}>Password</label>
              <input
                type="password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                placeholder="••••••••"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, outline: 'none' }}
              />
            </div>

            <button
              onClick={handleAdminLogin}
              disabled={loading}
              style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Partner Login Form
  if (loginType === 'partner' && !isPartner) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "Manrope, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 400, width: '100%' }}>
          <button
            onClick={() => setLoginType(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: COLORS.inkSoft }}
          >
            <ArrowRight size={20} style={{ transform: 'rotate(180deg)' }} />
            Back
          </button>

          <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
            Partner Login
          </h2>
          <p style={{ color: COLORS.inkSoft, fontSize: 13, marginBottom: 24 }}>Access Your Partner Dashboard</p>

          {error && (
            <div style={{ background: COLORS.dangerBg, color: COLORS.danger, padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 6, display: 'block' }}>Partner ID</label>
              <input
                type="text"
                value={partnerCredentials.partnerId}
                onChange={(e) => setPartnerCredentials({ ...partnerCredentials, partnerId: e.target.value })}
                placeholder="Enter your Partner ID"
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 6, display: 'block' }}>Category</label>
              <select
                value={partnerCredentials.category}
                onChange={(e) => setPartnerCredentials({ ...partnerCredentials, category: e.target.value })}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, outline: 'none' }}
              >
                <option value="">Select your category</option>
                <option value="dairy">Dairy</option>
                <option value="bakery">Bakery</option>
                <option value="honey">Honey & Jaggery</option>
                <option value="flowers">Fresh Flowers</option>
              </select>
            </div>

            <button
              onClick={handlePartnerLogin}
              disabled={loading}
              style={{ background: COLORS.secondary, color: '#fff', border: 'none', borderRadius: 8, padding: 14, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging in...' : 'Login as Partner'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "Manrope, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Admin Header */}
          <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, marginBottom: 24, border: `1px solid ${COLORS.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 28, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>
                Admin Dashboard
              </h1>
              <p style={{ color: COLORS.inkSoft, fontSize: 14 }}>DailyBloom Management System</p>
            </div>
            <button
              onClick={handleAdminLogout}
              style={{ background: 'transparent', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '10px 20px', cursor: 'pointer', color: COLORS.danger, fontSize: 13, fontWeight: 600 }}
            >
              Logout
            </button>
          </div>

          {/* Admin Sidebar Layout */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Vertical Sidebar */}
            <div style={{ 
              width: 260, 
              background: COLORS.card, 
              border: `1px solid ${COLORS.line}`, 
              borderRadius: 12, 
              padding: '20px 0',
              minHeight: 'calc(100vh - 200px)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ padding: '0 20px 20px', borderBottom: `1px solid ${COLORS.line}`, marginBottom: 16 }}>
                <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 16, fontWeight: 700, color: COLORS.ink, margin: 0 }}>
                  Navigation
                </h3>
              </div>

              {/* Navigation Items */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Dashboard with sub-items */}
                <div>
                  <button
                    onClick={() => toggleMenu('dashboard')}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.ink,
                      textAlign: 'left'
                    }}
                  >
                    <BarChart3 size={18} />
                    Dashboard
                    <ChevronDown size={16} style={{ marginLeft: 'auto', transform: expandedMenus.dashboard ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  
                  {expandedMenus.dashboard && (
                    <div style={{ marginLeft: 32, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={() => setActiveTab('orders')}
                        style={{
                          width: '100%',
                          background: activeTab === 'orders' ? COLORS.marigoldLight : 'none',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.ink,
                          textAlign: 'left',
                          borderRadius: 6
                        }}
                      >
                        <Package size={14} />
                        Orders
                      </button>
                      <button
                        onClick={() => setActiveTab('stock')}
                        style={{
                          width: '100%',
                          background: activeTab === 'stock' ? COLORS.marigoldLight : 'none',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.ink,
                          textAlign: 'left',
                          borderRadius: 6
                        }}
                      >
                        <Store size={14} />
                        Stock
                      </button>
                    </div>
                  )}
                </div>

                {/* Complaint & Feedback */}
                <div>
                  <button
                    onClick={() => toggleMenu('complaints-feedback')}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.ink,
                      textAlign: 'left'
                    }}
                  >
                    <Shield size={18} />
                    Complaint & Feedback
                    <ChevronDown size={16} style={{ marginLeft: 'auto', transform: expandedMenus['complaints-feedback'] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  
                  {expandedMenus['complaints-feedback'] && (
                    <div style={{ marginLeft: 32, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={() => setActiveTab('complaints')}
                        style={{
                          width: '100%',
                          background: activeTab === 'complaints' ? COLORS.marigoldLight : 'none',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.ink,
                          textAlign: 'left',
                          borderRadius: 6
                        }}
                      >
                        <AlertTriangle size={14} />
                        Complaints
                      </button>
                      <button
                        onClick={() => setActiveTab('feedback')}
                        style={{
                          width: '100%',
                          background: activeTab === 'feedback' ? COLORS.marigoldLight : 'none',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.ink,
                          textAlign: 'left',
                          borderRadius: 6
                        }}
                      >
                        <Check size={14} />
                        Feedback
                      </button>
                    </div>
                  )}
                </div>

                {/* Partners */}
                <button
                  onClick={() => setActiveTab('partners')}
                  style={{
                    width: '100%',
                    background: activeTab === 'partners' ? COLORS.marigoldLight : 'none',
                    border: 'none',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.ink,
                    textAlign: 'left',
                    borderRadius: 6
                  }}
                >
                  <Users size={18} />
                  Partners
                </button>

                {/* Communication */}
                <div>
                  <button
                    onClick={() => toggleMenu('communication')}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      padding: '12px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      color: COLORS.ink,
                      textAlign: 'left'
                    }}
                  >
                    <MessageCircle size={18} />
                    Communication
                    <ChevronDown size={16} style={{ marginLeft: 'auto', transform: expandedMenus.communication ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                  
                  {expandedMenus.communication && (
                    <div style={{ marginLeft: 32, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button
                        onClick={() => setActiveTab('partner-communication')}
                        style={{
                          width: '100%',
                          background: activeTab === 'partner-communication' ? COLORS.marigoldLight : 'none',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.ink,
                          textAlign: 'left',
                          borderRadius: 6
                        }}
                      >
                        <Phone size={14} />
                        Partners
                      </button>
                      <button
                        onClick={() => setActiveTab('customer-communication')}
                        style={{
                          width: '100%',
                          background: activeTab === 'customer-communication' ? COLORS.marigoldLight : 'none',
                          border: 'none',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          color: COLORS.ink,
                          textAlign: 'left',
                          borderRadius: 6
                        }}
                      >
                        <Mail size={14} />
                        Customers
                      </button>
                    </div>
                  )}
                </div>

                {/* Sales */}
                <button
                  onClick={() => setActiveTab('sales')}
                  style={{
                    width: '100%',
                    background: activeTab === 'sales' ? COLORS.marigoldLight : 'none',
                    border: 'none',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.ink,
                    textAlign: 'left',
                    borderRadius: 6
                  }}
                >
                  <TrendingUp size={18} />
                  Sales
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '24px' }}>
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
                  <div 
                    onClick={() => setActiveTab('orders')}
                    style={{ 
                      background: COLORS.card, 
                      borderRadius: 16, 
                      padding: 24, 
                      border: `1px solid ${COLORS.line}`,
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ background: COLORS.marigoldLight, borderRadius: 8, padding: 10 }}>
                        <Package size={24} color={COLORS.marigoldDark} />
                      </div>
                      <div>
                        <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.ink }}>{orders.length}</div>
                        <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Total Orders</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 8 }}>Click to view orders</div>
                  </div>

              <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ background: COLORS.dairyLight, borderRadius: 8, padding: 10 }}>
                    <Users size={24} color={COLORS.dairy} />
                  </div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.ink }}>{partners.length}</div>
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Active Partners</div>
                  </div>
                </div>
              </div>

              <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ background: COLORS.dangerBg, borderRadius: 8, padding: 10 }}>
                    <AlertTriangle size={24} color={COLORS.danger} />
                  </div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.ink }}>{complaints.length}</div>
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Open Complaints</div>
                  </div>
                </div>
              </div>

              <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ background: COLORS.marigoldLight, borderRadius: 8, padding: 10 }}>
                    <IndianRupee size={24} color={COLORS.marigoldDark} />
                  </div>
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: COLORS.ink }}>
                      ₹{salesData.reduce((sum, item) => sum + item.sales, 0).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Total Revenue</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
                Partner Communications
              </h2>
              
              {stockNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No stock communications yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {stockNotifications.map((notification) => (
                    <div key={notification.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                          {notification.partner_name} ({notification.category})
                        </div>
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 600, 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          background: notification.status === 'pending' ? COLORS.dangerBg : COLORS.dairyLight, 
                          color: notification.status === 'pending' ? COLORS.danger : COLORS.dairy 
                        }}>
                          {notification.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>
                        Type: {notification.type}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 12 }}>
                        {notification.message}
                      </div>
                      {notification.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={() => {/* Handle approve */}}
                            style={{ background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => {/* Handle reject */}}
                            style={{ background: COLORS.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Partner Communication Tab */}
          {activeTab === 'partner-communication' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
                Partner Communications
              </h2>
              
              {partners.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No partners available for communication.</div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {partners.map((partner) => (
                    <div key={partner.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                          {partner.name}
                        </div>
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 600, 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          background: partner.is_active ? COLORS.dairyLight : COLORS.dangerBg,
                          color: partner.is_active ? COLORS.dairy : COLORS.danger
                        }}>
                          {partner.is_active ? 'Active' : 'Blocked'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>
                        Category: {partner.category} · Phone: {partner.phone}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 12 }}>
                        Warnings: {partner.warnings || 0}/3
                        {partner.warnings >= 3 && (
                          <span style={{ color: COLORS.danger, fontWeight: 600, marginLeft: 8 }}>· BLOCKED</span>
                        )}
                      </div>
                      
                      {/* Partner Actions */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        {partner.warnings < 3 && (
                          <button
                            onClick={() => handleWarnPartner(partner.id)}
                            style={{ background: COLORS.warning, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Issue Warning ({partner.warnings || 0}/3)
                          </button>
                        )}
                        {partner.is_active && (
                          <button
                            onClick={() => handleBlockPartner(partner.id)}
                            style={{ background: COLORS.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Block Partner
                          </button>
                        )}
                        {!partner.is_active && (
                          <button
                            onClick={() => handleUnblockPartner(partner.id)}
                            style={{ background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            Unblock Partner
                          </button>
                        )}
                      </div>
                      
                      {/* Chat Interface */}
                      <div style={{ background: COLORS.bg, borderRadius: 8, padding: 12, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
                        {(adminChatMessages[`partner_${partner.id}`] || []).map((msg) => (
                          <div key={msg.id} style={{ 
                            marginBottom: 8, 
                            padding: 8, 
                            borderRadius: 8, 
                            background: msg.sender === 'admin' ? COLORS.marigoldLight : '#E3F2FD',
                            marginLeft: msg.sender === 'admin' ? 'auto' : 0,
                            marginRight: msg.sender === 'admin' ? 0 : 'auto',
                            maxWidth: '80%'
                          }}>
                            <div style={{ fontSize: 12, color: COLORS.ink }}>{msg.message}</div>
                            <div style={{ fontSize: 10, color: COLORS.inkSoft, marginTop: 4 }}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={adminNewMessage[`partner_${partner.id}`] || ''}
                          onChange={(e) => setAdminNewMessage(prev => ({ ...prev, [`partner_${partner.id}`]: e.target.value }))}
                          placeholder="Type message..."
                          style={{ flex: 1, padding: 8, borderRadius: 6, border: `1px solid ${COLORS.line}`, fontSize: 13 }}
                        />
                        <button
                          onClick={() => {
                            if (adminNewMessage[`partner_${partner.id}`]) {
                              sendAdminMessage('partner', partner.id, adminNewMessage[`partner_${partner.id}`]);
                            }
                          }}
                          style={{ background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 6, padding: '8px 12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customer Communication Tab */}
          {activeTab === 'customer-communication' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
                Customer Communications
              </h2>
              <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>
                Customer communication interface - General inquiries and non-order-related queries will appear here.
              </div>
              
              {/* Sample customer communication interface */}
              <div style={{ marginTop: 20, padding: 16, background: COLORS.bg, borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, marginBottom: 12 }}>
                  Recent Customer Inquiries
                </div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                  No recent inquiries. Customer communication will be implemented with real-time messaging system.
                </div>
              </div>
            </div>
          )}

          {/* Stock Management Tab */}
          {activeTab === 'stock' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
                  Stock Management
                </h2>
                <button style={{ background: COLORS.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Plus size={16} /> Add Product
                </button>
              </div>

              {lowStockAlerts.length > 0 && (
                <div style={{ background: COLORS.dangerBg, borderRadius: 8, padding: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.danger, marginBottom: 8 }}>
                    ⚠️ Low Stock Alerts ({lowStockAlerts.length})
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.danger }}>
                    {lowStockAlerts.map(alert => alert.name).join(', ')}
                  </div>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${COLORS.line}` }}>
                      <th style={{ textAlign: 'left', padding: 12, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Product</th>
                      <th style={{ textAlign: 'left', padding: 12, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Category</th>
                      <th style={{ textAlign: 'right', padding: 12, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Stock</th>
                      <th style={{ textAlign: 'center', padding: 12, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Status</th>
                      <th style={{ textAlign: 'center', padding: 12, fontSize: 13, fontWeight: 600, color: COLORS.ink }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.map((item) => (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                        <td style={{ padding: 12, fontSize: 14, color: COLORS.ink }}>{item.name}</td>
                        <td style={{ padding: 12, fontSize: 13, color: COLORS.inkSoft, textTransform: 'capitalize' }}>{item.category}</td>
                        <td style={{ padding: 12, fontSize: 14, color: COLORS.ink, textAlign: 'right', fontWeight: 600 }}>
                          {item.stock} {item.unit}
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: item.stock <= item.reorderLevel ? COLORS.dangerBg : COLORS.dairyLight,
                            color: item.stock <= item.reorderLevel ? COLORS.danger : COLORS.dairy,
                          }}>
                            {item.stock <= item.reorderLevel ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                        <td style={{ padding: 12, textAlign: 'center' }}>
                          <button style={{ background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: COLORS.inkSoft }}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales Analytics Tab */}
          {activeTab === 'sales' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
                  Sales Analytics
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setSalesPeriod('weekly')}
                    style={{
                      background: salesPeriod === 'weekly' ? COLORS.marigold : 'transparent',
                      color: salesPeriod === 'weekly' ? COLORS.ink : COLORS.inkSoft,
                      border: salesPeriod === 'weekly' ? 'none' : `1px solid ${COLORS.line}`,
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setSalesPeriod('monthly')}
                    style={{
                      background: salesPeriod === 'monthly' ? COLORS.marigold : 'transparent',
                      color: salesPeriod === 'monthly' ? COLORS.ink : COLORS.inkSoft,
                      border: salesPeriod === 'monthly' ? 'none' : `1px solid ${COLORS.line}`,
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>Locality/Area-wise Sales</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                  {salesData.map((item, index) => (
                    <div key={index} style={{ background: COLORS.bg, borderRadius: 12, padding: 16, border: `1px solid ${COLORS.line}` }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>{item.locality}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.marigoldDark, marginBottom: 4 }}>
                        ₹{item.sales.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{item.orders} orders</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>Sales Trend</h3>
                <div style={{ height: 200, background: COLORS.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${COLORS.line}` }}>
                  <div style={{ textAlign: 'center', color: COLORS.inkSoft }}>
                    <BarChart3 size={48} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 13 }}>Sales chart visualization</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>{salesPeriod === 'weekly' ? 'Last 7 days' : 'Last 30 days'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
                Complaint Management
              </h2>
              
              {complaints.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No complaints yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {complaints.map((complaint) => (
                    <div key={complaint.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                          {complaint.subject}
                        </div>
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 600, 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          background: complaint.status === 'pending' ? COLORS.dangerBg : 
                                   complaint.status === 'in_progress' ? COLORS.marigoldLight : 
                                   complaint.status === 'resolved' ? COLORS.dairyLight : '#E0E0E0',
                          color: complaint.status === 'pending' ? COLORS.danger : 
                                 complaint.status === 'in_progress' ? COLORS.marigoldDark : 
                                 complaint.status === 'resolved' ? COLORS.dairy : COLORS.inkSoft
                        }}>
                          {complaint.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>
                        Order: #{complaint.order_id?.slice(-6) || 'N/A'} · Customer: {complaint.customer_name}
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 12 }}>
                        {complaint.message}
                      </div>
                      {complaint.admin_notes && (
                        <div style={{ fontSize: 12, color: COLORS.inkSoft, fontStyle: 'italic', marginBottom: 8 }}>
                          Admin Notes: {complaint.admin_notes}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => handleComplaintResolve(complaint.id)}
                          style={{ background: COLORS.success, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Resolve
                        </button>
                        <button 
                          onClick={() => handleComplaintWarnPartner(complaint.id)}
                          style={{ background: COLORS.warning, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Warn Partner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          )}

          {/* Feedback Tab */}
          {activeTab === 'feedback' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
                Customer Feedback
              </h2>
              
              {feedback.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No feedback yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {feedback.map((item) => (
                    <div key={item.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                          Order #{item.order_id?.slice(-6) || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} style={{ color: star <= item.rating ? COLORS.marigold : '#E0E0E0' }}>★</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8 }}>
                        Customer: {item.customer_name}
                      </div>
                      {item.comment && (
                        <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 8 }}>
                          "{item.comment}"
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
                  Order Management
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value="all"
                    style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${COLORS.line}`, fontSize: 13 }}
                  >
                    <option value="all">All Orders</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
              
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No orders yet.</div>
              ) : (
                <VirtualOrderList
                  orders={orders}
                  renderOrder={(order, index, isHovered) => (
                    <div key={order.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, background: isHovered ? '#FAFAFA' : '#FFFFFF' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                          Order #{order.id?.slice(-6) || 'N/A'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: 12, 
                            fontWeight: 600, 
                            padding: '4px 12px', 
                            borderRadius: 12, 
                            background: 
                              order.status === 'delivered' ? COLORS.dairyLight :
                              order.status === 'pending' ? COLORS.marigoldLight :
                              order.status === 'cancelled' ? COLORS.dangerBg :
                              COLORS.card,
                            color: 
                              order.status === 'delivered' ? COLORS.dairy :
                              order.status === 'pending' ? COLORS.marigoldDark :
                              order.status === 'cancelled' ? COLORS.danger :
                              COLORS.inkSoft 
                          }}>
                            {order.status || 'Pending'}
                          </span>
                          <button
                            onClick={() => { setSelectedOrder(order); fetchOrderTracking(order.id); }}
                            style={{ background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: COLORS.inkSoft }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                        Total: ₹{order.total || '0'} · {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  )}
                  height={400}
                  itemSize={120}
                />
              )}
            </div>
          )}

          {/* Order Details Modal */}
          {selectedOrder && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>
                    Order #{selectedOrder.id?.slice(-6) || 'N/A'}
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Order Status Update */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 8, display: 'block' }}>
                    Update Status
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status)}
                        style={{
                          background: selectedOrder.status === status ? COLORS.primary : 'transparent',
                          color: selectedOrder.status === status ? '#fff' : COLORS.inkSoft,
                          border: `1px solid ${COLORS.line}`,
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assign Partner */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 8, display: 'block' }}>
                    Assign Partner
                  </label>
                  <select
                    onChange={(e) => assignOrderToPartner(selectedOrder.id, e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14 }}
                  >
                    <option value="">Select Partner</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} ({partner.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Order Tracking Timeline */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
                    Order Timeline
                  </h4>
                  {orderTracking.length === 0 ? (
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>No tracking information available</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {orderTracking.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: COLORS.primary,
                            marginTop: 4
                          }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                              {entry.status.replace('_', ' ').toUpperCase()}
                            </div>
                            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                            {entry.notes && (
                              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
                                {entry.notes}
                              </div>
                            )}
                            <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
                              Updated by: {entry.changed_by}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
                    Order Details
                  </h4>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                    <div>Total: ₹{selectedOrder.total || '0'}</div>
                    <div>Created: {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString() : 'N/A'}</div>
                    {selectedOrder.notes && <div>Notes: {selectedOrder.notes}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === 'partners' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
                  Partner Management
                </h2>
                <button 
                  onClick={() => setShowAddPartnerModal(true)}
                  style={{ background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <Plus size={16} /> Add Partner
                </button>
              </div>
              {partners.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No partners yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {partners.map((partner) => (
                    <div key={partner.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>{partner.name || 'Partner'}</div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{partner.phone || 'N/A'}</div>
                        {partner.email && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{partner.email}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: COLORS.inkSoft }}>
                          Edit
                        </button>
                        <button
                          onClick={() => openWhatsAppPartnerSupport(partner.id, 'Admin support needed')}
                          style={{ background: '#25D366', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <MessageCircle size={11} /> WhatsApp
                        </button>
                        <button style={{ background: 'none', border: `1px solid ${COLORS.danger}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: COLORS.danger }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Complaints Tab */}
          {activeTab === 'complaints' && (
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
                Complaint Management
              </h2>
              {complaints.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No complaints yet.</div>
              ) : (
                <div style={{ display: 'grid', gap: 16 }}>
                  {complaints.map((complaint) => (
                    <div key={complaint.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Complaint #{complaint.id?.slice(-6) || 'N/A'}</div>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 12, background: COLORS.dangerBg, color: COLORS.danger }}>
                          {complaint.status || 'Open'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{complaint.message || 'No message'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Partner Dashboard
  if (isPartner) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "Manrope, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Partner Header */}
          <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, marginBottom: 24, border: `1px solid ${COLORS.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, marginBottom: 4 }}>
                Partner Portal
              </h1>
              <p style={{ color: COLORS.inkSoft, fontSize: 13 }}>
                Partner ID: {partnerCredentials.partnerId} · Category: {partnerCategory.charAt(0).toUpperCase() + partnerCategory.slice(1)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => openWhatsAppPartnerSupport(partnerCredentials.partnerId, 'Partner support needed')}
                style={{ background: '#25D366', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MessageCircle size={14} /> WhatsApp Support
              </button>
              <button
                onClick={() => { 
                  localStorage.removeItem('dailybloom_partner_token');
                  localStorage.removeItem('dailybloom_partner_user');
                  setIsPartner(false); 
                  setLoginType(null); 
                }}
                style={{ background: 'transparent', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', color: COLORS.danger, fontSize: 13, fontWeight: 600 }}
              >
                Logout
              </button>
            </div>
          </div>

          {/* Partner Stock Communications */}
          <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}`, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink }}>
                Stock Communications
              </h2>
              <button 
                onClick={() => {/* Open stock notification form */}}
                style={{ background: COLORS.secondary, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Plus size={16} /> Send Stock Request
              </button>
            </div>

            {partnerStockNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No stock communications yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {partnerStockNotifications.map((notification) => (
                  <div key={notification.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                        {notification.type}
                      </div>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        padding: '4px 12px', 
                        borderRadius: 12, 
                        background: notification.status === 'pending' ? COLORS.dangerBg : COLORS.dairyLight, 
                        color: notification.status === 'pending' ? COLORS.danger : COLORS.dairy 
                      }}>
                        {notification.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 8 }}>
                      {notification.message}
                    </div>
                    {notification.admin_response && (
                      <div style={{ fontSize: 13, color: COLORS.inkSoft, fontStyle: 'italic' }}>
                        Admin: {notification.admin_response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partner Orders */}
          <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, border: `1px solid ${COLORS.line}` }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
              Your Orders
            </h2>
            {partnerOrders.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No orders assigned to you yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {partnerOrders.map((order) => (
                  <div key={order.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Order #{order.id?.slice(-6) || 'N/A'}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 600, 
                          padding: '4px 12px', 
                          borderRadius: 12, 
                          background: 
                            order.status === 'delivered' ? COLORS.dairyLight :
                            order.status === 'pending' ? COLORS.marigoldLight :
                            order.status === 'cancelled' ? COLORS.dangerBg :
                            COLORS.card,
                          color: 
                            order.status === 'delivered' ? COLORS.dairy :
                            order.status === 'pending' ? COLORS.marigoldDark :
                            order.status === 'cancelled' ? COLORS.danger :
                            COLORS.inkSoft 
                        }}>
                          {order.status || 'Pending'}
                        </span>
                        <button
                          onClick={() => { setSelectedPartnerOrder(order); fetchPartnerOrderTracking(order.id); }}
                          style={{ background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: COLORS.inkSoft }}
                        >
                          Track
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>Total: ₹{order.total || '0'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partner Order Tracking Modal */}
          {selectedPartnerOrder && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, maxWidth: 600, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>
                    Order #{selectedPartnerOrder.id?.slice(-6) || 'N/A'}
                  </h3>
                  <button
                    onClick={() => setSelectedPartnerOrder(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Update Order Status */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 8, display: 'block' }}>
                    Update Status
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updatePartnerOrderStatus(selectedPartnerOrder.id, status)}
                        style={{
                          background: selectedPartnerOrder.status === status ? COLORS.secondary : 'transparent',
                          color: selectedPartnerOrder.status === status ? '#fff' : COLORS.inkSoft,
                          border: `1px solid ${COLORS.line}`,
                          borderRadius: 6,
                          padding: '6px 12px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Location */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 8, display: 'block' }}>
                    Current Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your current location"
                    onBlur={(e) => updatePartnerOrderStatus(selectedPartnerOrder.id, selectedPartnerOrder.status, 'Location updated', e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14 }}
                  />
                </div>

                {/* Order Tracking Timeline */}
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
                    Delivery Timeline
                  </h4>
                  {partnerOrderTracking.length === 0 ? (
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>No tracking information available</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {partnerOrderTracking.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: COLORS.secondary,
                            marginTop: 4
                          }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                              {entry.status.replace('_', ' ').toUpperCase()}
                            </div>
                            <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                            {entry.notes && (
                              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 4 }}>
                                {entry.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
                    Order Details
                  </h4>
                  <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                    <div>Total: ₹{selectedPartnerOrder.total || '0'}</div>
                    <div>Created: {selectedPartnerOrder.created_at ? new Date(selectedPartnerOrder.created_at).toLocaleString() : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Partner Modal */}
          {showAddPartnerModal && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              background: 'rgba(0,0,0,0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontFamily: "Fraunces, serif", fontSize: 18, fontWeight: 700, color: COLORS.ink }}>
                    Add New Partner
                  </h3>
                  <button
                    onClick={() => setShowAddPartnerModal(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleAddPartner(); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Partner Name</label>
                    <input 
                      type="text" 
                      required
                      value={newPartnerForm.name}
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                      placeholder="Enter partner name"
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      value={newPartnerForm.phone}
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Email (Optional)</label>
                    <input 
                      type="email" 
                      value={newPartnerForm.email}
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, email: e.target.value })}
                      placeholder="Enter email address"
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Category</label>
                    <select 
                      required
                      value={newPartnerForm.category}
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, category: e.target.value })}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13 }}
                    >
                      <option value="">Select category</option>
                      <option value="dairy">Dairy</option>
                      <option value="bakery">Bakery</option>
                      <option value="honey">Organic Essentials</option>
                      <option value="flowers">Flowers</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: 'block', marginBottom: 4 }}>Address</label>
                    <textarea 
                      required
                      value={newPartnerForm.address}
                      onChange={(e) => setNewPartnerForm({ ...newPartnerForm, address: e.target.value })}
                      placeholder="Enter partner address"
                      rows={3}
                      style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button 
                      type="button"
                      onClick={() => setShowAddPartnerModal(false)}
                      style={{ flex: 1, background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      style={{ flex: 1, background: COLORS.marigold, border: 'none', borderRadius: 8, padding: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Add Partner
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }
}