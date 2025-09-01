#!/bin/bash

echo "🚀 Simple Pharbit Blockchain Setup (No Docker Required)"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Create a simple blockchain simulation
create_simple_blockchain() {
    print_info "Creating simple blockchain simulation..."
    
    mkdir -p simple-blockchain/{blocks,transactions,accounts}
    
    # Create genesis block
    cat > simple-blockchain/blocks/genesis.json << 'EOF'
{
    "blockNumber": 0,
    "timestamp": "2024-01-15T00:00:00Z",
    "transactions": [],
    "previousHash": "0000000000000000000000000000000000000000000000000000000000000000",
    "hash": "0000000000000000000000000000000000000000000000000000000000000001",
    "nonce": 0
}
EOF

    # Create initial accounts
    cat > simple-blockchain/accounts/accounts.json << 'EOF'
{
    "0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b": {
        "balance": 1000.0,
        "created": "2024-01-15T00:00:00Z"
    },
    "6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR": {
        "balance": 500.0,
        "created": "2024-01-15T00:00:00Z"
    }
}
EOF

    print_status "Simple blockchain structure created!"
}

# Create a simple transaction processor
create_transaction_processor() {
    print_info "Creating transaction processor..."
    
    cat > simple-blockchain/process-transaction.js << 'EOF'
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

class SimpleBlockchain {
    constructor() {
        this.blocksDir = path.join(__dirname, 'blocks');
        this.transactionsDir = path.join(__dirname, 'transactions');
        this.accountsFile = path.join(__dirname, 'accounts', 'accounts.json');
        this.loadAccounts();
    }

    loadAccounts() {
        try {
            const data = fs.readFileSync(this.accountsFile, 'utf8');
            this.accounts = JSON.parse(data);
        } catch (error) {
            this.accounts = {};
        }
    }

    saveAccounts() {
        fs.writeFileSync(this.accountsFile, JSON.stringify(this.accounts, null, 2));
    }

    createTransaction(sender, receiver, amount) {
        // Validate transaction
        if (!this.accounts[sender]) {
            throw new Error(`Sender account ${sender} does not exist`);
        }
        if (this.accounts[sender].balance < amount) {
            throw new Error(`Insufficient balance. Sender has ${this.accounts[sender].balance}, trying to send ${amount}`);
        }

        // Create transaction
        const transaction = {
            id: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sender: sender,
            receiver: receiver,
            amount: amount,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Process transaction
        this.accounts[sender].balance -= amount;
        if (!this.accounts[receiver]) {
            this.accounts[receiver] = { balance: 0, created: new Date().toISOString() };
        }
        this.accounts[receiver].balance += amount;

        // Save transaction
        const transactionFile = path.join(this.transactionsDir, `${transaction.id}.json`);
        fs.writeFileSync(transactionFile, JSON.stringify(transaction, null, 2));

        // Create block
        this.createBlock(transaction);

        // Save updated accounts
        this.saveAccounts();

        transaction.status = 'completed';
        return transaction;
    }

    createBlock(transaction) {
        const blockNumber = this.getNextBlockNumber();
        const previousBlock = this.getLastBlock();
        
        const block = {
            blockNumber: blockNumber,
            timestamp: new Date().toISOString(),
            transactions: [transaction],
            previousHash: previousBlock ? previousBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000',
            nonce: Math.floor(Math.random() * 1000000)
        };

        // Calculate hash
        block.hash = this.calculateHash(block);

        // Save block
        const blockFile = path.join(this.blocksDir, `block_${blockNumber}.json`);
        fs.writeFileSync(blockFile, JSON.stringify(block, null, 2));

        console.log(`✅ Block ${blockNumber} created with hash: ${block.hash}`);
        return block;
    }

    calculateHash(block) {
        const blockString = JSON.stringify(block, Object.keys(block).sort());
        return crypto.createHash('sha256').update(blockString).digest('hex');
    }

    getNextBlockNumber() {
        const files = fs.readdirSync(this.blocksDir);
        return files.length;
    }

    getLastBlock() {
        const files = fs.readdirSync(this.blocksDir);
        if (files.length <= 1) return null; // Only genesis block exists
        
        const lastBlockFile = files[files.length - 1];
        const data = fs.readFileSync(path.join(this.blocksDir, lastBlockFile), 'utf8');
        return JSON.parse(data);
    }

    getAccountBalance(address) {
        return this.accounts[address] ? this.accounts[address].balance : 0;
    }

    getAllTransactions() {
        const files = fs.readdirSync(this.transactionsDir);
        return files.map(file => {
            const data = fs.readFileSync(path.join(this.transactionsDir, file), 'utf8');
            return JSON.parse(data);
        }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    getAllBlocks() {
        const files = fs.readdirSync(this.blocksDir);
        return files.map(file => {
            const data = fs.readFileSync(path.join(this.blocksDir, file), 'utf8');
            return JSON.parse(data);
        }).sort((a, b) => a.blockNumber - b.blockNumber);
    }
}

// Export for use in other files
module.exports = SimpleBlockchain;

// If run directly, process command line arguments
if (require.main === module) {
    const blockchain = new SimpleBlockchain();
    
    const args = process.argv.slice(2);
    if (args.length === 3) {
        const [sender, receiver, amount] = args;
        try {
            const transaction = blockchain.createTransaction(sender, receiver, parseFloat(amount));
            console.log('✅ Transaction completed successfully!');
            console.log('Transaction ID:', transaction.id);
            console.log('Sender balance:', blockchain.getAccountBalance(sender));
            console.log('Receiver balance:', blockchain.getAccountBalance(receiver));
        } catch (error) {
            console.error('❌ Transaction failed:', error.message);
        }
    } else {
        console.log('Usage: node process-transaction.js <sender> <receiver> <amount>');
        console.log('Example: node process-transaction.js 0x1234... 0x5678... 10');
    }
}
EOF

    print_status "Transaction processor created!"
}

# Create a simple web interface
create_web_interface() {
    print_info "Creating web interface..."
    
    cat > simple-blockchain/web-interface.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Pharbit Blockchain</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .content {
            padding: 40px;
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }

        input[type="text"], input[type="number"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }

        input[type="text"]:focus, input[type="number"]:focus {
            outline: none;
            border-color: #667eea;
        }

        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            width: 100%;
            margin-top: 20px;
        }

        .btn:hover {
            transform: translateY(-2px);
        }

        .result {
            margin-top: 30px;
            padding: 20px;
            border-radius: 8px;
            display: none;
        }

        .result.success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }

        .result.error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }

        .blockchain-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 30px;
        }

        .info-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
        }

        .info-card h3 {
            margin-bottom: 15px;
            color: #333;
        }

        .transaction-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .transaction-item {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Simple Pharbit Blockchain</h1>
            <p>Create transactions without Docker</p>
        </div>

        <div class="content">
            <form id="transactionForm">
                <div class="form-group">
                    <label for="sender">Sender Address:</label>
                    <input type="text" id="sender" name="sender" placeholder="Enter sender address" required>
                </div>

                <div class="form-group">
                    <label for="receiver">Receiver Address:</label>
                    <input type="text" id="receiver" name="receiver" placeholder="Enter receiver address" required>
                </div>

                <div class="form-group">
                    <label for="amount">Amount:</label>
                    <input type="number" id="amount" name="amount" placeholder="Enter amount" min="0.01" step="0.01" required>
                </div>

                <button type="submit" class="btn" id="submitBtn">
                    🚀 Create Transaction Block
                </button>
            </form>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Processing transaction...</p>
            </div>

            <div class="result" id="result"></div>

            <div class="blockchain-info">
                <div class="info-card">
                    <h3>📊 Account Balances</h3>
                    <div id="balances"></div>
                </div>
                <div class="info-card">
                    <h3>📋 Recent Transactions</h3>
                    <div class="transaction-list" id="transactions"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Simple blockchain simulation
        class SimpleBlockchain {
            constructor() {
                this.accounts = {
                    '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b': { balance: 1000.0 },
                    '6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR': { balance: 500.0 }
                };
                this.transactions = [];
                this.blocks = [];
            }

            createTransaction(sender, receiver, amount) {
                // Validate transaction
                if (!this.accounts[sender]) {
                    throw new Error(`Sender account ${sender} does not exist`);
                }
                if (this.accounts[sender].balance < amount) {
                    throw new Error(`Insufficient balance. Sender has ${this.accounts[sender].balance}, trying to send ${amount}`);
                }

                // Process transaction
                this.accounts[sender].balance -= amount;
                if (!this.accounts[receiver]) {
                    this.accounts[receiver] = { balance: 0 };
                }
                this.accounts[receiver].balance += amount;

                // Create transaction record
                const transaction = {
                    id: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    sender: sender,
                    receiver: receiver,
                    amount: amount,
                    timestamp: new Date().toISOString(),
                    status: 'completed'
                };

                this.transactions.push(transaction);

                // Create block
                const block = {
                    blockNumber: this.blocks.length,
                    timestamp: new Date().toISOString(),
                    transactions: [transaction],
                    hash: this.calculateHash(transaction)
                };

                this.blocks.push(block);

                return transaction;
            }

            calculateHash(transaction) {
                const data = JSON.stringify(transaction) + Date.now();
                let hash = 0;
                for (let i = 0; i < data.length; i++) {
                    const char = data.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32-bit integer
                }
                return hash.toString(16);
            }

            getAccountBalance(address) {
                return this.accounts[address] ? this.accounts[address].balance : 0;
            }

            getAllTransactions() {
                return this.transactions;
            }
        }

        const blockchain = new SimpleBlockchain();

        // Auto-fill example values
        document.getElementById('sender').addEventListener('focus', function() {
            if (!this.value) {
                this.value = '0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b';
            }
        });

        document.getElementById('receiver').addEventListener('focus', function() {
            if (!this.value) {
                this.value = '6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR';
            }
        });

        document.getElementById('amount').addEventListener('focus', function() {
            if (!this.value) {
                this.value = '10';
            }
        });

        // Handle form submission
        document.getElementById('transactionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const sender = document.getElementById('sender').value;
            const receiver = document.getElementById('receiver').value;
            const amount = parseFloat(document.getElementById('amount').value);

            // Validate input
            if (!sender || !receiver || !amount) {
                showResult('Please fill in all fields.', 'error');
                return;
            }

            if (amount <= 0) {
                showResult('Amount must be greater than 0.', 'error');
                return;
            }

            if (sender === receiver) {
                showResult('Sender and receiver cannot be the same.', 'error');
                return;
            }

            // Show loading
            showLoading(true);
            showResult('', '');

            // Simulate processing delay
            setTimeout(() => {
                try {
                    const transaction = blockchain.createTransaction(sender, receiver, amount);
                    
                    showResult('✅ Transaction completed successfully! Block created.', 'success');
                    updateBlockchainInfo();
                    
                } catch (error) {
                    showResult(`❌ Transaction failed: ${error.message}`, 'error');
                } finally {
                    showLoading(false);
                }
            }, 2000);
        });

        function showLoading(show) {
            document.getElementById('loading').style.display = show ? 'block' : 'none';
            document.getElementById('submitBtn').disabled = show;
        }

        function showResult(message, type) {
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = message;
            resultDiv.className = `result ${type}`;
            resultDiv.style.display = message ? 'block' : 'none';
        }

        function updateBlockchainInfo() {
            // Update balances
            const balancesDiv = document.getElementById('balances');
            let balancesHtml = '';
            for (const [address, account] of Object.entries(blockchain.accounts)) {
                balancesHtml += `<div><strong>${address.substring(0, 20)}...</strong>: ${account.balance.toFixed(2)}</div>`;
            }
            balancesDiv.innerHTML = balancesHtml;

            // Update transactions
            const transactionsDiv = document.getElementById('transactions');
            const transactions = blockchain.getAllTransactions();
            let transactionsHtml = '';
            transactions.slice(-5).reverse().forEach(tx => {
                transactionsHtml += `
                    <div class="transaction-item">
                        <div><strong>ID:</strong> ${tx.id}</div>
                        <div><strong>From:</strong> ${tx.sender.substring(0, 20)}...</div>
                        <div><strong>To:</strong> ${tx.receiver.substring(0, 20)}...</div>
                        <div><strong>Amount:</strong> ${tx.amount}</div>
                        <div><strong>Status:</strong> ${tx.status}</div>
                    </div>
                `;
            });
            transactionsDiv.innerHTML = transactionsHtml;
        }

        // Initialize blockchain info
        updateBlockchainInfo();
    </script>
