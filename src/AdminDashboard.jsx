import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Lock, Package, IndianRupee, Clock, MapPin, Phone, Mail, ChevronDown, ChevronUp, Calendar, AlertTriangle, XCircle, Plus, Users, Building2, Store, TrendingUp, Shield, Edit, Trash2, MessageCircle, Send } from 'lucide-react';
import * as Sentry from '@sentry/react';

const API_BASE = 'http://localhost:4000/api';
const DAILYBLOOM_WHATSAPP_BUSINESS = '919910217309';

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

// Initialize Sentry for error tracking
Sentry.init({
  dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0', // Replace with your actual Sentry DSN
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});

const COLORS = {
  bg: '#F6F7F2',
  ink: '#16301F',
  inkSoft: '#3E5245',
  marigold: '#E8A33D',
  marigoldDark: '#B87A1F',
  card: '#FFFFFF',
  line: '#E4E3D8',
  danger: '#C65D7B',
  dairy: '#4C7A5E',
};

const STATUS_FLOW = ['pending', 'approved', 'out_for_delivery', 'delivered_unverified', 'fulfilled'];
const STATUS_LABELS = {
  pending: 'Pending Approval',
  approved: 'Approved',
  out_for_delivery: 'Out for Delivery',
  delivered_unverified: 'Delivered (Unverified)',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

// Helper function to format date with day name
function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[date.getDay()];
  const datePart = dateStr.slice(0, 10);
  return `${dayName}, ${datePart}`;
}

