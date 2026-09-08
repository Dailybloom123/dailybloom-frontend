# DailyBloom Portal Access Guide

## 📱 **System Architecture**

DailyBloom now has **TWO SEPARATE SYSTEMS**:

### 1. **Customer Portal** (Separate System)
- **Web**: `http://localhost:5173/`
- **Mobile**: Expo Go app (React Native)
- **Purpose**: Customer shopping, orders, tracking, feedback

### 2. **Management Portal** (Unified System)
- **Web**: `http://localhost:5173/management.html`
- **Purpose**: Admin & Partner/Vendor management
- **Components**:
  - Admin Dashboard (Login: admin@dailybloom.com / admin123)
  - Partner/Vendor Portal (Login: Partner ID + Category selection)

---

## 🚀 **How to Access Each Portal**

### **Customer Portal**
```bash
# Terminal 1: Backend (already running)
cd "C:\Users\bharg\Downloads\DailyBloom\The Backbone\dailybloom-backend\dailybloom-backend"
npm start

# Terminal 2: Frontend (already running)
cd "C:\Users\bharg\Downloads\DailyBloom\The Backbone\dailybloom-app-frontend\dailybloom-app"
npm run dev

# Access in browser:
http://localhost:5173/
```

### **Management Portal (Admin & Partner)**
```bash
# Use the same frontend server (already running)
# Just access the management page:
http://localhost:5173/management.html
```

**On the Management Portal page, you'll see:**
1. **Admin Login** button → Enter credentials → Access Admin Dashboard
2. **Partner/Vendor Login** button → Enter Partner ID + Category → Access Partner Portal

---

## 🔐 **Login Credentials**

### **Admin Dashboard**
- **Email**: `admin@dailybloom.com`
- **Password**: `admin123`
- **Features**:
  - Dashboard with stats
  - Order management
  - Partner management
  - Complaint handling
  - **Stock management** (NEW)
  - **Sales analytics** (NEW - Weekly/Monthly, Locality-wise)

### **Partner/Vendor Portal**
- **Partner ID**: Any valid partner ID from database
- **Category**: Select from:
  - Dairy
  - Bakery
  - Honey & Jaggery
  - Fresh Flowers
  - Delivery Partner
- **Features**:
  - Order management
  - Customer location maps
  - Live location sharing
  - WhatsApp support

---

## 📊 **New Admin Features**

### **Stock Management**
- View all inventory items
- Low stock alerts (auto-highlighted)
- Add/Update/Delete products
- Reorder level tracking
- Stock quantity management

### **Sales Analytics**
- **Period Selection**: Weekly or Monthly
- **Locality/Area-wise Reports**:
  - Fancy Bazar
  - Panbazar
  - Uzan Bazar
  - Bhangagarh
  - Ulubari
  - And more...
- **Revenue tracking** by area
- **Order count** by area
- **Sales trend visualization**

---

## 🌐 **WhatsApp Business Integration**

All portals now have WhatsApp Business integration:

### **Customer Portal**
- Order via WhatsApp
- WhatsApp Support button
- Live tracking updates

### **Partner Portal**
- WhatsApp Support in header
- Quick support requests

### **Admin Dashboard**
- WhatsApp button for each partner
- Direct communication
- Complaint escalation

---

## 📱 **Mobile App (Expo Go)**

```bash
# Terminal 3: Mobile App
cd "C:\Users\bharg\Downloads\DailyBloom\The Backbone\dailybloom-mobile\dailybloom-mobile"
npm start

# Then scan QR code with Expo Go app on Android
```

**Mobile App Features:**
- Full customer portal functionality
- WhatsApp Business integration
- Location services
- All shopping features

---

## 🗂️ **File Structure**

```
dailybloom-app-frontend/
├── index.html              # Customer Portal Entry
├── management.html         # Management Portal Entry (NEW)
├── admin.html              # Old Admin Entry (deprecated)
├── partner.html            # Old Partner Entry (deprecated)
└── src/
    ├── main.jsx           # Customer Portal Entry
    ├── main-management.jsx # Management Portal Entry (NEW)
    ├── App.jsx            # Customer Portal Component
    ├── ManagementPortal.jsx # Admin + Partner Portal (NEW)
    ├── PartnerPortal.jsx  # Old Partner Component (deprecated)
    └── AdminDashboard.jsx # Old Admin Component (deprecated)
```

---

## 🔄 **Migration Notes**

- **Old entries are deprecated** but still work for backward compatibility
- **New unified system** provides better separation of concerns
- **Database migrations** applied for stock and sales analytics
- **All existing features** preserved and enhanced

---

## 🎯 **Quick Access Summary**

| Portal | URL | Purpose |
|--------|-----|---------|
| **Customer** | `http://localhost:5173/` | Shopping, Orders, Tracking |
| **Management** | `http://localhost:5173/management.html` | Admin + Partner Login |
| **Mobile** | Expo Go Scan | Customer App on Phone |

---

## 📞 **Support**

For any issues:
1. Check backend is running on port 4000
2. Check frontend is running on port 5173
3. Verify database migrations are applied
4. Check browser console for errors

**WhatsApp Business Number**: +91 99102 17309