</body>
</html>
EOF

    print_status "Web interface created!"
}

# Create a launcher script
create_launcher() {
    print_info "Creating launcher script..."
    
    cat > simple-blockchain/launch.sh << 'EOF'
#!/bin/bash

echo "🚀 Simple Pharbit Blockchain Launcher"
echo "====================================="
echo ""

echo "Choose your option:"
echo "1. 🌐 Open Web Interface"
echo "2. 💻 Command Line Transaction"
echo "3. 📊 View Blockchain Status"
echo "4. 🚪 Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🌐 Opening web interface..."
        echo "The web interface will open in your browser."
        echo "If it doesn't open automatically, manually open: simple-blockchain/web-interface.html"
        
        # Try to open the web interface
        if command -v xdg-open > /dev/null; then
            xdg-open simple-blockchain/web-interface.html
        elif command -v open > /dev/null; then
            open simple-blockchain/web-interface.html
        elif command -v start > /dev/null; then
            start simple-blockchain/web-interface.html
        else
            echo "Please manually open: simple-blockchain/web-interface.html"
        fi
        ;;
    2)
        echo "💻 Command Line Transaction"
        echo "=========================="
        echo ""
        read -p "Enter sender address: " sender
        read -p "Enter receiver address: " receiver
        read -p "Enter amount: " amount
        
        echo ""
        echo "Processing transaction..."
        node process-transaction.js "$sender" "$receiver" "$amount"
        ;;
    3)
        echo "📊 Blockchain Status"
        echo "==================="
        echo ""
        echo "Blocks: $(ls -1 blocks/ | wc -l)"
        echo "Transactions: $(ls -1 transactions/ | wc -l)"
        echo "Accounts: $(cat accounts/accounts.json | jq 'keys | length' 2>/dev/null || echo 'N/A')"
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please enter 1-4."
        ;;
