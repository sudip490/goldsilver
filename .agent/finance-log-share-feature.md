# Finance Log Share Feature

## Overview
The Finance Log Share feature allows you to send read-only account statements to your parties (customers, suppliers, friends, etc.) via a secure shareable link. Recipients can view their balance and transaction history without needing to log in or having the ability to edit anything.

## How It Works

### 1. **Generate Share Link**
- Go to Finance Log → Select a party
- Click the **Share** button (📤 icon) in the top right
- A unique, secure link will be generated and automatically copied to your clipboard
- Share this link via:
  - Email
  - WhatsApp
  - SMS
  - Any messaging app

### 2. **What Recipients See**
When someone clicks the link, they see:
- **Party Name** - Their name as saved in your records
- **Current Balance** - How much they owe or are owed
- **Transaction History** - Complete list of all transactions
  - Date and time
  - Description
  - Amount (Paid/Received)
  - Notes (if any)

### 3. **Security Features**
- ✅ **Unique Token** - Each link has a unique 64-character token
- ✅ **Read-Only** - Recipients cannot edit, add, or delete anything
- ✅ **No Login Required** - Simple access for recipients
- ✅ **30-Day Expiry** - Links automatically expire after 30 days
- ✅ **Regenerate Anytime** - You can generate a new link anytime

## Database Schema

### New Fields Added to `khata_party` table:
```sql
share_token TEXT              -- Unique token for sharing
share_token_created_at TIMESTAMP  -- When the token was created
```

## API Endpoints

### 1. Generate Share Link
```
POST /api/finance-log/share
Body: { "partyId": "party_id_here" }
Response: { "shareUrl": "https://yourapp.com/finance-log/view/token", "shareToken": "..." }
```

### 2. View Shared Statement (Public - No Auth Required)
```
GET /api/finance-log/view/[token]
Response: { "party": {...}, "transactions": [...] }
```

## Usage Example

### For You (Business Owner):
1. Customer asks: "How much do I owe you?"
2. Go to Finance Log → Select customer
3. Click Share button
4. Send the link via WhatsApp: "Hi! Here's your account statement: [link]"

### For Your Customer:
1. Clicks the link
2. Sees their current balance: "You need to pay NPR 5,000"
3. Views all transactions with dates and descriptions
4. Can take a screenshot or save for their records

## Benefits

✅ **Transparency** - Customers can verify their balance anytime
✅ **Reduces Disputes** - Clear transaction history prevents misunderstandings
✅ **Professional** - Shows you're organized and transparent
✅ **Time-Saving** - No need to manually create statements
✅ **Accessible** - Works on any device, no app installation needed

## Migration Required

Run this SQL migration to add the necessary fields:

```bash
# Apply migration
psql -d your_database -f migrations/add_share_token_to_khata_party.sql
```

Or manually:
```sql
ALTER TABLE khata_party ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE khata_party ADD COLUMN IF NOT EXISTS share_token_created_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_khata_party_share_token ON khata_party(share_token);
```

## Future Enhancements (Optional)

- 📧 **Email Integration** - Send link directly via email from the app
- 📱 **WhatsApp Integration** - One-click share to WhatsApp
- 📊 **PDF Export** - Generate PDF statement from the shared view
- 🔔 **Notifications** - Notify you when someone views their statement
- ⏰ **Custom Expiry** - Set custom expiration time for links
- 🔐 **Password Protection** - Add optional password for sensitive accounts

## Notes

- Links are valid for 30 days by default
- You can regenerate a link anytime (old link becomes invalid)
- Recipients don't need to create an account
- The view is completely read-only - no editing possible
- Works on all devices (mobile, tablet, desktop)
