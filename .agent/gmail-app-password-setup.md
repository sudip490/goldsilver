# 🔐 Gmail App Password Setup Guide

## ⚠️ Error: "Username and Password not accepted"

Gmail no longer accepts regular passwords for SMTP. You **MUST** use an **App Password**.

---

## 📋 Step-by-Step Setup:

### Step 1: Enable 2-Factor Authentication (2FA)

1. **Login to Gmail**: `goldsilvertracker.info@gmail.com`
2. **Go to Security Settings**: https://myaccount.google.com/security
3. **Enable 2-Step Verification**:
   - Click "2-Step Verification"
   - Follow the setup wizard
   - Use your phone number for verification

### Step 2: Generate App Password

1. **Go to App Passwords**: https://myaccount.google.com/apppasswords
   - (You must have 2FA enabled first)
2. **Select App**: Choose **"Mail"**
3. **Select Device**: Choose **"Other (Custom name)"**
4. **Enter Name**: Type `"Gold Silver Tracker"`
5. **Click Generate**
6. **Copy the Password**: You'll get a 16-character password like:
   ```
   abcd efgh ijkl mnop
   ```
   **Important**: Copy it WITHOUT spaces: `abcdefghijklmnop`

### Step 3: Update the Code

Open: `lib/email-service.ts`

Replace this line:
```typescript
const EMAIL_PASS = 'subash@123###';
```

With your app password:
```typescript
const EMAIL_PASS = 'abcdefghijklmnop'; // Your 16-char app password
```

### Step 4: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test Again

Visit: `http://localhost:3000/admin/send-emails`

Click "Send Emails to All Users" - it should work now! ✅

---

## 🔍 Troubleshooting:

### "App Passwords option not available"
- Make sure 2FA is enabled first
- Wait a few minutes after enabling 2FA
- Try logging out and back in

### "Still getting authentication error"
- Double-check you copied the app password correctly
- Make sure there are NO spaces in the password
- Restart your dev server after changing the code

### "Less secure app access"
- This is deprecated - don't use it
- Always use App Passwords instead

---

## 📧 Alternative: Use Environment Variables (Recommended)

Instead of hardcoding the password, use environment variables:

1. **Create `.env.local` file**:
```env
EMAIL_USER=goldsilvertracker.info@gmail.com
EMAIL_PASS=your_16_char_app_password_here
```

2. **Update `lib/email-service.ts`**:
```typescript
const EMAIL_USER = process.env.EMAIL_USER || 'goldsilvertracker.info@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
```

3. **Restart server** to load new env variables

---

## ✅ Once Working:

You should see:
```
Email sent successfully: <message-id>
```

Instead of:
```
Error sending email: Invalid login
```

---

## 📞 Need Help?

If still having issues:
1. Check Gmail account is not locked
2. Verify 2FA is enabled
3. Generate a NEW app password
4. Make sure you're using the correct Gmail account
