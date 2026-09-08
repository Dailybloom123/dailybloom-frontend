import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, IndianRupee, Clock, MapPin, Phone, Mail, CheckCircle, XCircle, LogOut, User, AlertTriangle, Navigation, Check, Activity, Send, MessageCircle } from 'lucide-react';
import analytics from './analytics-light.js';
import VirtualOrderList from './components/VirtualOrderList.jsx';

const API_BASE = 'http://localhost:4000/api';
const DAILYBLOOM_WHATSAPP_BUSINESS = '919910217309';

// WhatsApp Business Functions
const openWhatsAppChat = (message, phoneNumber = DAILYBLOOM_WHATSAPP_BUSINESS) => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

const openWhatsAppSupport = (orderId, issue) => {
  const message = `🆘 *Partner Support - DailyBloom* 🆘\n\n` +
    `*Order ID:* ${orderId}\n` +
    `*Issue:* ${issue}\n\n` +
    `Please help me resolve this issue. Thank you!`;
  
  openWhatsAppChat(message);
};

const COLORS = {
  bg: '#F8F9F5',
  ink: '#1A2E23',
  inkSoft: '#4A5D52',
  marigold: '#F0B429',
  marigoldDark: '#D4941A',
  card: '#FFFFFF',
  line: '#E8EFE8',
  danger: '#E85D75',
  dairy: '#5A8A6E',
  success: '#4CAF50',
};

const ORDER_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  FULFILLED: 'fulfilled',
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

