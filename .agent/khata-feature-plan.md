# Khata (Credit/Debit Ledger) Feature Implementation Plan

## Overview
Implement a digital ledger system (Khata) to track money owed to you and money you owe to others, similar to Khatabook and OkCredit apps.

## Research Summary
  Party types: Customer, Supplier, Staff, Personal
- Per-party running balance with color-coded receivable/payable status
- Transaction details: amount, date (backdated), description/purpose, optional notes
- Dashboard totals: "You'll Get" vs "You'll Give"
- Filters: party, date range, type, amount
### Core Concepts from Khatabook/OkCredit:

1. **Transaction Types:**
   - **"You Gave" (Debit/Red):** Money/goods given on credit → Increases what they owe you
   - **"You Got" (Credit/Green):** Payment received → Decreases what they owe you

2. **Khata Types (Party Categories):**
   - **Customers:** People who owe you money (Receivables - "You'll Get")
   - **Suppliers:** People/businesses you owe money to (Payables - "You'll Give")
   - **Staff/Salary:** Employee advances and salaries
   - **Personal:** Friends/family loans

3. **Transaction Information:**
   - Amount
   - Date (with backdating support)
   - Description/Purpose (e.g., "Gold purchase", "Monthly rent", "Invoice #402")
   - Optional: Bill/receipt attachment (photo)
   - Optional: Category/item tags

4. **Key Features:**
   - Dashboard showing total "You'll Give" and "You'll Get"
   - Individual party ledgers with running balance
   - Payment reminders (SMS/WhatsApp)
   - Reports (PDF/Excel statements)
   - Search/filter by name, phone, date range

## Database Schema

### 1. Party/Contact Table
```sql
CREATE TABLE khata_party (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  type TEXT NOT NULL, -- 'customer', 'supplier', 'staff', 'personal'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

### 2. Khata Transaction Table
```sql
CREATE TABLE khata_transaction (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  party_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'gave' (debit), 'got' (credit)
  amount REAL NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  attachment_url TEXT, -- Optional bill/receipt image
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (party_id) REFERENCES khata_party(id) ON DELETE CASCADE
);
```

### 3. Indexes for Performance
```sql
CREATE INDEX idx_khata_party_user ON khata_party(user_id);
CREATE INDEX idx_khata_party_type ON khata_party(type);
CREATE INDEX idx_khata_transaction_user ON khata_transaction(user_id);
CREATE INDEX idx_khata_transaction_party ON khata_transaction(party_id);
CREATE INDEX idx_khata_transaction_date ON khata_transaction(date);
```

## TypeScript Types

```typescript
export type PartyType = 'customer' | 'supplier' | 'staff' | 'personal';
export type TransactionType = 'gave' | 'got';

export interface KhataParty {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  type: PartyType;
  notes?: string;
  balance?: number; // Calculated field
  createdAt: Date;
  updatedAt: Date;
}

export interface KhataTransaction {
  id: string;
  userId: string;
  partyId: string;
  type: TransactionType;
  amount: number;
  date: Date;
  description: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  partyName?: string; // For display purposes
}

