# 🧪 KAVACH AI — End-to-End Testing Guide

**Status:** Authentication is working ✅  
**Starting Point:** `http://localhost:3000/login`

---

## 🎯 TESTING PRIORITY ORDER

### **Phase 1: Core Authentication & Navigation** (Start Here)
### **Phase 2: Parent Dashboard & Devices** (Most Critical)
### **Phase 3: Student Features**
### **Phase 4: Institute Features**
### **Phase 5: Advanced Features**

---

## 📋 PHASE 1: CORE AUTHENTICATION & NAVIGATION

### **Test 1.1: Login Flow**

**Steps:**
1. Open `http://localhost:3000/login`
2. Open Chrome DevTools → Network tab
3. Enter credentials: `parent@demo.com` / `demo123`
4. Click "Sign In"

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/auth/login` → Status `200`
- ✅ Response contains: `{ accessToken, refreshToken, user }`
- ✅ Application → LocalStorage → `kavach_access_token` exists
- ✅ Redirects to `/parent`
- ✅ No console errors

**If fails:**
- Check backend is running on `localhost:8080`
- Check database has seed data (run migrations)
- Check CORS allows `http://localhost:3000`

---

### **Test 1.2: Token Persistence**

**Steps:**
1. After login, refresh the page (F5)
2. Check Network tab

**Expected Results:**
- ✅ Page loads without redirecting to login
- ✅ Network tab shows API calls with `Authorization: Bearer <token>` header
- ✅ No 401 errors

---

### **Test 1.3: Logout Flow**

**Steps:**
1. Click user avatar/menu → "Logout"
2. Check LocalStorage

**Expected Results:**
- ✅ `kavach_access_token` removed from LocalStorage
- ✅ Redirects to `/login` or `/`
- ✅ Cannot access protected pages

---

### **Test 1.4: Role-Based Navigation**

**Test for each role:**

**Parent:**
- Login: `parent@demo.com` / `demo123`
- Should redirect to `/parent`
- Sidebar/BottomNav shows: Home, Devices, Reports, Alerts, Blocking, etc.

**Student:**
- Login: `student@demo.com` / `demo123`
- Should redirect to `/student`
- Sidebar/BottomNav shows: Home, Focus, Achievements

**Institute:**
- Login: `admin@demo.com` / `demo123`
- Should redirect to `/institute`
- Sidebar/BottomNav shows: Dashboard, Devices, Students, etc.

---

## 📋 PHASE 2: PARENT DASHBOARD & DEVICES (Most Critical)

### **Test 2.1: Parent Dashboard Load**

**Steps:**
1. Login as parent
2. Navigate to `/parent` (should auto-redirect)
3. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/dashboard/parent` → Status `200`
- ✅ Dashboard displays:
  - Stat cards with real numbers (Screen Time, Active Devices, Focus Sessions, Blocked Attempts)
  - Device cards with real device names
  - Recent alerts (if any)
- ✅ No loading spinner stuck
- ✅ No "Failed to load" error

**If fails:**
- Check backend `DashboardController.java` endpoint
- Check database has devices linked to tenant
- Check activity logs exist for today

---

### **Test 2.2: Devices Page - List Devices**

**Steps:**
1. Navigate to `/parent/devices`
2. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/devices` → Status `200`
- ✅ Device cards display:
  - Device name
  - Status (Online/Offline/Paused/Focus)
  - Screen time today
  - Top app
- ✅ Real device data (not empty)

**If fails:**
- Check `DeviceController.java` endpoint
- Check database `devices` table has records
- Check devices are linked to parent's tenant

---

### **Test 2.3: Devices Page - Link New Device**

**Steps:**
1. Click "Link New Device" button
2. Enter device code (use a valid code from database or generate one)
3. Click "Link Device"
4. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/devices/link` → Status `200` or `201`
- ✅ New device appears in device list
- ✅ Success toast/notification appears
- ✅ Device is saved in database

**Test Data:**
- Check `devices` table for existing device codes
- Or use backend endpoint: `GET /api/v1/devices/generate-code` to get a code

---

### **Test 2.4: Devices Page - Pause/Resume Device**

**Steps:**
1. Find an online device
2. Click "Pause" button
3. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/devices/{id}/pause` → Status `200`
- ✅ Device status changes to "Paused" in UI
- ✅ Status updates in database

**Then test Resume:**
- ✅ Network tab shows: `POST /api/v1/devices/{id}/resume` → Status `200`
- ✅ Device status changes back to "Online"

---

### **Test 2.5: Devices Page - Start Focus Mode**

