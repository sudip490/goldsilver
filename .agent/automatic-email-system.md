# 🎉 Automatic Email System - Triggered by Price Changes!

## ✅ How It Works Now:

### **Automatic Price Detection & Email Trigger**

1. **Your system fetches prices** (every 5 minutes via `/api/prices`)
2. **System compares** new prices with last saved prices
3. **If prices changed** → Automatically sends emails to ALL users
4. **If prices same** → No emails sent (prevents spam)

---

## 📊 What Happens:

```
Every 5 minutes:
├─ Fetch latest gold/silver prices
├─ Compare with previous prices (stored in data/last-price.json)
├─ If changed:
│  ├─ Calculate price changes
│  ├─ Send emails to ALL users
│  │  ├─ Users WITH portfolios → Full portfolio email
│  │  └─ Users WITHOUT portfolios → Price-only email
│  └─ Save new prices
└─ If unchanged:
   └─ Do nothing (no emails)
```

---

## 🎯 Email Triggers:

### When Emails Are Sent:
- ✅ Gold price changes
- ✅ Silver price changes
- ✅ Either price changes

### When Emails Are NOT Sent:
- ❌ Prices haven't changed
- ❌ First time running (no previous price to compare)

---

## 📧 Two Types of Emails:

### 1. **Portfolio Email** (users with investments)
```
Subject: 📊 Price Update: 📉 Loss NPR 630,055 Today

- Current Gold & Silver Prices
- Total Investment: NPR 1,220,108
- Current Value: NPR 590,054
- Total Profit/Loss: NPR -630,055 (-51.64%)
- Today's Change: +NPR 905 (+0.15%)
```

### 2. **Price-Only Email** (users without portfolios)
```
Subject: 📊 Daily Price Update: Gold NPR 290,000 | Silver NPR 5,300

- Current Gold & Silver Prices
- Call-to-action to start tracking
```

---

## 🔧 Technical Details:

### Price Storage:
- **File**: `data/last-price.json`
- **Content**: 
```json
{
  "gold": 290000,
  "silver": 5300,
  "lastUpdate": "2026-02-10T15:30:00.000Z"
}
```

### Modified Files:
1. **`app/api/prices/route.ts`** - Added automatic price change detection
2. **`lib/email-service.ts`** - Fixed number formatting, added price-only emails
3. **`app/api/send-price-update-all/route.ts`** - Sends to ALL users

---

## 🚀 How to Test:

### Method 1: Wait for Automatic Trigger
1. Just wait - system checks every 5 minutes
2. When prices change, emails sent automatically
3. Check console logs for: `[PRICE CHANGE DETECTED]`

### Method 2: Manual Trigger (Testing)
Visit: `http://localhost:3000/admin/send-emails`
- Click "Send Emails to All Users"
- Instant test without waiting

### Method 3: Force Price Change (Testing)
1. Delete `data/last-price.json`
2. Visit any page (triggers price fetch)
3. Emails will be sent (first time = price change detected)

---

## 📝 Console Logs to Watch:

```bash
# When prices are fetched:
[PRICE CHECK] No previous price data found

# When prices change:
[PRICE CHANGE DETECTED] {
  gold: { old: 289500, new: 290000, change: 500 },
  silver: { old: 5350, new: 5300, change: -50 }
}

# When emails are sent:
[AUTO EMAIL] Sent to 5 users
```

---

## ⚙️ Configuration:

### Change Check Frequency:
In `app/api/prices/route.ts`:
```typescript
export const revalidate = 300; // 300 seconds = 5 minutes
```

Change to:
- `60` = Check every 1 minute
- `600` = Check every 10 minutes
- `1800` = Check every 30 minutes

---

## ✅ Checklist:

- [x] Automatic price change detection
- [x] Email trigger on price change
- [x] Send to users with portfolios
- [x] Send to users without portfolios
- [x] Number formatting fixed
- [x] Prevent duplicate emails
- [x] Store price history
- [ ] Test automatic trigger
- [ ] Monitor first automatic send

---

## 🎊 You're All Set!

**The system now automatically:**
1. ✅ Monitors price changes every 5 minutes
2. ✅ Sends emails ONLY when prices change
3. ✅ Sends to ALL users (with/without portfolios)
4. ✅ Shows clean, formatted numbers
5. ✅ Prevents spam (no emails if prices unchanged)

**No manual intervention needed!** 🚀
