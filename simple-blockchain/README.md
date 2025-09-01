# 🚀 Simple Pharbit Blockchain

A lightweight blockchain implementation that works without Docker or complex setup.

## 🎯 Features

- ✅ **No Docker Required** - Works in any environment
- ✅ **Web Interface** - Beautiful UI for creating transactions
- ✅ **Command Line** - Simple CLI for transactions
- ✅ **Block Creation** - Each transaction creates a new block
- ✅ **Account Management** - Track balances and transactions
- ✅ **Transaction History** - View all transactions

## 🚀 Quick Start

### Option 1: Web Interface (Recommended)
```bash
cd simple-blockchain
./launch.sh
# Choose option 1
```

### Option 2: Command Line
```bash
cd simple-blockchain
node process-transaction.js "0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b" "6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR" "10"
```

### Option 3: Direct Web Access
Open `simple-blockchain/web-interface.html` in your browser.

## 📁 File Structure

```
simple-blockchain/
├── blocks/              # Blockchain blocks
├── transactions/        # Transaction records
├── accounts/           # Account balances
├── process-transaction.js  # Transaction processor
├── web-interface.html  # Web interface
├── launch.sh          # Launcher script
└── README.md          # This file
```

## 🎯 Your Transaction Details

- **Sender:** `0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b`
- **Receiver:** `6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR`
- **Amount:** `10`

## 📊 How It Works

1. **Transaction Creation**: Enter sender, receiver, and amount
2. **Validation**: Check account balances and validity
3. **Processing**: Update account balances
4. **Block Creation**: Create a new block with transaction
5. **Storage**: Save transaction and block to files

## 🎉 Success Indicators

✅ **Transaction Created** - New transaction record saved  
✅ **Block Generated** - New block added to blockchain  
✅ **Balances Updated** - Account balances reflect changes  
✅ **History Tracked** - Transaction history maintained  

## 🚀 Next Steps

1. **Create more transactions** with different amounts
2. **Add more accounts** to the system
3. **View transaction history** in the web interface
4. **Explore the blockchain** structure

---

**Your simple blockchain is ready to use! 🎉**
