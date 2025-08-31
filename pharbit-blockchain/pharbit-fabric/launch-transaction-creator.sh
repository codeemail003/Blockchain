#!/bin/bash

echo "🚀 Pharbit Blockchain - Transaction Creator Launcher"
echo "===================================================="
echo ""

# Function to show menu
show_menu() {
    echo "Choose your preferred method to create transactions:"
    echo ""
    echo "1. 🌐 Web Interface (Recommended)"
    echo "   - Open in your browser"
    echo "   - Beautiful, user-friendly interface"
    echo "   - No coding required"
    echo ""
    echo "2. 💻 Interactive Terminal"
    echo "   - Command-line interface"
    echo "   - Step-by-step prompts"
    echo "   - Real blockchain integration"
    echo ""
    echo "3. ⚡ Quick Transaction"
    echo "   - Use your specific details"
    echo "   - Sender: 0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b"
    echo "   - Receiver: 6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR"
    echo "   - Amount: 10"
    echo ""
    echo "4. 📖 Help & Documentation"
    echo "   - View setup instructions"
    echo "   - Troubleshooting guide"
    echo ""
    echo "5. 🚪 Exit"
    echo ""
}

# Function to start web interface
start_web_interface() {
    echo "🌐 Starting Web Interface..."
    echo ""
    echo "The web interface will open in your default browser."
    echo "If it doesn't open automatically, go to:"
    echo "file://$(pwd)/client/web-interface.html"
    echo ""
    
    # Try to open the web interface
    if command -v xdg-open > /dev/null; then
        xdg-open client/web-interface.html
    elif command -v open > /dev/null; then
        open client/web-interface.html
    elif command -v start > /dev/null; then
        start client/web-interface.html
    else
        echo "Please manually open: client/web-interface.html"
    fi
    
    echo "✅ Web interface launched!"
    echo "You can now create transactions by entering sender, receiver, and amount."
}

# Function to start interactive terminal
start_interactive_terminal() {
    echo "💻 Starting Interactive Terminal..."
    echo ""
    echo "This will connect to the real blockchain network."
    echo "Make sure the network is running first."
    echo ""
    
    read -p "Is the blockchain network running? (y/n): " network_running
    
    if [[ $network_running =~ ^[Yy]$ ]]; then
        cd client
        echo "Starting interactive transaction creator..."
        node interactive-transaction.js
    else
        echo "Please start the network first using: ./start-first-block.sh"
        echo "Then run this option again."
    fi
}

# Function to run quick transaction
run_quick_transaction() {
    echo "⚡ Running Quick Transaction..."
    echo ""
    echo "Transaction Details:"
    echo "Sender: 0x89f97Cb35236a1d0190FB25B31C5C0fF4107Ec1b"
    echo "Receiver: 6M3uvRFJSR3hcJab22fSAQGUgXxiMKgdg225k3Pq9qpR"
    echo "Amount: 10"
    echo ""
    
    read -p "Proceed with this transaction? (y/n): " proceed
    
    if [[ $proceed =~ ^[Yy]$ ]]; then
        ./quick-start-transaction.sh
    else
        echo "Transaction cancelled."
    fi
}

# Function to show help
show_help() {
    echo "📖 Help & Documentation"
    echo "======================="
    echo ""
    echo "🚀 Getting Started:"
    echo "1. Make sure Docker is running"
    echo "2. Choose option 1 (Web Interface) for easiest experience"
    echo "3. Enter sender, receiver, and amount"
    echo "4. Click 'Create Transaction Block'"
    echo ""
    echo "💡 Tips:"
    echo "- Use any address format (0x1234... or ABC123...)"
    echo "- Amount must be positive"
    echo "- Sender and receiver cannot be the same"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "- If web interface doesn't open, manually open client/web-interface.html"
    echo "- If terminal option fails, ensure network is running"
    echo "- Check Docker is running for blockchain operations"
    echo ""
    echo "📚 More Information:"
    echo "- README-TRANSACTION.md - Detailed transaction guide"
    echo "- README-FIRST-BLOCK.md - General blockchain guide"
    echo ""
}

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            start_web_interface
            ;;
        2)
            start_interactive_terminal
            ;;
        3)
            run_quick_transaction
            ;;
        4)
            show_help
            ;;
        5)
            echo "👋 Thank you for using Pharbit Blockchain!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please enter 1-5."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done