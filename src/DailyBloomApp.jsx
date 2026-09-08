import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, ShoppingCart, ClipboardList, User, ChevronLeft, X } from 'lucide-react';

const API_BASE = 'http://localhost:4000/api';

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
  primary: '#2563EB',
};

function TopBar({ title, onBack, onAccount }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 20px 14px', background: COLORS.bg,
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: COLORS.ink }}>
            <ChevronLeft size={22} />
          </button>
        )}
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 21, color: COLORS.ink, margin: 0 }}>{title}</h1>
      </div>
      {onAccount && (
        <button onClick={onAccount} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: COLORS.ink }}>
          <User size={22} />
        </button>
      )}
    </div>
  );
}

function BottomNav({ screen, setScreen, cartCount }) {
  const items = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { key: 'orders', label: 'Orders', icon: ClipboardList },
  ];
  return (
    <div style={{
      display: 'flex', borderTop: `1px solid ${COLORS.line}`,
      background: COLORS.card, padding: '8px 0 10px',
    }}>
      {items.map(({ key, label, icon: Icon, badge }) => {
        const active = screen === key;
        return (
          <button
            key={key}
            onClick={() => setScreen(key)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: active ? COLORS.marigold : COLORS.inkSoft,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} />
              {badge && badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: COLORS.danger,
                  color: '#fff',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DailyBloomApp() {
  const [screen, setScreen] = useState('home');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [orderTrackingTimeline, setOrderTrackingTimeline] = useState([]);

  const fetchOrderTracking = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/order-tracking/${orderId}/tracking`);
      if (res.ok) {
        setOrderTrackingTimeline(await res.json());
      }
    } catch (e) {
      console.error('Error fetching order tracking:', e);
    }
  };

  const openOrderTracking = (order) => {
    setSelectedOrderForTracking(order);
    fetchOrderTracking(order.id);
  };

  const closeOrderTracking = () => {
    setSelectedOrderForTracking(null);
    setOrderTrackingTimeline([]);
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: 'Manrope, sans-serif' }}>
      {screen === 'home' && (
        <div>
          <TopBar title="DailyBloom" onAccount={() => setScreen('profile')} />
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
              Categories
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
              {['Dairy', 'Bakery', 'Honey', 'Flowers'].map((category) => (
                <div key={category} style={{ 
                  background: COLORS.card, 
                  borderRadius: 12, 
                  padding: 20, 
                  textAlign: 'center',
                  border: `1px solid ${COLORS.line}`,
                  cursor: 'pointer'
                }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>
                    {category === 'Dairy' ? '🥛' : category === 'Bakery' ? '🍞' : category === 'Honey' ? '🍯' : '🌸'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink }}>{category}</div>
                </div>
              ))}
            </div>
          </div>
          <BottomNav screen={screen} setScreen={setScreen} cartCount={cart.length} />
        </div>
      )}

      {screen === 'orders' && (
        <div>
          <TopBar title="My Orders" onBack={() => setScreen('home')} />
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 700, color: COLORS.ink, marginBottom: 20 }}>
              Order History
            </h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', color: COLORS.inkSoft, padding: 40 }}>
                No orders yet
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 16 }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ 
                    background: COLORS.card, 
                    borderRadius: 12, 
                    padding: 16, 
                    border: `1px solid ${COLORS.line}` 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink }}>
                        Order #{order.id?.slice(-6) || 'N/A'}
                      </div>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        padding: '4px 12px', 
                        borderRadius: 12, 
                        background: COLORS.marigoldLight, 
                        color: COLORS.marigoldDark 
                      }}>
                        {order.status || 'Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                      Total: ₹{order.total || '0'}
                    </div>
                    <button
                      onClick={() => openOrderTracking(order)}
                      style={{ 
                        background: COLORS.primary, 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 6, 
                        padding: '8px 16px', 
                        fontSize: 12, 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        marginTop: 12 
                      }}
                    >
                      Track Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <BottomNav screen={screen} setScreen={setScreen} cartCount={cart.length} />
        </div>
      )}

      {/* Order Tracking Modal */}
      {selectedOrderForTracking && (
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
                Order Tracking
              </h3>
              <button onClick={closeOrderTracking} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.ink, marginBottom: 12 }}>
                Delivery Timeline
              </h4>
              {orderTrackingTimeline.length === 0 ? (
                <div style={{ fontSize: 13, color: COLORS.inkSoft }}>No tracking information available</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orderTrackingTimeline.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: COLORS.marigold,
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
          </div>
        </div>
      )}
    </div>
  );
}