**Steps:**
1. Find an online device
2. Click "Focus" button (or use FocusControl dropdown)
3. Select duration (e.g., 25 min)
4. Click "Start Focus"
5. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/focus/start` → Status `200`
- ✅ Device status shows "Focus Mode"
- ✅ Focus session created in database
- ✅ Timer appears (if viewing from device)

---

## 📋 PHASE 3: REPORTS & ANALYTICS

### **Test 3.1: Reports Page - Weekly View**

**Steps:**
1. Navigate to `/parent/reports`
2. Select a device from dropdown
3. Open Network tab

**Expected Results:**
- ✅ Network tab shows multiple requests:
  - `GET /api/v1/reports/device/{id}/weekly` → Status `200`
  - `GET /api/v1/reports/device/{id}/apps` → Status `200`
  - `GET /api/v1/reports/device/{id}/categories` → Status `200`
  - `GET /api/v1/reports/device/{id}/heatmap` → Status `200`
- ✅ Charts display with real data:
  - Weekly trend chart
  - Top apps list
  - Category breakdown
  - Activity heatmap
- ✅ No empty charts

**If fails:**
- Check `ReportsController.java` endpoints
- Check `activity_logs` table has data for selected device
- Check date ranges are valid

---

### **Test 3.2: Reports Page - Monthly View**

**Steps:**
1. On reports page, switch to "Monthly" view
2. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/reports/device/{id}/monthly` → Status `200`
- ✅ Charts update with monthly data
- ✅ Data spans last 30 days

---

## 📋 PHASE 4: ALERTS & RULES

### **Test 4.1: Alerts Page - View Rules**

**Steps:**
1. Navigate to `/parent/rules`
2. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/alerts/rules` → Status `200`
- ✅ Alert rules list displays
- ✅ Rules show: name, type, severity, active status

---

### **Test 4.2: Alerts Page - Create Rule**

**Steps:**
1. Click "Create Alert Rule"
2. Fill in form (e.g., "Screen Time Exceeded", threshold: 4 hours)
3. Click "Create"
4. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/alerts/rules` → Status `201`
- ✅ New rule appears in list
- ✅ Rule saved in database
- ✅ Success toast appears

---

### **Test 4.3: Blocking Page - View Block Rules**

**Steps:**
1. Navigate to `/parent/control`
2. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/blocking/rules` → Status `200`
- ✅ Block rules list displays
- ✅ Rules show: app/category blocked, schedule, active status

---

### **Test 4.4: Blocking Page - Create Block Rule**

**Steps:**
1. Click "Create Rule"
2. Select rule type (App/Category/Website)
3. Enter target (e.g., "YouTube")
4. Set schedule (optional)
5. Click "Create"
6. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/blocking/rules` → Status `201`
- ✅ New rule appears in list
- ✅ Rule saved in database
- ✅ Rule is active and will block the app

---

## 📋 PHASE 5: STUDENT FEATURES

### **Test 5.1: Student Dashboard**

**Steps:**
1. Login as `student@demo.com` / `demo123`
2. Navigate to `/student`
3. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/dashboard/student` → Status `200`
- ✅ Dashboard displays:
  - Focus Score (0-100)
  - Today's stats (screen time, focus minutes, sessions)
  - Streak counter
  - Weekly chart
  - Category breakdown
  - Top apps
- ✅ Real data (not zeros if device has activity)

---

### **Test 5.2: Student Focus Mode**

**Steps:**
1. Navigate to `/student/focus`
2. Select preset (e.g., 25 min Pomodoro)
3. Click "Start Focus"
4. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/focus/self-start` → Status `200`
- ✅ Timer starts counting down
- ✅ Focus session created in database
- ✅ Only study apps allowed during focus

---

### **Test 5.3: Student Achievements**

**Steps:**
1. Navigate to `/student/achievements`
2. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/badges/device/{id}` → Status `200`
- ✅ Badge grid displays
- ✅ XP progress bar shows
- ✅ Recently earned badges (if any)
- ✅ Category filters work

---

## 📋 PHASE 6: INSTITUTE FEATURES

### **Test 6.1: Institute Dashboard**

**Steps:**
1. Login as `admin@demo.com` / `demo123`
2. Navigate to `/institute`
3. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/dashboard/institute` → Status `200`
- ✅ Dashboard displays:
  - Compliance score
  - Device counts (online/offline/paused/focus)
  - Blocked attempts today
  - Device table with all devices
  - Top apps institute-wide

---

### **Test 6.2: Institute - Bulk Actions**

