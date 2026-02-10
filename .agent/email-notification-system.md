# 📧 Bulk Email System - Send to All Users

## ✅ System Complete!

### What's Been Built:

1. **Email Service** (`lib/email-service.ts`)
   - Sends personalized emails to each user
   - Beautiful HTML template with gold/silver prices
   - Shows each user's portfolio performance
   - Includes today's profit/loss vs yesterday

2. **Bulk Email API** (`/api/send-price-update-all`)
   - Fetches ALL users from database
   - Calculates each user's portfolio individually
   - Sends personalized email to each user
   - Includes 1-second delay between emails (Gmail rate limit protection)
   - Returns detailed results

3. **Admin Page** (`/admin/send-emails`)
   - Beautiful UI to trigger bulk emails
   - Shows results: Total/Success/Failed counts
   - Lists all recipients and their status

## 🚀 How to Use:

### Option 1: Admin Page (Recommended)
1. Go to: `http://localhost:3000/admin/send-emails`
2. Click "Send Emails to All Users"
3. Confirm the action
4. Wait for results

### Option 2: API Call
```bash
curl -X POST http://localhost:3000/api/send-price-update-all \
  -H "Content-Type: application/json" \
  -d '{
    "goldPrice": 290000,
    "silverPrice": 5300,
    "goldChange": 500,
    "silverChange": -50,
    "goldChangePercent": 0.17,
    "silverChangePercent": -0.93
  }'
```

## 📧 Email Flow:

```
FROM: goldsilvertracker.info@gmail.com
TO: Each user's email from database

For each user:
1. Fetch their portfolio transactions
2. Calculate their metrics:
   - Total Investment
   - Current Value
   - Total Profit/Loss
   - Today's Change (vs yesterday)
3. Send personalized email
4. Wait 1 second (rate limit)
5. Move to next user
```

## 📊 Email Content (Personalized per User):

```
┌─────────────────────────────────────────┐
│   📊 Gold & Silver Price Update         │
│   Monday, February 10, 2026             │
├─────────────────────────────────────────┤
│   💰 Current Prices (Nepal)             │
│   Gold: NPR 290,000 ▲ +500 (+0.17%)    │
│   Silver: NPR 5,300 ▼ -50 (-0.93%)     │
│                                         │
│   📈 YOUR Portfolio Summary             │
│   Total Investment:    NPR 100,000      │
│   Current Value:       NPR 105,000      │
│   Total Profit/Loss:   +NPR 5,000       │
│                                         │
│   🎉 Today's Change                     │
│   +NPR 2,000 (+2.5% from yesterday)    │
└─────────────────────────────────────────┘
```

## ⚠️ Important Notes:

1. **Gmail Limits**: Gmail has sending limits (~500 emails/day for free accounts)
2. **Rate Limiting**: System adds 1-second delay between emails
3. **Only Portfolio Users**: Only sends to users who have portfolio transactions
4. **Email Required**: Skips users without email addresses

## 🔐 Email Credentials:
- **Email**: goldsilvertracker.info@gmail.com
- **Password**: subash@123###
- **Service**: Gmail SMTP

## 🎯 Next Steps:

1. **Test with current users**: Visit `/admin/send-emails`
2. **Set up cron job**: For daily automated emails
3. **Monitor Gmail quota**: Check sending limits
4. **Consider upgrading**: Gmail Workspace for higher limits

## 🔧 Future Enhancements:

- [ ] Add email scheduling (daily at specific time)
- [ ] Add email templates selection
- [ ] Add test email feature (send to yourself first)
- [ ] Add email preview before sending
- [ ] Add unsubscribe option
- [ ] Track email open rates
