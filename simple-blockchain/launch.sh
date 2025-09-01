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
