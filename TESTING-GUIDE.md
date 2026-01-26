# 🧪 Testing Guide - Multi-User Demo System

Complete testing checklist for the multi-user demo implementation.

---

## Pre-Deployment Tests (Local)

### 1. Database Migration ✅

```bash
# Apply migration to local database
cd /path/to/monorepo-duo-demo-app
wrangler d1 execute demo-app-dev --local --file=./migration-demo-session.sql

# Verify columns exist
wrangler d1 execute demo-app-dev --local --command "PRAGMA table_info(orders);"
wrangler d1 execute demo-app-dev --local --command "PRAGMA table_info(reviews);"

# Should show demo_session_id column in output
```

### 2. TypeScript Compilation ✅

```bash
cd frontend
npm run build

# Should complete without errors
```

### 3. Local Development Server ✅

```bash
cd frontend
npm run dev

# Open http://localhost:3000
# Should see ModeSelector page
```

---

## Functional Tests

### Test Suite 1: Mode Selection & Session Creation

**Objective**: Verify demo session is created correctly

**Steps**:
1. Open http://localhost:3000 in browser
2. Open DevTools → Application → Local Storage
3. Verify no `demo-session-id` key exists yet
4. Click "Ouvrir la démo simple"
5. Check Local Storage again
6. ✅ `demo-session-id` should now exist with UUID format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)

**Expected Result**: UUID generated and stored in localStorage

---

### Test Suite 2: Return Button Navigation

**Objective**: Verify return button clears session and returns to mode selector

**Steps**:
1. Select any demo mode
2. Note the UUID in localStorage
3. Navigate to any page (e.g., /cart)
4. Look for RotateCcw button in top navbar
5. Click the return button
6. Check localStorage → demo-session-id should be removed
7. Verify redirected to ModeSelector page

**Expected Result**: Session cleared, redirected to mode selection

---

### Test Suite 3: Session Isolation - Orders

**Objective**: Verify orders are isolated by session

**Steps**:

**Window 1 (Incognito)**:
1. Open http://localhost:3000
2. Select "Démo Simple"
3. Add product to cart
4. Go to checkout
5. Fill address: "10 Rue de Test, 75001, Paris"
6. Submit order
7. Note the `demo-session-id` from localStorage: `SESSION_A`

**Window 2 (New Incognito)**:
1. Open http://localhost:3000 in NEW incognito window
2. Select "Démo Advanced"
3. Note the `demo-session-id` from localStorage: `SESSION_B`
4. Verify SESSION_A ≠ SESSION_B
5. Try to access admin (should work in demo mode)
6. Go to Admin → Commandes
7. ✅ Should NOT see the order from Window 1

**Expected Result**: Each session sees only its own orders

---

### Test Suite 4: Session Isolation - Reviews

**Objective**: Verify reviews are isolated by session

**Steps**:

**Window 1**:
1. Open demo mode
2. Go to /reviews
3. Click "Donner un avis"
4. Submit: "Test review from session A"
5. Note session ID: `SESSION_A`

**Window 2**:
1. Open demo mode in new incognito window
2. Go to /reviews
3. ✅ Should NOT see "Test review from session A"
4. Submit: "Test review from session B"
5. Refresh page
6. ✅ Should only see "Test review from session B"

**Expected Result**: Reviews isolated per session

---

### Test Suite 5: Admin Access in Demo Mode

**Objective**: Verify admin panel accessible without Telegram auth

**Steps**:
1. Open http://localhost:3000 (no Telegram WebApp)
2. Select any demo mode
3. Look for admin shield button (red button in header)
4. Click admin button
5. ✅ Should access /admin without being redirected to login
6. Try to:
   - View orders → Should work
   - Create product → Should work
   - Edit settings → Should work

**Expected Result**: Full admin access in demo mode

---

### Test Suite 6: Data Persistence Across Navigation

**Objective**: Verify session persists during navigation

**Steps**:
1. Select demo mode
2. Note session ID: `SESSION_X`
3. Create an order
4. Navigate to /reviews
5. Navigate to /admin
6. Navigate back to /
7. Check localStorage
8. ✅ Session ID should still be `SESSION_X`
9. Go to Admin → Commandes
10. ✅ Should still see your order

**Expected Result**: Session persists, data remains accessible

---

### Test Suite 7: CSS Title Fix

**Objective**: Verify title displays correctly

**Steps**:
1. Open http://localhost:3000
2. Look at title "Quelle démo veux-tu voir ?"
3. ✅ Should display on 1-2 lines maximum (not breaking every word)
4. Resize browser window
5. ✅ Title should reflow gracefully with text-balance

**Expected Result**: Title looks good at all viewport sizes

---

## API Tests

### Test 1: Orders API with Session Header

