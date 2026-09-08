import React, { useState, useEffect, useCallback } from 'react';
import { Home, ShoppingCart, ClipboardList, User, ChevronLeft, Plus, Minus, Check, Milk, Flower2, Package, RefreshCw, MapPin, Clock } from 'lucide-react';

const API_BASE = 'https://dailybloom-x82y.onrender.com/api';
const ZONE_ID = '11111111-1111-1111-1111-111111111111';

const COLORS = {
  bg: '#F6F7F2',
  ink: '#16301F',
  inkSoft: '#3E5245',
  marigold: '#E8A33D',
  marigoldDark: '#B87A1F',
  rose: '#C65D7B',
  clay: '#8B5E3C',
  dairy: '#4C7A5E',
  card: '#FFFFFF',
  line: '#E4E3D8',
};

const CATEGORY_META = {
  dairy: { label: 'Dairy', color: COLORS.dairy, icon: Milk },
  flowers: { label: 'Flowers', color: COLORS.rose, icon: Flower2 },
  claypots: { label: 'Claypots', color: COLORS.clay, icon: Package },
};

function useFonts() {
  useEffect(() => {
    const id = 'dailybloom-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

function useRazorpayScript() {
  useEffect(() => {
    const id = 'razorpay-checkout-script';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }, []);
}

function Stamp({ category, size = 40 }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.dairy;
  const Icon = meta.icon;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        border: `2px solid ${meta.color}`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: meta.color, background: '#fff', flexShrink: 0,
        transform: 'rotate(-6deg)',
      }}
    >
      <Icon size={size * 0.5} strokeWidth={1.75} />
    </div>
  );
}

function TopBar({ title, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '18px 20px 14px', background: COLORS.bg,
      position: 'sticky', top: 0, zIndex: 5,
    }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: COLORS.ink }}>
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 21, color: COLORS.ink, margin: 0 }}>{title}</h1>
    </div>
  );
}