**Steps:**
1. On institute dashboard, select multiple devices (checkboxes)
2. Click "Pause All" or "Resume All"
3. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/devices/bulk-action` → Status `200`
- ✅ Selected devices update status
- ✅ Success message shows: "X devices updated"

---

## 📋 PHASE 7: ADVANCED FEATURES

### **Test 7.1: AI Insights**

**Steps:**
1. Navigate to `/parent/insights`
2. Select a device
3. Click "Refresh Insights" (if available)
4. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/insights/device/{id}` → Status `200`
- ✅ Insight cards display:
  - Weekly summary
  - Risk level
  - Positive tags
  - Actionable insights
- ✅ If refreshing: `POST /api/v1/insights/device/{id}/refresh` → Status `200`

---

### **Test 7.2: Goals Management**

**Steps:**
1. Navigate to `/parent/goals`
2. Click "Create Goal"
3. Fill form (e.g., "Focus Time", target: 60 min, daily)
4. Click "Create"
5. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `POST /api/v1/goals` → Status `201`
- ✅ Goal appears in list
- ✅ Progress tracking works
- ✅ Goal saved in database

---

### **Test 7.3: Subscription Page**

**Steps:**
1. Navigate to `/parent/subscription`
2. Open Network tab

**Expected Results:**
- ✅ Network tab shows: `GET /api/v1/subscription/current` → Status `200`
- ✅ Current plan displays
- ✅ Plan features show
- ✅ Device usage shows
- ✅ Upgrade/downgrade options (if applicable)

---

## 🐛 COMMON ISSUES & DEBUGGING

### **Issue: 401 Unauthorized on all requests**

**Check:**
1. LocalStorage has `kavach_access_token`?
2. Token is not expired?
3. Backend JWT secret matches?
4. CORS allows frontend origin?

**Fix:**
- Re-login to get fresh token
- Check backend logs for JWT validation errors

---

### **Issue: 500 Internal Server Error**

**Check:**
1. Backend logs for stack trace
2. Database connection is working?
3. Required data exists (devices, users, etc.)?

**Fix:**
- Check backend console for errors
- Verify database migrations ran
- Check seed data exists

---

### **Issue: Empty data / No devices showing**

**Check:**
1. Database has devices linked to tenant?
2. Devices are `active = true`?
3. User's tenant_id matches device tenant_id?

**Fix:**
- Run seed migrations: `V2__seed_demo_data.sql`
- Check `devices` table in database
- Verify tenant_id matches

---

### **Issue: Charts not loading**

**Check:**
1. Activity logs exist for selected device?
2. Date ranges are valid?
3. Reports API returns data?

**Fix:**
- Check `activity_logs` table has data
- Verify device_id is correct
- Check date format in API calls

---

## ✅ TESTING CHECKLIST

### **Authentication:**
- [ ] Login works for all 3 roles
- [ ] JWT token stored in LocalStorage
- [ ] Token persists on page refresh
- [ ] Logout clears tokens
- [ ] Protected routes redirect to login when not authenticated

### **Parent Features:**
- [ ] Dashboard loads with real data
- [ ] Devices page lists devices
- [ ] Link device works
- [ ] Pause/Resume device works
- [ ] Start focus mode works
- [ ] Reports page shows charts
- [ ] Alerts page shows rules
- [ ] Create alert rule works
- [ ] Blocking page shows rules
- [ ] Create block rule works
- [ ] Insights page loads
- [ ] Goals page works
- [ ] Subscription page loads

### **Student Features:**
- [ ] Student dashboard loads
- [ ] Focus mode starts/stops
- [ ] Achievements page loads

### **Institute Features:**
- [ ] Institute dashboard loads
- [ ] Bulk actions work

### **Data Persistence:**
- [ ] All POST requests save to database
- [ ] All PUT requests update database
- [ ] All DELETE requests remove from database
- [ ] Data persists after page refresh

---

## 🚀 QUICK START TESTING

**Minimum Viable Test (5 minutes):**

1. **Login:** `parent@demo.com` / `demo123`
2. **Check Dashboard:** Should show real device stats
3. **Check Devices:** Should list at least 1 device
4. **Check Reports:** Should show charts (may be empty if no activity)
5. **Check Network Tab:** All requests should be 200 (not 401)

**If all 5 pass → Core functionality is working!**

---

## 📊 TESTING METRICS

**Success Criteria:**
- ✅ 0 authentication errors (401)
- ✅ 0 server errors (500)
- ✅ All GET requests return 200
- ✅ All POST/PUT requests return 200/201
- ✅ Data persists in database
- ✅ UI updates reflect database changes

**Failure Criteria:**
- ❌ Any 401 errors (auth broken)
- ❌ Any 500 errors (backend broken)
- ❌ Empty data when data should exist
- ❌ Changes don't persist

---

**Last Updated:** After authentication fix  
**Status:** Ready for E2E testing ✅