```bash
# Create demo session manually
SESSION_ID="test-session-$(uuidgen)"

# Create order with session
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "x-demo-session-id: $SESSION_ID" \
  -d '{
    "items": [{"product_id": "test", "name": "Test", "quantity": 1, "price": 1000}],
    "total": 1000,
    "currency": "EUR",
    "delivery_address": "Test Address"
  }'

# Fetch orders with same session
curl -X GET "http://localhost:3000/api/orders" \
  -H "x-demo-session-id: $SESSION_ID"

# Should return the created order

# Fetch orders with different session
curl -X GET "http://localhost:3000/api/orders" \
  -H "x-demo-session-id: different-session-id"

# Should return empty array or different orders
```

### Test 2: Reviews API with Session Header

```bash
SESSION_ID="test-session-$(uuidgen)"

# Create review
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -H "x-demo-session-id: $SESSION_ID" \
  -d '{
    "rating": 5,
    "content": "Test review from API"
  }'

# Fetch reviews with session
curl -X GET "http://localhost:3000/api/reviews?status=published" \
  -H "x-demo-session-id: $SESSION_ID"
```

---

## Production Deployment Tests

### Post-Deploy Checklist

After deploying to production:

**1. Database Migration**
```bash
wrangler d1 execute demo-app-prod --file=./migration-demo-session.sql
```

**2. URL Access**
- [ ] Visit https://monorepo-duo-demo-app.vercel.app
- [ ] Verify ModeSelector page loads
- [ ] No console errors

**3. Mode Selection**
- [ ] Click "Démo Simple" → redirects to catalog
- [ ] Return button works → back to mode selector
- [ ] Click "Démo Advanced" → redirects to catalog with advanced features

**4. Session Isolation (Production)**
- [ ] Open 2 different browsers (Chrome + Firefox)
- [ ] Each selects different mode
- [ ] Create order in each
- [ ] Verify isolation via admin panel

**5. Admin Access**
- [ ] Demo mode allows admin access (shield button visible)
- [ ] Can view orders filtered by session
- [ ] Can create products (isolated per session)

**6. Performance**
- [ ] Page load time < 2s
- [ ] No layout shifts
- [ ] Smooth animations

**7. Mobile (Telegram WebApp)**
- [ ] Open in Telegram Mini App
- [ ] Mode selector works
- [ ] Navigation smooth
- [ ] Return button accessible

---

## Performance Benchmarks

### Expected Metrics

| Metric | Target | Measured |
|--------|--------|----------|
| Initial page load | < 2s | ___ |
| UUID generation | < 1ms | ___ |
| Mode selection redirect | < 500ms | ___ |
| Return button action | < 300ms | ___ |
| API with session header | < 200ms overhead | ___ |

### Monitoring Queries

```sql
-- Count demo sessions
SELECT COUNT(DISTINCT demo_session_id) as total_demo_sessions
FROM orders
WHERE demo_session_id IS NOT NULL;

-- Demo orders by date
SELECT DATE(created_at) as date, COUNT(*) as count
FROM orders
WHERE demo_session_id IS NOT NULL
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Oldest demo data
SELECT MIN(created_at) as oldest_demo_order
FROM orders
WHERE demo_session_id IS NOT NULL;
```

---

## Regression Tests

### Existing Features

Verify existing features still work:

- [ ] Normal Telegram auth flow (non-demo)
- [ ] Product catalog display
- [ ] Cart functionality
- [ ] Checkout flow
- [ ] Admin login (non-demo)
- [ ] Product CRUD
- [ ] Order management
- [ ] Settings persistence

---

## Known Limitations

1. **Data Cleanup**: Demo sessions accumulate. Manual cleanup required.
2. **No Session Expiry**: Sessions persist indefinitely in localStorage
3. **No Rate Limiting**: Can create unlimited demo sessions
4. **Telegram Message**: Demo orders still try to send Telegram messages (will fail gracefully)

---

## Troubleshooting

### Issue: Return button doesn't clear session

**Solution**:
1. Check DevTools console for errors
2. Verify `clearMode()` and `clearDemoSession()` are called
3. Check localStorage manually and clear if stuck

### Issue: Orders not isolated

**Solution**:
1. Verify migration ran: `PRAGMA table_info(orders);`
2. Check API logs for `demo_session_id` in queries
3. Verify header is sent: Network tab → Request Headers

### Issue: Admin access denied in demo

**Solution**:
1. Check `hasDemoSession` variable in admin/layout.tsx
2. Verify localStorage has `demo-session-id`
3. Check console for auth errors

---

## Sign-Off Checklist

Before marking as complete:

- [ ] All functional tests pass
- [ ] API tests successful
- [ ] Production deployment verified
- [ ] Session isolation confirmed
- [ ] CSS fix confirmed
- [ ] Return button works
- [ ] Admin access works in demo
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Documentation updated
- [ ] Client setup guide tested

---

**Testing Status**: Ready for QA 🚀
**Last Updated**: 2026-01-26
