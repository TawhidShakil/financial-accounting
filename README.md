# 📊 Accounting Management System

A comprehensive web-based accounting application built with React that provides essential bookkeeping functionality for small to medium businesses. Features double-entry bookkeeping, hierarchical account management, and real-time financial reporting.

## ✨ Features

### 📝 Transaction Management
- **Journal Entries** - Create compound journal entries with multiple debits and credits
- **Receipt Management** - Record incoming payments with categorized account selection
- **Payment Tracking** - Manage outgoing payments with expense categorization
- **Real-time Balance Calculation** - Automatic opening balance display for informed decision making

### 📊 Financial Reporting
- **General Ledger** - Complete transaction history with running balances
- **Trial Balance** - Automated trial balance generation with date filtering
- **Account-wise Filtering** - Drill down into specific account transactions
- **Export Functionality** - Generate PDF and Excel reports

### 🏗️ Account Management
- **Hierarchical Account Structure** - Organized categories (Assets, Liabilities, Expenses, Revenue, Capital)
- **Dynamic Account Creation** - Add new accounts under any category on-the-fly
- **Smart Account Selection** - Keyboard navigation and search functionality
- **Bank Management** - Add and manage multiple bank accounts

### 💾 Data Management
- **Local Storage** - Client-side data persistence
- **Data Migration** - Automatic migration between storage formats
- **Import/Export** - Backup and restore functionality

## 🛠️ Technology Stack

- **Frontend**: React 18, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons, Lucide React
- **Routing**: React Router
- **Reports**: jsPDF, xlsx
- **Storage**: Browser LocalStorage

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/TawhidShakil/financial-accounting.git
# Navigate to project directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```shellscript
# Create production build
npm run build

# Serve production build locally
npm run serve
```

## Usage

### Getting Started

1. **Set Up Accounts**: Configure your chart of accounts using the hierarchical structure
2. **Record Transactions**: Use Journal, Receipt, or Payment forms based on transaction type
3. **View Reports**: Access Trial Balance, General Ledger, Income Statement, and Balance Sheet for financial insights
4. **Export Data**: Generate PDF or Excel reports for external use


### Transaction Types

- **Journal Entries**: For complex transactions with multiple accounts
- **Receipts**: For recording incoming payments and revenue
- **Payments**: For recording outgoing payments and expenses


### Keyboard Shortcuts

- `Enter` - Navigate to next field
- `Double Enter` - Open account dropdown
- `Escape` - Close dropdowns
- `Arrow Keys` - Navigate dropdown options
- `Ctrl+Enter` - Move to submit button (in description fields)


## Accounting Features

### Double-Entry Bookkeeping

Every transaction maintains the fundamental accounting equation:

```plaintext
Assets = Liabilities + Equity
```

### Account Categories

- **Assets**: Cash, Bank Accounts, Accounts Receivable, Inventory, Equipment
- **Expenses**: Rent, Salaries, Utilities, Office Supplies, Travel
- **Revenue**: Sales Revenue, Service Revenue, Interest Income
- **Liabilities**: Accounts Payable, Loans, Interest Payable
- **Capital**: Owner's Equity, Retained Earnings


### Financial Reports
- **Trial Balance**: Summarized account balances with debit/credit totals
- **General Ledger**: Detailed transaction history by account
- **Income Statement**: Profit and loss statement showing revenues and expenses
- **Balance Sheet**: Statement of financial position showing assets, liabilities, and equity


### Data Storage

All data is stored locally in the browser's localStorage.


## Key Benefits

- **User-Friendly Interface**: Intuitive design with keyboard shortcuts
- **Real-Time Updates**: Instant balance calculations and report updates
- **Flexible Account Management**: Easy account creation and categorization
- **Professional Reports**: Export-ready financial statements
- **No Backend Required**: Runs entirely in the browser
- **Responsive Design**: Works on desktop, tablet, and mobile devices