export default function PartnerPortal() {
  const [partnerId, setPartnerId] = useState('');
  const [category, setCategory] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'assigned'
  
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Live tracking state
  const [trackingEnabled, setTrackingEnabled] = useState({});
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [trackingInterval, setTrackingInterval] = useState(null);
  const [showTrackingMap, setShowTrackingMap] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-partner-key': localStorage.getItem('dailybloom_partner_key') || partnerId,
    'x-partner-category': localStorage.getItem('dailybloom_partner_category') || category,
  }), [partnerId, category]);

  const fetchPartnerOrders = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/partner/orders`, { headers: headers() });
      if (res.status === 401) {
        setAuthed(false);
        setAuthError('Partner key rejected');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authed, headers]);

  const fetchAvailableOrders = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/partner/available-orders`, { headers: headers() });
      if (res.status === 401) {
        setAuthed(false);
        setAuthError('Partner key rejected');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch available orders');
      const data = await res.json();
      setAvailableOrders(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [authed, headers]);

  const acceptOrder = async (orderId) => {
    try {
      setSuccessMsg(null);
      const res = await fetch(`${API_BASE}/partner/accept-order/${orderId}`, {
        method: 'POST',
        headers: headers()
      });
      
      if (res.status === 409) {
        const data = await res.json();
        setSuccessMsg(data.error || 'Order was accepted by another partner');
        // Refresh available orders
        fetchAvailableOrders();
        return;
      }
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to accept order');
      }
      
      const data = await res.json();
      setSuccessMsg('Order accepted successfully!');
      
      // Refresh both available and assigned orders
      fetchAvailableOrders();
      fetchPartnerOrders();
      
      // Switch to assigned orders tab
      setActiveTab('assigned');
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    if (authed) {
      fetchPartnerOrders();
      fetchAvailableOrders();
      // Reduced polling from 10 seconds to 30 seconds to reduce server load
      const interval = setInterval(() => {
        fetchPartnerOrders();
        fetchAvailableOrders();
      }, 30000); // Changed from 10000 to 30000
      return () => clearInterval(interval);
    }
  }, [authed, fetchPartnerOrders, fetchAvailableOrders]);

  const handleLogin = () => {
    const key = partnerId.trim();
    const selectedCategory = category.trim();
    
    if (!key) {
      setAuthError('Please enter your partner ID');
      return;
    }
    if (!selectedCategory) {
      setAuthError('Please select your category');
      return;
    }
    
    setPartnerId(key);
    setCategory(selectedCategory);
    localStorage.setItem('dailybloom_partner_key', key);
    localStorage.setItem('dailybloom_partner_category', selectedCategory);
    setAuthed(true);
    setAuthError(null);
    
    // Track partner login
    analytics.trackEvent('login', { method: 'partner_code', portal: 'partner', category: selectedCategory });
  };

  const handleLogout = () => {
    setAuthed(false);
    setPartnerId('');
    setCategory('');
    localStorage.removeItem('dailybloom_partner_key');
    localStorage.removeItem('dailybloom_partner_category');
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/partner/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      setSuccessMsg(`Order status updated to ${STATUS_LABELS[newStatus]}`);
      fetchPartnerOrders();
    } catch (e) {
      setError(e.message);
    }
  };

  // Live tracking functions
  const startTracking = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/tracking/start`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ 
          order_id: orderId, 
          partner_id: partnerId 
        }),
      });
      if (!res.ok) throw new Error('Failed to start tracking');
      
      setTrackingEnabled(prev => ({ ...prev, [orderId]: true }));
      setSuccessMsg('Live tracking started');
      
      // Start sending location updates
      startLocationUpdates(orderId);
    } catch (e) {
      setError(e.message);
    }
  };

  const stopTracking = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/tracking/${orderId}/stop`, {
        method: 'POST',
        headers: headers(),
      });
      if (!res.ok) throw new Error('Failed to stop tracking');
      
      setTrackingEnabled(prev => ({ ...prev, [orderId]: false }));
      
      // Stop location updates
      if (trackingInterval) {
        clearInterval(trackingInterval);
        setTrackingInterval(null);
      }
      
      setSuccessMsg('Live tracking stopped');
    } catch (e) {
      setError(e.message);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0
          });
        },
        (error) => {
          reject(new Error('Failed to get location'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const startLocationUpdates = (orderId) => {
    const updateLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setPartnerLocation(location);
        
        const res = await fetch(`${API_BASE}/tracking/location`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({
            order_id: orderId,
            partner_id: partnerId,
            ...location
          }),
        });
        
        if (!res.ok) throw new Error('Failed to update location');
      } catch (e) {
        console.error('Location update error:', e);
      }
    };

    // Initial location update
    updateLocation();
    
    // Set up interval for updates (every 30 seconds - reduced from 10 seconds)
    const interval = setInterval(updateLocation, 30000);
    setTrackingInterval(interval);
  };

  const showCustomerMap = (order) => {
    setSelectedOrderForTracking(order);
    setShowTrackingMap(true);
  };

  // Initialize map when modal is shown
  useEffect(() => {
    if (showTrackingMap && selectedOrderForTracking && mapRef.current && typeof window !== 'undefined' && window.L) {
      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const order = selectedOrderForTracking;
      const lat = order.latitude || 26.1445;
      const lng = order.longitude || 91.7362;

      const map = window.L.map(mapRef.current).setView([lat, lng], 15);
      mapInstanceRef.current = map;

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = window.L.marker([lat, lng]).addTo(map);
      marker.bindPopup(`<b>Delivery Location</b><br>${order.line1}, ${order.city}`).openPopup();

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [showTrackingMap, selectedOrderForTracking]);

  // Cleanup tracking interval on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  const getMapLink = (address) => {
    if (!address.latitude || !address.longitude) return '#';
    return `https://www.google.com/maps/dir/?api=1&destination=${address.latitude},${address.longitude}`;
  };

  const maskPhone = (phone) => {
    if (!phone || phone.length < 10) return phone;
    return phone.slice(0, 4) + 'XXXX' + phone.slice(-2);
  };

  // Login Screen
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'Manrope', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 20, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: COLORS.ink, marginBottom: 24, textAlign: 'center' }}>
            DailyBloom Partner
          </div>
          {authError && <div style={{ background: '#FDEDE4', color: '#7A3418', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>{authError}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6, display: 'block' }}>Partner ID</label>
              <input
                type="text"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                placeholder="Enter your Partner ID"
                style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${COLORS.line}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6, display: 'block' }}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: 12, borderRadius: 10, border: `1px solid ${COLORS.line}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              >
                <option value="">Select your category</option>
                <option value="dairy">Dairy</option>
                <option value="bakery">Bakery</option>
                <option value="honey">Honey & Jaggery</option>
                <option value="flowers">Fresh Flowers</option>
                <option value="delivery">Delivery Partner</option>
              </select>
            </div>
            <button
              onClick={handleLogin}
              style={{ width: '100%', background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'Manrope', sans-serif', padding: '24px 20px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: COLORS.card, padding: '16px 20px', borderRadius: 16, border: `1px solid ${COLORS.line}` }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: COLORS.ink }}>
              Partner Portal
            </div>
            <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 4 }}>
              Partner ID: {partnerId} · Category: {category.charAt(0).toUpperCase() + category.slice(1)}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: 'transparent', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: COLORS.danger, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <LogOut size={14} /> Logout
          </button>
          <button
            onClick={() => openWhatsAppSupport(partnerId, 'Partner support needed')}
            style={{ background: '#25D366', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <MessageCircle size={14} /> WhatsApp Support
          </button>
        </div>

        {error && <div style={{ background: '#FDEDE4', color: '#7A3418', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>{error}</div>}
        {successMsg && <div style={{ background: '#E4F0E8', color: COLORS.dairy, fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 16 }}>{successMsg}</div>}

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('available')}
            style={{
              flex: 1,
              background: activeTab === 'available' ? COLORS.marigold : COLORS.card,
              color: activeTab === 'available' ? COLORS.ink : COLORS.inkSoft,
              border: activeTab === 'available' ? 'none' : `1px solid ${COLORS.line}`,
              borderRadius: 12,
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Package size={16} />
            Available Orders ({availableOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('assigned')}
            style={{
              flex: 1,
              background: activeTab === 'assigned' ? COLORS.marigold : COLORS.card,
              color: activeTab === 'assigned' ? COLORS.ink : COLORS.inkSoft,
              border: activeTab === 'assigned' ? 'none' : `1px solid ${COLORS.line}`,
              borderRadius: 12,
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Activity size={16} />
            My Orders ({orders.length})
          </button>
        </div>

        {/* Available Orders Tab */}
        {activeTab === 'available' && (
          <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.line}`, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
                Available Orders
              </div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                First-come-first-serve · {availableOrders.length} orders
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.inkSoft }}>Loading available orders...</div>
            ) : availableOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.inkSoft }}>
                No orders available for your category right now. Orders will appear here when customers place orders for {category} products.
              </div>
            ) : (
              <VirtualOrderList
                orders={availableOrders}
                renderOrder={(order, index, isHovered) => (
                  <div key={order.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, background: isHovered ? '#F5F5F5' : COLORS.bg }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>
                          Order #{order.id?.slice(-6) || 'N/A'}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.marigoldDark }}>
                        ₹{order.total || '0'}
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>Items:</div>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: 12, color: COLORS.inkSoft, marginBottom: 2 }}>
                          {item.product_name} x {item.quantity}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: COLORS.inkSoft }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={14} />
                        {maskPhone(order.customer_phone)}
                      </div>
                      {order.locality && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} />
                          {order.locality}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => acceptOrder(order.id)}
                      style={{ 
                        width: '100%', 
                        background: COLORS.marigold, 
                        color: COLORS.ink, 
                        border: 'none', 
                        borderRadius: 8, 
                        padding: '12px', 
                        fontWeight: 700, 
                        fontSize: 14, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <Check size={16} />
                      Accept Order
                    </button>
                  </div>
                )}
                height={400}
                itemSize={200}
              />
            )}
          </div>
        )}

        {/* Assigned Orders Tab */}
        {activeTab === 'assigned' && (
          <div style={{ background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.line}`, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600, color: COLORS.ink }}>
                My Orders
              </div>
              <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                {orders.length} orders assigned
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.inkSoft }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: COLORS.inkSoft }}>No orders assigned to you</div>
            ) : (
              <VirtualOrderList
                orders={orders}
                renderOrder={(order, index, isHovered) => (
                  <div key={order.id} style={{ border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16, background: isHovered ? '#F5F5F5' : '#fafafa' }}>
                    {/* Order Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>Order #{order.id}</div>
                        <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 2 }}>
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: order.status === ORDER_STATUS.PENDING_APPROVAL ? COLORS.marigoldLight :
                                   order.status === ORDER_STATUS.CONFIRMED ? COLORS.dairyLight :
                                   order.status === ORDER_STATUS.PACKED ? '#E3F2FD' :
                                   order.status === ORDER_STATUS.OUT_FOR_DELIVERY ? '#FFF3E0' :
                                   order.status === ORDER_STATUS.DELIVERED ? '#E8F5E9' :
                                   order.status === ORDER_STATUS.FULFILLED ? '#E8F5E9' : '#FFEBEE',
                        color: COLORS.ink
                      }}>
                        {STATUS_LABELS[order.status]}
                      </div>
                    </div>

                    {/* Customer Details */}
                    <div style={{ marginBottom: 12, padding: 12, background: '#fff', borderRadius: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 8 }}>Delivery Details</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <MapPin size={14} color={COLORS.dairy} />
                          <span>{order.line1}, {order.city} - {order.pincode}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                          <Phone size={14} color={COLORS.dairy} />
                          <span>{maskPhone(order.customer_phone)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <a
                            href={getMapLink(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.marigoldDark, textDecoration: 'none', fontWeight: 600 }}
                          >
                            <Navigation size={14} />
                            Open in Maps
                          </a>
                          <button
                            onClick={() => showCustomerMap(order)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: COLORS.ink, background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            <MapPin size={14} />
                            View Map
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 8 }}>Items</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {order.items && order.items.map((item, idx) => (
                          <div key={idx} style={{ fontSize: 13, color: COLORS.inkSoft, display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.product_name} x{item.quantity}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.line}`, fontSize: 14, fontWeight: 700, color: COLORS.ink, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total</span>
                        <span>₹{order.total}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {order.status === ORDER_STATUS.PENDING_APPROVAL && (
                      <button
                        onClick={() => updateOrderStatus(order.id, ORDER_STATUS.CONFIRMED)}
                        style={{ width: '100%', background: COLORS.success, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <Check size={16} /> Confirm Order
                      </button>
                    )}

                    {order.status === ORDER_STATUS.CONFIRMED && (
                      <button
                        onClick={() => updateOrderStatus(order.id, ORDER_STATUS.PACKED)}
                        style={{ width: '100%', background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <Package size={16} /> Mark as Packed
                      </button>
                    )}

                    {order.status === ORDER_STATUS.PACKED && (
                      <button
                        onClick={() => updateOrderStatus(order.id, ORDER_STATUS.OUT_FOR_DELIVERY)}
                        style={{ width: '100%', background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <Navigation size={16} /> Out for Delivery
                      </button>
                    )}

                    {order.status === ORDER_STATUS.OUT_FOR_DELIVERY && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {!trackingEnabled[order.id] ? (
                          <button
                            onClick={() => startTracking(order.id)}
                            style={{ width: '100%', background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                          >
                            <Activity size={16} /> Start Live Tracking
                          </button>
                        ) : (
                          <button
                            onClick={() => stopTracking(order.id)}
                            style={{ width: '100%', background: COLORS.danger, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                          >
                            <XCircle size={16} /> Stop Tracking
                          </button>
                        )}
                        <button
                          onClick={() => updateOrderStatus(order.id, ORDER_STATUS.DELIVERED)}
                          style={{ width: '100%', background: COLORS.dairy, color: '#fff', border: 'none', borderRadius: 8, padding: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                        >
                          <CheckCircle size={16} /> Mark as Delivered
                        </button>
                      </div>
                    )}

                    {order.status === ORDER_STATUS.DELIVERED && (
                      <div style={{ fontSize: 13, color: COLORS.success, textAlign: 'center', padding: 8, fontWeight: 600 }}>
                        <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Order Delivered - Waiting for feedback
                      </div>
                    )}

                    {order.status === ORDER_STATUS.FULFILLED && (
                      <div style={{ fontSize: 13, color: COLORS.success, textAlign: 'center', padding: 8, fontWeight: 600 }}>
                        <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Order Fulfilled
                      </div>
                    )}
                  </div>
                )}
                height={400}
                itemSize={450}
              />
            )}
        )}

        {/* Customer Location Map Modal */}
        {showTrackingMap && selectedOrderForTracking && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 }}>
            <div style={{ background: COLORS.card, borderRadius: 16, padding: 24, width: '100%', maxWidth: 600, border: `1px solid ${COLORS.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.ink }}>
                  Customer Delivery Location
                </div>
                <button
                  onClick={() => {
                    setShowTrackingMap(false);
                    setSelectedOrderForTracking(null);
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkSoft }}
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div style={{ marginBottom: 16, padding: 12, background: '#F8F9F5', borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.ink, marginBottom: 4 }}>
                  {selectedOrderForTracking.line1}, {selectedOrderForTracking.city} - {selectedOrderForTracking.pincode}
                </div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                  Customer: {maskPhone(selectedOrderForTracking.customer_phone)}
                </div>
              </div>

              {/* Map Container */}
              <div 
                ref={mapRef}
                style={{ width: '100%', height: 300, borderRadius: 8, marginBottom: 16, background: '#E8EFE8' }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={getMapLink(selectedOrderForTracking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, padding: 12, background: COLORS.marigold, color: COLORS.ink, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Navigation size={16} />
                  Navigate
                </a>
                <button
                  onClick={() => {
                    setShowTrackingMap(false);
                    setSelectedOrderForTracking(null);
                  }}
                  style={{ flex: 1, padding: 12, background: 'transparent', color: COLORS.ink, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