function useFonts() {
  useEffect(() => {
    const id = 'dailybloom-admin-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Manrope:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

export default function AdminDashboard() {
  useFonts();
  const [adminKey, setAdminKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [localitySummary, setLocalitySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedMaps, setExpandedMaps] = useState({});
  const [outOfStockItems, setOutOfStockItems] = useState({}); // Track out of stock items per order
  const [refunds, setRefunds] = useState([]); // Track refund requests
  
  // Partner Management State
  const [activeTab, setActiveTab] = useState('orders'); // orders, partners, inventory, complaints
  const [partners, setPartners] = useState([]);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ name: '', phone: '', email: '', address: '', category: '' });
  const [partnerInventory, setPartnerInventory] = useState({});
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  
  // Complaint Management State
  const [complaints, setComplaints] = useState([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [escalationForm, setEscalationForm] = useState({ partner_id: '', severity: 'warning', reason: '' });

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-key': localStorage.getItem('dailybloom_admin_key') || adminKey,
  }), [adminKey]);

const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);
    console.log("Sending headers:", headers());
    
    try {
      const results = await Promise.allSettled([
        fetch(`${API_BASE}/admin/orders`, { headers: headers() }),
        fetch(`${API_BASE}/admin/stats`, { headers: headers() }),
        fetch(`${API_BASE}/admin/locality-summary`, { headers: headers() }),
        fetch(`${API_BASE}/refunds/admin/all`, { headers: headers() }),
        fetch(`${API_BASE}/admin/partners`, { headers: headers() }),
        fetch(`${API_BASE}/admin/complaints`, { headers: headers() }),
      ]);

      const [ordersResult, statsResult, localityResult, refundsResult, partnersResult, complaintsResult] = results;

      const parseResponse = async (result, label) => {
        if (result.status === 'rejected') {
          console.warn(`Network error fetching ${label}:`, result.reason);
          return null;
        }

        const res = result.value;

        if (res.status === 401) {
          setAuthed(false);
          setAuthError('Admin key rejected — check it matches your .env file.');
          throw new Error('UNAUTHORIZED');
        }

        if (!res.ok) {
          console.warn(`Failed to load ${label} (Status: ${res.status})`);
          return null;
        }

        return await res.json();
      };

      const ordersData = await parseResponse(ordersResult, 'orders');
      const statsData = await parseResponse(statsResult, 'stats');
      const localityData = await parseResponse(localityResult, 'locality summary');
      const refundsData = await parseResponse(refundsResult, 'refunds');
      const partnersData = await parseResponse(partnersResult, 'partners');
      const complaintsData = await parseResponse(complaintsResult, 'complaints');

      if (ordersData !== null) setOrders(ordersData);
      if (statsData !== null) setStats(statsData);
      if (localityData !== null) setLocalitySummary(localityData);
      if (refundsData !== null) setRefunds(refundsData);
      if (partnersData !== null) setPartners(partnersData);
      if (complaintsData !== null) setComplaints(complaintsData);

    } catch (e) {
      if (e.message !== 'UNAUTHORIZED') {
        setError('Some dashboard components failed to load fully. Check your backend connection.');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (!authed) return;
    fetchData(true); // Initial load with loading indicator
    const interval = setInterval(() => fetchData(false), 8000); // Silent background refresh
    return () => clearInterval(interval);
  }, [authed, fetchData]);

  const tryLogin = () => {
    const inputElement = document.getElementById('admin-key-input');
    const key = inputElement ? inputElement.value : adminKey;
    if (!key || key.trim() === '') {
      setAuthError('Please enter an admin key');
      return;
    }
    const cleanKey = key.trim();
    localStorage.setItem('dailybloom_admin_key', cleanKey);
    setAdminKey(cleanKey);
    setAuthError(null);
    setAuthed(true);
  };

  const advanceStatus = async (order) => {
    const idx = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return;
    await updateStatus(order.id, next);
  };

  const cancelOrder = async (order) => {
    await updateStatus(order.id, 'cancelled');
  };

  const updateStatus = async (orderId, newStatus) => {
    const previousOrders = [...orders];

    // Optimistically update UI immediately for snappy response
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: data.status } : o));
    } catch (e) {
      // Revert if network or server errors out
      setOrders(previousOrders);
      setError(`Failed to update order status: ${e.message}`);
    }
  };

  const toggleMap = (orderId) => {
    setExpandedMaps((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const markItemOutOfStock = async (orderId, productId) => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify({ out_of_stock: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');
      
      setOutOfStockItems((prev) => ({
        ...prev,
        [orderId]: { ...(prev[orderId] || {}), [productId]: true }
      }));
      
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const markItemInStock = async (orderId, productId) => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify({ out_of_stock: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update stock');
      
      setOutOfStockItems((prev) => {
        const orderItems = { ...prev[orderId] };
        delete orderItems[productId];
        return { ...prev, [orderId]: orderItems };
      });
      
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const approveRefund = async (refundId) => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/refunds/admin/${refundId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve refund');
      
      const refundsRes = await fetch(`${API_BASE}/refunds/admin/all`, { 
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        }
      });
      const refundsData = await refundsRes.json();
      setRefunds(refundsData);
      
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const rejectRefund = async (refundId, reason = '') => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/refunds/admin/${refundId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify({ rejection_reason: reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject refund');
      
      const refundsRes = await fetch(`${API_BASE}/refunds/admin/all`, { 
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        }
      });
      const refundsData = await refundsRes.json();
      setRefunds(refundsData);
      
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  // Partner Management Functions
  const addPartner = async () => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify(partnerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add partner');
      
      setPartners([...partners, data]);
      setShowPartnerModal(false);
      setPartnerForm({ name: '', phone: '', email: '', address: '', category: '' });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const updatePartner = async (partnerId) => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify(partnerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update partner');
      
      setPartners(partners.map(p => p.id === partnerId ? { ...p, ...data } : p));
      setShowPartnerModal(false);
      setPartnerForm({ name: '', phone: '', email: '', address: '', category: '' });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handlePartnerSubmit = async () => {
    if (editingPartnerId) {
      await updatePartner(editingPartnerId);
      setEditingPartnerId(null);
    } else {
      await addPartner();
    }
  };

  // Complaint Management Functions
  const escalateComplaint = async (complaintId) => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify(escalationForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to escalate complaint');
      
      // Refresh complaints and partners
      const complaintsRes = await fetch(`${API_BASE}/admin/complaints`, { 
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        }
      });
      const complaintsData = await complaintsRes.json();
      setComplaints(complaintsData);
      
      const partnersRes = await fetch(`${API_BASE}/admin/partners`, { 
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        }
      });
      const partnersData = await partnersRes.json();
      setPartners(partnersData);
      
      setShowComplaintModal(false);
      setSelectedComplaint(null);
      setEscalationForm({ partner_id: '', severity: 'warning', reason: '' });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const resolveComplaintDirectly = async (complaintId) => {
    const resolution = prompt('Enter resolution notes:');
    if (!resolution) return;
    
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify({ admin_notes: resolution }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resolve complaint');
      
      const complaintsRes = await fetch(`${API_BASE}/admin/complaints`, { 
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        }
      });
      const complaintsData = await complaintsRes.json();
      setComplaints(complaintsData);
      
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const deletePartner = async (partnerId) => {
    if (!confirm('Are you sure you want to remove this partner?')) return;
    
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
      });
      if (!res.ok) throw new Error('Failed to delete partner');
      
      setPartners(partners.filter(p => p.id !== partnerId));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const assignOrderToPartner = async (orderId, partnerId) => {
    try {
      const currentAdminKey = localStorage.getItem('dailybloom_admin_key') || adminKey;
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': currentAdminKey,
        },
        body: JSON.stringify({ partner_id: partnerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign order');
      
      setOrders(orders.map(o => o.id === orderId ? { ...o, partner_id: partnerId } : o));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  function OrderMap({ latitude, longitude, recipientName }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
      if (!mapRef.current || !latitude || !longitude) return;
      if (typeof window === 'undefined' || !window.L) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = window.L.map(mapRef.current).setView([latitude, longitude], 15);
      mapInstanceRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = window.L.marker([latitude, longitude]).addTo(map);
      marker.bindPopup(`<b>${recipientName || 'Delivery Location'}</b><br>${latitude.toFixed(6)}, ${longitude.toFixed(6)}`).openPopup();

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }, [latitude, longitude, recipientName]);

    return <div ref={mapRef} style={{ width: '100%', height: 250, borderRadius: 8, marginTop: 12 }} />;
  }

  const page = {
    minHeight: '100vh', background: COLORS.bg, fontFamily: "'Manrope', sans-serif",
    padding: '32px 20px', boxSizing: 'border-box',
  };

  if (!authed) {
    return (
      <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: COLORS.card, borderRadius: 16, padding: 32, width: 340, border: `1px solid ${COLORS.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Lock size={18} color={COLORS.ink} />
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: COLORS.ink }}>Admin access</span>
          </div>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, marginBottom: 18 }}>Enter your ADMIN_KEY (from your backend .env file).</div>
          <input
            id="admin-key-input"
            name="adminKey"
            type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin key" onKeyDown={(e) => e.key === 'Enter' && tryLogin()}
            style={{ width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 9, border: `1.5px solid ${COLORS.line}`, fontSize: 14, marginBottom: 12, fontFamily: 'inherit' }}
          />
          {authError && <div style={{ color: COLORS.danger, fontSize: 12.5, marginBottom: 12 }}>{authError}</div>}
          <button
            onClick={tryLogin}
            style={{ width: '100%', padding: 12, borderRadius: 9, border: 'none', background: COLORS.marigold, color: COLORS.ink, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Verifying...' : 'Enter dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: COLORS.ink }}>DailyBloom — Admin</div>
          <button onClick={fetchData} style={{ background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12.5, color: COLORS.inkSoft }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: '#FDEDE4', color: '#7A3418', fontSize: 12.5, padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{error}</div>
        )}

        {stats && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
            <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>TODAY'S ORDERS</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.ink, lineHeight: 1 }}>{stats.todayOrders}</div>
            </div>
            <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>TODAY'S REVENUE</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.ink, lineHeight: 1 }}>₹{parseFloat(stats.todayRevenue).toFixed(0)}</div>
            </div>
            <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>PENDING ACTION</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.marigoldDark, lineHeight: 1 }}>{stats.pendingOrders}</div>
            </div>
          </div>
        )}

        {localitySummary && localitySummary.length > 0 && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20, marginBottom: 26, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color={COLORS.marigoldDark} /> Today's Sales by Locality
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {localitySummary.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: index % 2 === 0 ? 'transparent' : COLORS.bg, borderRadius: 10, border: index % 2 === 0 ? 'none' : `1px solid ${COLORS.line}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{item.locality}</div>
                    <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>{item.orders_count} orders · {item.unique_customers} customers</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.marigoldDark }}>₹{parseFloat(item.revenue).toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: `1px solid ${COLORS.line}`, paddingBottom: 16 }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'orders' ? COLORS.marigold : 'transparent',
              color: activeTab === 'orders' ? COLORS.ink : COLORS.inkSoft,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'partners' ? COLORS.marigold : 'transparent',
              color: activeTab === 'partners' ? COLORS.ink : COLORS.inkSoft,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Partners
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'complaints' ? COLORS.marigold : 'transparent',
              color: activeTab === 'complaints' ? COLORS.ink : COLORS.inkSoft,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Complaints
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === 'inventory' ? COLORS.marigold : 'transparent',
              color: activeTab === 'inventory' ? COLORS.ink : COLORS.inkSoft,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Inventory
          </button>
        </div>

        {refunds && refunds.length > 0 && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20, marginBottom: 26, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={16} color={COLORS.marigoldDark} /> Refund Requests
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {refunds.map((refund) => (
                <div key={refund.id} style={{ padding: '12px 14px', background: refund.status === 'pending' ? '#FCEFDB' : refund.status === 'approved' ? '#EDF7F2' : '#FDEDE4', borderRadius: 10, border: `1px solid ${refund.status === 'pending' ? COLORS.marigold : refund.status === 'approved' ? COLORS.dairy : COLORS.danger}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                      {refund.customer_name} · {refund.customer_phone}
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: refund.status === 'pending' ? COLORS.marigoldDark : refund.status === 'approved' ? COLORS.dairy : COLORS.danger, background: refund.status === 'pending' ? '#FCEFDB' : refund.status === 'approved' ? '#EDF7F2' : '#FDEDE4' }}>
                      {refund.status.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                    Order ID: {refund.order_id} · Amount: ₹{parseFloat(refund.amount).toFixed(0)}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 8 }}>
                    Reason: {refund.reason}
                  </div>
                  {refund.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => approveRefund(refund.id)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: COLORS.dairy, color: COLORS.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) rejectRefund(refund.id, reason);
                        }}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.danger}`, background: 'white', color: COLORS.danger, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {refund.status === 'rejected' && refund.rejection_reason && (
                    <div style={{ fontSize: 11, color: COLORS.danger, marginTop: 4 }}>
                      Rejection: {refund.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
            {loading && orders.length === 0 && <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>Loading orders…</div>}

            {orders.map((o) => (
          <div key={o.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: 20, marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.ink, marginBottom: 4 }}>{o.customer_name || 'Customer'}</div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft, display: 'flex', gap: 12, marginTop: 2 }}>
                  {o.customer_phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{o.customer_phone}</span>}
                  {o.customer_email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{o.customer_email}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
                  background: o.status === 'cancelled' ? '#FDEDE4' : o.status === 'delivered' ? '#E4F0E8' : '#FCEFDB',
                  color: o.status === 'cancelled' ? COLORS.danger : o.status === 'delivered' ? COLORS.dairy : COLORS.marigoldDark,
                }}>{STATUS_LABELS[o.status]}</span>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
                  background: o.payment_status === 'paid' ? '#E4F0E8' : o.payment_status === 'failed' ? '#FDEDE4' : '#F0EFE9',
                  color: o.payment_status === 'paid' ? COLORS.dairy : o.payment_status === 'failed' ? COLORS.danger : COLORS.inkSoft,
                }}>
                  {o.payment_status === 'paid' ? '✓ Paid' : o.payment_status === 'failed' ? '✕ Failed' : '⏳ Pending'}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} /> {o.recipient_name ? `${o.recipient_name} — ` : ''}{o.line1}, {o.city} {o.pincode}
              {o.locality && <span style={{ color: COLORS.marigoldDark, fontWeight: 600, fontSize: 11.5 }}>· {o.locality}</span>}
              {o.latitude && o.longitude && (
                <>
                  <button
                    onClick={() => toggleMap(o.id)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: COLORS.marigoldDark, 
                      fontSize: 11.5, 
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 8,
                      padding: 0
                    }}
                  >
                    {expandedMaps[o.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedMaps[o.id] ? 'Hide map' : 'Show map'}
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: 11.5, 
                      color: COLORS.marigoldDark, 
                      textDecoration: 'none', 
                      fontWeight: 600,
                      marginLeft: 4 
                    }}
                  >
                    Google Maps →
                  </a>
                </>
              )}
            </div>
            {expandedMaps[o.id] && o.latitude && o.longitude && (
              <OrderMap latitude={parseFloat(o.latitude)} longitude={parseFloat(o.longitude)} recipientName={o.recipient_name} />
            )}
            {o.delivery_instructions && (
              <div style={{ fontSize: 12.5, color: COLORS.marigoldDark, marginBottom: 8, background: '#FCEFDB', padding: '6px 10px', borderRadius: 8 }}>
                📝 {o.delivery_instructions}
              </div>
            )}
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} /> {formatDateTime(o.delivery_date)} · {o.delivery_slot || 'any time'}
            </div>
            <div style={{ fontSize: 13, color: COLORS.ink, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={13} /> {(o.items || []).map((it) => `${it.product_name} × ${it.quantity}`).join(', ')}
            </div>

            {/* Out of Stock Items Section */}
            {o.status !== 'delivered' && o.status !== 'cancelled' && (o.items || []).length > 0 && (
              <div style={{ marginBottom: 12, padding: '12px 14px', background: '#FCEFDB', borderRadius: 10, border: '1px solid #E8A33D' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.marigoldDark, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} /> Mark Items Out of Stock
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(o.items || []).map((it) => (
                    <div key={it.product_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: COLORS.ink }}>{it.product_name} × {it.quantity}</span>
                      <button
                        onClick={() => {
                          const isOutOfStock = outOfStockItems[o.id]?.[it.product_id];
                          if (isOutOfStock) {
                            markItemInStock(o.id, it.product_id);
                          } else {
                            markItemOutOfStock(o.id, it.product_id);
                          }
                        }}
                        style={{
                          background: outOfStockItems[o.id]?.[it.product_id] ? '#E4F0E8' : '#FDEDE4',
                          border: `1px solid ${outOfStockItems[o.id]?.[it.product_id] ? COLORS.dairy : COLORS.danger}`,
                          color: outOfStockItems[o.id]?.[it.product_id] ? COLORS.dairy : COLORS.danger,
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.2s'
                        }}
                      >
                        {outOfStockItems[o.id]?.[it.product_id] ? (
                          <>
                            <span style={{ fontSize: 10 }}>✓</span> In Stock
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Out of Stock
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.ink, display: 'flex', alignItems: 'center' }}>
                <IndianRupee size={16} />{parseFloat(o.total).toFixed(0)}
              </div>
              {o.status !== 'delivered' && o.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => cancelOrder(o)} style={{ background: 'none', border: `1.5px solid ${COLORS.line}`, color: COLORS.danger, borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Cancel</button>
                  <button onClick={() => advanceStatus(o)} style={{ background: COLORS.ink, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    Mark {STATUS_LABELS[STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1]]}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {!loading && orders.length === 0 && (
          <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No orders yet.</div>
        )}
          </>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={16} color={COLORS.marigoldDark} /> Partner Management
              </div>
              <button
                onClick={() => {
                  setShowPartnerModal(true);
                  setPartnerForm({ name: '', phone: '', email: '', address: '', category: '' });
                  setEditingPartnerId(null);
                }}
                style={{ background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={14} /> Add Partner
              </button>
            </div>

            {partners.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No partners added yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {partners.map((partner) => (
                  <div key={partner.id} style={{ padding: '14px 16px', background: COLORS.bg, borderRadius: 10, border: `1px solid ${COLORS.line}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>{partner.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.inkSoft, display: 'flex', gap: 12 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{partner.phone}</span>
                          {partner.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{partner.email}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            setPartnerForm({ name: partner.name, phone: partner.phone, email: partner.email || '', address: partner.address || '', category: partner.category || '' });
                            setEditingPartnerId(partner.id);
                            setShowPartnerModal(true);
                          }}
                          style={{ background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: COLORS.inkSoft }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openWhatsAppPartnerSupport(partner.id, 'Admin support needed')}
                          style={{ background: '#25D366', border: 'none', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <MessageCircle size={11} /> WhatsApp
                        </button>
                        <button
                          onClick={() => deletePartner(partner.id)}
                          style={{ background: 'none', border: `1px solid ${COLORS.danger}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: COLORS.danger }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {partner.address && (
                      <div style={{ fontSize: 12, color: COLORS.inkSoft, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {partner.address}
                      </div>
                    )}
                    {partner.category && (
                      <div style={{ fontSize: 11, color: COLORS.marigoldDark, fontWeight: 600, marginTop: 4 }}>
                        Category: {partner.category}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} color={COLORS.marigoldDark} /> Complaint Management
            </div>
            
            {complaints.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>No complaints received yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {complaints.map((complaint) => (
                  <div key={complaint.id} style={{ padding: '14px 16px', background: complaint.status === 'pending' ? '#FCEFDB' : complaint.status === 'resolved' ? '#E4F0E8' : '#FDEDE4', borderRadius: 10, border: `1px solid ${complaint.status === 'pending' ? COLORS.marigold : complaint.status === 'resolved' ? COLORS.dairy : COLORS.danger}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink }}>
                          {complaint.customer_name} · {complaint.customer_phone}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 2 }}>
                          Order #{complaint.order_id} · {complaint.type === 'write' ? 'Written' : 'Call Request'}
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: complaint.status === 'pending' ? COLORS.marigoldDark : complaint.status === 'resolved' ? COLORS.dairy : COLORS.danger, background: complaint.status === 'pending' ? '#FCEFDB' : complaint.status === 'resolved' ? '#E4F0E8' : '#FDEDE4' }}>
                        {complaint.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 6 }}>
                      <strong>Subject:</strong> {complaint.subject}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 8 }}>
                      <strong>Message:</strong> {complaint.message}
                    </div>
                    
                    {complaint.partner_name && (
                      <div style={{ fontSize: 11, color: COLORS.marigoldDark, fontWeight: 600, marginBottom: 8 }}>
                        Assigned Partner: {complaint.partner_name} (Strikes: {complaint.partner_strikes || 0}/5)
                      </div>
                    )}
                    
                    {complaint.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setEscalationForm({ partner_id: complaint.partner_id || '', severity: 'warning', reason: complaint.subject });
                            setShowComplaintModal(true);
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', background: COLORS.marigold, color: COLORS.ink, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Escalate to Partner
                        </button>
                        <button
                          onClick={() => resolveComplaintDirectly(complaint.id)}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${COLORS.dairy}`, background: 'white', color: COLORS.dairy, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Resolve Directly
                        </button>
                      </div>
                    )}
                    
                    {complaint.admin_notes && (
                      <div style={{ fontSize: 11, color: COLORS.inkSoft, marginTop: 4, fontStyle: 'italic' }}>
                        Admin Notes: {complaint.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Package size={16} color={COLORS.marigoldDark} /> Inventory Management
            </div>
            <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>
              Inventory management coming soon. This will allow you to track product availability across partners.
            </div>
          </div>
        )}

        {/* Partner Modal */}
        {showPartnerModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: 400, maxWidth: '90%', border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>
                {editingPartnerId ? 'Edit Partner' : 'Add New Partner'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Partner Name *</label>
                  <input
                    type="text"
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                    placeholder="Enter partner name"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Phone Number *</label>
                  <input
                    type="tel"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Email</label>
                  <input
                    type="email"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                    placeholder="Enter email (optional)"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Address</label>
                  <input
                    type="text"
                    value={partnerForm.address}
                    onChange={(e) => setPartnerForm({ ...partnerForm, address: e.target.value })}
                    placeholder="Enter address (optional)"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Category</label>
                  <select
                    value={partnerForm.category}
                    onChange={(e) => setPartnerForm({ ...partnerForm, category: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  >
                    <option value="">Select category (optional)</option>
                    <option value="dairy">Dairy</option>
                    <option value="bakery">Bakery</option>
                    <option value="honey">Honey & Jaggery</option>
                    <option value="flowers">Fresh Flowers</option>
                    <option value="delivery">Delivery Partner</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => setShowPartnerModal(false)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: 'white', color: COLORS.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePartnerSubmit}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: COLORS.marigold, color: COLORS.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {editingPartnerId ? 'Update Partner' : 'Add Partner'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Escalation Modal */}
        {showComplaintModal && selectedComplaint && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: 450, maxWidth: '90%', border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink, marginBottom: 16 }}>
                Escalate Complaint to Partner
              </div>
              <div style={{ marginBottom: 16, padding: 12, background: '#FCEFDB', borderRadius: 8, fontSize: 12, color: COLORS.inkSoft }}>
                <div><strong>Customer:</strong> {selectedComplaint.customer_name}</div>
                <div><strong>Subject:</strong> {selectedComplaint.subject}</div>
                <div><strong>Message:</strong> {selectedComplaint.message}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Select Partner *</label>
                  <select
                    value={escalationForm.partner_id}
                    onChange={(e) => setEscalationForm({ ...escalationForm, partner_id: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  >
                    <option value="">Select a partner</option>
                    {partners.filter(p => p.is_active !== false).map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} {partner.total_strikes > 0 ? `(Strikes: ${partner.total_strikes}/5)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Severity Level</label>
                  <select
                    value={escalationForm.severity}
                    onChange={(e) => setEscalationForm({ ...escalationForm, severity: e.target.value })}
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  >
                    <option value="warning">Warning (1 strike)</option>
                    <option value="strike">Strike (2 strikes)</option>
                    <option value="critical">Critical (3 strikes)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink, marginBottom: 4, display: 'block' }}>Reason for Escalation</label>
                  <input
                    type="text"
                    value={escalationForm.reason}
                    onChange={(e) => setEscalationForm({ ...escalationForm, reason: e.target.value })}
                    placeholder="Enter reason for escalation"
                    style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, fontSize: 14, fontFamily: 'inherit' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => {
                    setShowComplaintModal(false);
                    setSelectedComplaint(null);
                    setEscalationForm({ partner_id: '', severity: 'warning', reason: '' });
                  }}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.line}`, background: 'white', color: COLORS.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => escalateComplaint(selectedComplaint.id)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: COLORS.marigold, color: COLORS.ink, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Escalate & Add Strike
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}