export interface KhataBalance {
  totalReceivable: number; // Total "You'll Get"
  totalPayable: number;    // Total "You'll Give"
  netBalance: number;      // Receivable - Payable
}
```

## API Routes

### 1. `/api/khata/parties` - Party Management
- **GET**: List all parties with balances
- **POST**: Create new party
- **PATCH**: Update party details
- **DELETE**: Delete party (cascade delete transactions)

### 2. `/api/khata/parties/[id]` - Single Party
- **GET**: Get party details with transaction history

### 3. `/api/khata/transactions` - Transaction Management
- **GET**: List all transactions (with filters)
- **POST**: Create new transaction
- **PATCH**: Update transaction
- **DELETE**: Delete transaction

### 4. `/api/khata/dashboard` - Dashboard Summary
- **GET**: Get overall balance summary

### 5. `/api/khata/reports/[partyId]` - Generate Reports
- **GET**: Generate PDF/CSV statement for a party

## UI Components

### 1. Khata Dashboard (`/khata`)
- Summary cards:
  - Total "You'll Get" (Receivables) - Green
  - Total "You'll Give" (Payables) - Red
  - Net Balance
- Tabs for party types: All | Customers | Suppliers | Staff | Personal
- Party list with:
  - Name, phone
  - Current balance (color-coded: green if they owe you, red if you owe them)
  - Last transaction date
  - Quick action buttons (Add Transaction, View Details)
- Search/filter bar
- "Add Party" button

### 2. Party Details Page (`/khata/[partyId]`)
- Party information header
- Balance summary card
- Transaction history (chronological, newest first)
- Each transaction shows:
  - Date
  - Type (Gave/Got) with color coding
  - Amount
  - Description
  - Running balance
- "Add Transaction" button
- "Send Reminder" button
- "Generate Statement" button

### 3. Add/Edit Party Form
- Name (required)
- Phone number
- Email
- Type (dropdown: Customer, Supplier, Staff, Personal)
- Notes

### 4. Add Transaction Form
- Party selection (searchable dropdown)
- Type: "You Gave" or "You Got" (toggle/radio)
- Amount (required)
- Date (with date picker, default: today)
- Description/Purpose (required)
- Notes (optional)
- Attach Bill (optional - file upload)

### 5. Transaction List Component
- Filterable by:
  - Date range
  - Party
  - Transaction type
  - Amount range
- Sortable columns
- Export to CSV/PDF

## Color Coding System

```css
/* Receivables (They owe you) - Green */
.receivable {
  color: #16a34a; /* green-600 */
  background: #dcfce7; /* green-100 */
}

/* Payables (You owe them) - Red */
.payable {
  color: #dc2626; /* red-600 */
  background: #fee2e2; /* red-100 */
}

/* "You Gave" transactions - Red/Orange */
.gave {
  color: #ea580c; /* orange-600 */
}

/* "You Got" transactions - Green */
.got {
  color: #16a34a; /* green-600 */
}
```

## Calculation Logic

### Balance Calculation for a Party:
```typescript
function calculatePartyBalance(transactions: KhataTransaction[]): number {
  return transactions.reduce((balance, tx) => {
    if (tx.type === 'gave') {
      return balance + tx.amount; // They owe you more
    } else {
      return balance - tx.amount; // They owe you less
    }
  }, 0);
}

// Positive balance = They owe you (Receivable)
// Negative balance = You owe them (Payable)
```

### Dashboard Summary:
```typescript
function calculateDashboardSummary(parties: KhataParty[]): KhataBalance {
  const receivable = parties
    .filter(p => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);
  
  const payable = parties
    .filter(p => p.balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);
  
  return {
    totalReceivable: receivable,
    totalPayable: payable,
    netBalance: receivable - payable
  };
}
```

## Implementation Steps

### Phase 1: Database & Backend
1. Create Drizzle schema for `khata_party` and `khata_transaction`
2. Generate and run migrations
3. Implement API routes for parties
4. Implement API routes for transactions
5. Add balance calculation logic

### Phase 2: UI Components
1. Create Khata dashboard page
2. Create party list component
3. Create add/edit party form
4. Create add transaction form
5. Create party details page with transaction history

### Phase 3: Features
1. Add search and filter functionality
2. Implement export to CSV/PDF
3. Add payment reminder system (optional)
4. Add bill/receipt attachment support
5. Add statistics and charts

### Phase 4: Polish
1. Add loading states and skeletons
2. Add error handling and validation
3. Add confirmation dialogs for delete actions
4. Optimize performance with pagination
5. Add mobile responsiveness

## Navigation Integration

Add to header/sidebar:
```tsx
<Link href="/khata">
  <BookOpen className="h-4 w-4" />
  Khata Book
</Link>
```

## Mobile Considerations

- Use drawer/sheet for forms on mobile
- Implement pull-to-refresh
- Add floating action button for quick "Add Transaction"
- Use bottom sheet for party selection
- Optimize list rendering with virtualization for large datasets

## Security Considerations

1. All API routes must verify user authentication
2. Ensure users can only access their own khata data
3. Validate all inputs (amounts, dates, etc.)
4. Sanitize file uploads for attachments
5. Implement rate limiting for reminder features

## Future Enhancements

1. WhatsApp/SMS reminder integration
2. Multi-currency support
3. Recurring transactions (monthly rent, etc.)
4. Settlement tracking (partial payments)
5. Business analytics and insights
6. QR code for quick payments
7. Integration with portfolio transactions
8. Backup and restore functionality
