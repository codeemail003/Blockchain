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