esac
EOF

    chmod +x simple-blockchain/launch.sh
    print_status "Launcher script created!"
}

# Create README
create_readme() {
    print_info "Creating README..."
    
    cat > simple-blockchain/README.md << 'EOF'
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
EOF

    print_status "README created!"
}

# Main execution
main() {
    echo "🚀 Creating Simple Blockchain System..."
    echo "======================================"
    echo ""
    
    # Create directory structure
    mkdir -p simple-blockchain/{blocks,transactions,accounts}
    
    # Create components
    create_simple_blockchain
    create_transaction_processor
    create_web_interface
    create_launcher
    create_readme
    
    echo ""
    print_status "🎉 Simple Blockchain System Created Successfully!"
    echo ""
    echo "📋 What's Available:"
    echo "  ✅ Simple blockchain simulation"
    echo "  ✅ Web interface (no Docker required)"
    echo "  ✅ Command-line transaction processor"
    echo "  ✅ Account balance tracking"
    echo "  ✅ Transaction history"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Navigate to simple-blockchain directory:"
    echo "     cd simple-blockchain"
    echo ""
    echo "  2. Run the launcher:"
    echo "     ./launch.sh"
    echo ""
    echo "  3. Choose option 1 (Web Interface)"
    echo ""
    echo "  4. Create your first transaction!"
    echo ""
    echo "📚 Documentation: simple-blockchain/README.md"
    echo ""
}

# Run the main function
main