function BottomNav({ screen, setScreen, cartCount }) {
  const items = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { key: 'orders', label: 'Orders', icon: ClipboardList },
    { key: 'account', label: 'Account', icon: User },
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
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, background: 'none', border: 'none', cursor: 'pointer',
              color: active ? COLORS.ink : '#A5A79A', position: 'relative',
            }}
          >
            <Icon size={21} strokeWidth={active ? 2.25 : 1.75} />
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 11, fontWeight: active ? 600 : 500 }}>{label}</span>
            {!!badge && (
              <span style={{
                position: 'absolute', top: -2, right: '28%', background: COLORS.marigold,
                color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700,
                minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function Button({ children, onClick, variant = 'primary', disabled, style }) {
  const base = {
    fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: 14,
    borderRadius: 10, padding: '13px 18px', border: 'none', cursor: disabled ? 'default' : 'pointer',
    width: '100%', opacity: disabled ? 0.5 : 1, transition: 'transform 0.1s',
  };
  const variants = {
    primary: { background: COLORS.marigold, color: COLORS.ink },
    dark: { background: COLORS.ink, color: '#fff' },
    outline: { background: 'transparent', color: COLORS.ink, border: `1.5px solid ${COLORS.ink}` },
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.98)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {children}
    </button>
  );
}

export default function DailyBloomApp() {
  useFonts();
  useRazorpayScript();

  const [apiOk, setApiOk] = useState(null); // null = checking, true/false after
  const [screen, setScreen] = useState('login');
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [devOtp, setDevOtp] = useState(null);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]); // { product, quantity }
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({ line1: '', city: '', pincode: '', recipient_name: '', delivery_instructions: '' });
  const [editingAddress, setEditingAddress] = useState(false);
  const [orders, setOrders] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [error, setError] = useState(null);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const fetchProducts = useCallback(async (category) => {
    setLoadingProducts(true);
    setError(null);
    try {
      const q = new URLSearchParams({ zone_id: ZONE_ID, ...(category ? { category } : {}) });
      const res = await fetch(`${API_BASE}/products?${q}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
      setApiOk(true);
    } catch (e) {
      setApiOk(false);
      setError('Could not reach your backend at localhost:4000. Make sure `npm run dev` is running.');
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const requestOtp = async () => {
    setError(null);
    try {
      const body = loginMethod === 'phone' ? { phone } : { email };
      const res = await fetch(`${API_BASE}/auth/request-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setOtpSent(true);
      setDevOtp(null);
    } catch (e) {
      setError(e.message + ' (check that your backend server is running)');
    }
  };

  const verifyOtp = async () => {
    setError(null);
    try {
      const body = loginMethod === 'phone'
        ? { phone, otp, name: 'Customer' }
        : { email, otp, name: 'Customer' };
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      setToken(data.token);
      setUser(data.user);
      setScreen('home');
    } catch (e) {
      setError(e.message);
    }
  };

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) => prev
      .map((i) => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter((i) => i.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${API_BASE}/addresses`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setAddresses(data);
    } catch (e) { /* silent */ }
  };

  const createAddress = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/addresses`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ zone_id: ZONE_ID, label: 'Home', ...newAddress, is_default: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save address');
      setAddresses((prev) => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e.message);
      return null;
    }
  };

  const placeOrder = async () => {
    setPlacingOrder(true);
    setError(null);
    try {
      let address = addresses[0];
      if (!address || editingAddress) {
        address = await createAddress();
        if (!address) { setPlacingOrder(false); return; }
        setEditingAddress(false);
      }

      // Step 1: ask our backend to create a Razorpay order (real price calculated server-side)
      const createRes = await fetch(`${API_BASE}/payments/create`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          address_id: address.id,
          delivery_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          delivery_slot: 'morning',
          items: cart.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        }),
      });
      const paymentOrder = await createRes.json();
      if (!createRes.ok) throw new Error(paymentOrder.error || 'Could not start payment');

      // Step 2: open Razorpay's checkout popup
      if (!window.Razorpay) throw new Error('Payment system is still loading, please try again in a moment.');

      const razorpayCheckout = new window.Razorpay({
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'DailyBloom',
        description: 'Order payment',
        order_id: paymentOrder.razorpay_order_id,
        handler: async function (response) {
          // Step 3: once the popup reports success, ask our backend to independently
          // verify the payment signature before we trust it — never rely on the popup alone.
          try {
            const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
              method: 'POST', headers: authHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifiedOrder = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifiedOrder.error || 'Payment verification failed');
            setOrderResult(verifiedOrder);
            setCart([]);
            setScreen('confirmation');
          } catch (e) {
            setError(e.message);
          } finally {
            setPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            // Customer closed the popup without paying — not an error, just stop the spinner.
            setPlacingOrder(false);
          },
        },
        prefill: {
          name: user?.name || '',
          contact: user?.phone || '',
          email: user?.email || '',
        },
        theme: { color: '#16301F' },
      });

      razorpayCheckout.open();
    } catch (e) {
      setError(e.message);
      setPlacingOrder(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    if (token && screen === 'checkout') fetchAddresses();
    if (token && screen === 'orders') fetchOrders();
  }, [screen, token]);

  const requireLogin = (next) => {
    if (token) { setScreen(next); }
    else { setScreen('login'); setError('Please log in first to continue.'); }
  };

  const frame = {
    width: 390, minHeight: 720, margin: '0 auto', background: COLORS.bg,
    borderRadius: 32, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    fontFamily: "'Manrope', sans-serif", border: '1px solid #D9D8CC', position: 'relative',
  };

  const content = { flex: 1, overflowY: 'auto', padding: '0 20px 20px' };

  return (
    <div style={frame}>
      {error && (
        <div style={{
          background: '#FDEDE4', color: '#7A3418', fontSize: 12.5, padding: '10px 16px',
          borderBottom: `1px solid ${COLORS.line}`, lineHeight: 1.4,
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#7A3418', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      {screen === 'login' && (
        <div style={{ padding: '60px 28px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: 32, color: COLORS.ink }}>DailyBloom</div>
            <div style={{ color: COLORS.inkSoft, fontSize: 13.5, marginTop: 4 }}>Fresh dairy, flowers and handmade goods, from your local vendors.</div>
          </div>
          {!otpSent ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <button
                  onClick={() => setLoginMethod('phone')}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                    border: `1.5px solid ${loginMethod === 'phone' ? COLORS.ink : COLORS.line}`,
                    background: loginMethod === 'phone' ? COLORS.ink : 'transparent',
                    color: loginMethod === 'phone' ? '#fff' : COLORS.inkSoft,
                  }}
                >Phone</button>
                <button
                  onClick={() => setLoginMethod('email')}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
                    border: `1.5px solid ${loginMethod === 'email' ? COLORS.ink : COLORS.line}`,
                    background: loginMethod === 'email' ? COLORS.ink : 'transparent',
                    color: loginMethod === 'email' ? '#fff' : COLORS.inkSoft,
                  }}
                >Email</button>
              </div>
              {loginMethod === 'phone' ? (
                <>
                  <label style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 }}>Phone number</label>
                  <input
                    value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9999999999"
                    style={{ padding: 13, borderRadius: 10, border: `1.5px solid ${COLORS.line}`, fontSize: 15, fontFamily: 'inherit' }}
                  />
                  <Button onClick={requestOtp} disabled={phone.length < 6}>Send OTP</Button>
                </>
              ) : (
                <>
                  <label style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 }}>Email address</label>
                  <input
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email"
                    style={{ padding: 13, borderRadius: 10, border: `1.5px solid ${COLORS.line}`, fontSize: 15, fontFamily: 'inherit' }}
                  />
                  <Button onClick={requestOtp} disabled={!email.includes('@')}>Send OTP</Button>
                </>
              )}
            </>
          ) : (
            <>
              <label style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 }}>Enter the 6-digit code sent to {loginMethod === 'phone' ? phone : email}</label>
              <input
                value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000"
                style={{ padding: 13, borderRadius: 10, border: `1.5px solid ${COLORS.line}`, fontSize: 15, letterSpacing: 3, fontFamily: 'inherit' }}
              />
              <Button onClick={verifyOtp} disabled={otp.length < 4}>Verify and continue</Button>
              <button onClick={() => setOtpSent(false)} style={{ background: 'none', border: 'none', color: COLORS.inkSoft, fontSize: 12.5, cursor: 'pointer' }}>Use a different {loginMethod === 'phone' ? 'number' : 'email'}</button>
              <div style={{ fontSize: 11.5, color: '#A5A79A', textAlign: 'center', marginTop: 4 }}>
                Dev mode: check your backend terminal for the OTP.
              </div>
            </>
          )}
          <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: COLORS.marigoldDark, fontSize: 12.5, cursor: 'pointer', marginTop: 8 }}>
            Continue browsing without logging in →
          </button>
        </div>
      )}

      {screen === 'home' && (
        <>
          <TopBar title="DailyBloom" />
          <div style={content}>
            <div style={{
              background: COLORS.ink, borderRadius: 16, padding: 18, marginBottom: 18,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <Stamp category="dairy" size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 600 }}>Set up daily milk</div>
                <div style={{ color: '#C9D3C7', fontSize: 12 }}>Delivered fresh, every morning</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const active = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => { const next = active ? null : key; setActiveCategory(next); fetchProducts(next); }}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '12px 4px', borderRadius: 12, cursor: 'pointer',
                      border: `1.5px solid ${active ? meta.color : COLORS.line}`,
                      background: active ? `${meta.color}14` : COLORS.card,
                    }}
                  >
                    <Icon size={20} color={meta.color} strokeWidth={1.75} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.ink }}>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            {apiOk === false && (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: COLORS.inkSoft, fontSize: 13 }}>
                <RefreshCw size={22} style={{ marginBottom: 8 }} />
                <div>Can't reach your backend yet.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Make sure <code>npm run dev</code> is running on port 4000, then tap retry.</div>
                <button onClick={() => fetchProducts(activeCategory)} style={{ marginTop: 10, background: 'none', border: `1px solid ${COLORS.ink}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12.5 }}>Retry</button>
              </div>
            )}

            {loadingProducts && <div style={{ textAlign: 'center', padding: 30, color: COLORS.inkSoft, fontSize: 13 }}>Loading products…</div>}

            {!loadingProducts && apiOk && products.map((p) => (
              <div
                key={p.id}
                onClick={() => { setSelectedProduct(p); setScreen('product'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, background: COLORS.card,
                  border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 12, marginBottom: 10, cursor: 'pointer',
                }}
              >
                <Stamp category={p.category} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: COLORS.ink }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{p.vendor_name} · {p.unit}</div>
                  {p.subscribable && (
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.marigoldDark, background: '#FCEFDB', padding: '2px 7px', borderRadius: 20, display: 'inline-block', marginTop: 4 }}>Subscribable</span>
                  )}
                </div>
                <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.ink }}>₹{parseFloat(p.price).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {screen === 'product' && selectedProduct && (
        <>
          <TopBar title="Product" onBack={() => setScreen('home')} />
          <div style={content}>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 20px' }}>
              <Stamp category={selectedProduct.category} size={72} />
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: COLORS.ink }}>{selectedProduct.name}</div>
            <div style={{ color: COLORS.inkSoft, fontSize: 13.5, margin: '4px 0 16px' }}>From {selectedProduct.vendor_name}</div>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 24, color: COLORS.ink, marginBottom: 20 }}>
              ₹{parseFloat(selectedProduct.price).toFixed(0)} <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.inkSoft }}>/ {selectedProduct.unit}</span>
            </div>
            {selectedProduct.subscribable && (
              <div style={{ background: '#FCEFDB', borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 12.5, color: COLORS.marigoldDark }}>
                This item can be set up as a daily subscription so it arrives automatically every morning.
              </div>
            )}
            <Button onClick={() => { addToCart(selectedProduct); setScreen('home'); }}>Add to cart · ₹{parseFloat(selectedProduct.price).toFixed(0)}</Button>
          </div>
        </>
      )}

      {screen === 'cart' && (
        <>
          <TopBar title="Your cart" />
          <div style={content}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 10px', color: COLORS.inkSoft, fontSize: 13.5 }}>
                Your cart is empty. Browse products from the home tab to get started.
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${COLORS.line}` }}>
                    <Stamp category={item.product.category} size={36} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5, color: COLORS.ink }}>{item.product.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.inkSoft }}>₹{parseFloat(item.product.price).toFixed(0)} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateCartQty(item.product.id, -1)} style={{ border: `1px solid ${COLORS.line}`, background: '#fff', borderRadius: 6, width: 26, height: 26, cursor: 'pointer' }}><Minus size={13} /></button>
                      <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 16, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.product.id, 1)} style={{ border: `1px solid ${COLORS.line}`, background: '#fff', borderRadius: 6, width: 26, height: 26, cursor: 'pointer' }}><Plus size={13} /></button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 0', fontWeight: 700, fontSize: 15, color: COLORS.ink }}>
                  <span>Total</span><span>₹{cartTotal.toFixed(0)}</span>
                </div>
                <Button onClick={() => requireLogin('checkout')}>Proceed to checkout</Button>
              </>
            )}
          </div>
        </>
      )}

      {screen === 'checkout' && (
        <>
          <TopBar title="Checkout" onBack={() => setScreen('cart')} />
          <div style={content}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> Delivery address
            </div>
            {addresses.length > 0 && !editingAddress ? (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, marginBottom: 18, fontSize: 13.5 }}>
                {addresses[0].recipient_name && <div style={{ fontWeight: 700, marginBottom: 3 }}>{addresses[0].recipient_name}</div>}
                <div>{addresses[0].line1}, {addresses[0].city} {addresses[0].pincode}</div>
                {addresses[0].delivery_instructions && (
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: `1px solid ${COLORS.line}`, color: COLORS.inkSoft, fontSize: 12.5 }}>
                    Note: {addresses[0].delivery_instructions}
                  </div>
                )}
                <button
                  onClick={() => {
                    setNewAddress({
                      line1: addresses[0].line1 || '',
                      city: addresses[0].city || '',
                      pincode: addresses[0].pincode || '',
                      recipient_name: addresses[0].recipient_name || '',
                      delivery_instructions: addresses[0].delivery_instructions || '',
                    });
                    setEditingAddress(true);
                  }}
                  style={{ marginTop: 8, background: 'none', border: 'none', color: COLORS.marigoldDark, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Edit address
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                <input placeholder="Recipient's name" value={newAddress.recipient_name} onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })} style={{ padding: 11, borderRadius: 9, border: `1.5px solid ${COLORS.line}`, fontSize: 13.5, fontFamily: 'inherit' }} />
                <input placeholder="Address line" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} style={{ padding: 11, borderRadius: 9, border: `1.5px solid ${COLORS.line}`, fontSize: 13.5, fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} style={{ flex: 1, padding: 11, borderRadius: 9, border: `1.5px solid ${COLORS.line}`, fontSize: 13.5, fontFamily: 'inherit' }} />
                  <input placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} style={{ width: 100, padding: 11, borderRadius: 9, border: `1.5px solid ${COLORS.line}`, fontSize: 13.5, fontFamily: 'inherit' }} />
                </div>
                <textarea placeholder="Delivery instructions (optional) — e.g. leave at gate, call before arriving" value={newAddress.delivery_instructions} onChange={(e) => setNewAddress({ ...newAddress, delivery_instructions: e.target.value })} rows={2} style={{ padding: 11, borderRadius: 9, border: `1.5px solid ${COLORS.line}`, fontSize: 13.5, fontFamily: 'inherit', resize: 'none' }} />
                {editingAddress && (
                  <button onClick={() => setEditingAddress(false)} style={{ background: 'none', border: 'none', color: COLORS.inkSoft, fontSize: 12.5, cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                    Cancel
                  </button>
                )}
              </div>
            )}

            <div style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} /> Delivery slot
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13.5 }}>
              Tomorrow morning
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 18px', fontWeight: 700, fontSize: 15, color: COLORS.ink }}>
              <span>Total</span><span>₹{cartTotal.toFixed(0)}</span>
            </div>
            <Button onClick={placeOrder} disabled={placingOrder || (!addresses.length && !newAddress.line1)}>
              {placingOrder ? 'Placing order…' : `Place order · ₹${cartTotal.toFixed(0)}`}
            </Button>
          </div>
        </>
      )}

      {screen === 'confirmation' && orderResult && (
        <>
          <TopBar title="Order placed" />
          <div style={{ ...content, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 50 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: COLORS.dairy, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Check size={30} color="#fff" strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: COLORS.ink }}>Order confirmed</div>
            <div style={{ color: COLORS.inkSoft, fontSize: 13, margin: '6px 0 24px', textAlign: 'center' }}>
              Total ₹{parseFloat(orderResult.total).toFixed(0)} · arriving {orderResult.delivery_slot}
            </div>
            <Button onClick={() => setScreen('orders')} style={{ marginBottom: 10 }}>View orders</Button>
            <Button variant="outline" onClick={() => setScreen('home')}>Back to home</Button>
          </div>
        </>
      )}

      {screen === 'orders' && (
        <>
          <TopBar title="Your orders" />
          <div style={content}>
            {!token ? (
              <div style={{ textAlign: 'center', padding: '60px 10px', color: COLORS.inkSoft, fontSize: 13.5 }}>
                Log in to see your order history.
                <div style={{ marginTop: 14 }}><Button onClick={() => setScreen('login')}>Log in</Button></div>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 10px', color: COLORS.inkSoft, fontSize: 13.5 }}>No orders yet.</div>
            ) : orders.map((o) => (
              <div key={o.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.ink }}>₹{parseFloat(o.total).toFixed(0)}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.marigoldDark, background: '#FCEFDB', padding: '2px 8px', borderRadius: 20 }}>{o.status}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.inkSoft }}>
                  {(o.items || []).map((it) => `${it.product_name} × ${it.quantity}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {screen === 'account' && (
        <>
          <TopBar title="Account" />
          <div style={content}>
            {user ? (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.line}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.ink }}>{user.name || 'Customer'}</div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 2 }}>{user.phone}</div>
                <button onClick={() => { setToken(null); setUser(null); setScreen('login'); }} style={{ marginTop: 14, background: 'none', border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', color: COLORS.inkSoft }}>Log out</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <div style={{ color: COLORS.inkSoft, fontSize: 13.5, marginBottom: 14 }}>You're not logged in.</div>
                <Button onClick={() => setScreen('login')}>Log in</Button>
              </div>
            )}
          </div>
        </>
      )}

      {!['login', 'confirmation'].includes(screen) && (
        <BottomNav screen={screen} setScreen={setScreen} cartCount={cartCount} />
      )}
    </div>
  );
}
