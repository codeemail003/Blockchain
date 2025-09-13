#!/bin/bash

# PharbitChain Server Management Script
# Usage: ./manage-pharbit.sh [start|stop|restart|status|logs|monitor]

case "$1" in
    start)
        echo "🚀 Starting PharbitChain Server..."
        pm2 start pharbit-blockchain
        echo "✅ Server started"
        ;;
    stop)
        echo "🛑 Stopping PharbitChain Server..."
        pm2 stop pharbit-blockchain
        echo "✅ Server stopped"
        ;;
    restart)
        echo "🔄 Restarting PharbitChain Server..."
        pm2 restart pharbit-blockchain
        echo "✅ Server restarted"
        ;;
    status)
        echo "📊 PharbitChain Server Status:"
        pm2 status pharbit-blockchain
        echo ""
        echo "🌐 Health Check:"
        curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
        ;;
    logs)
        echo "📝 Server Logs (last 50 lines):"
        pm2 logs pharbit-blockchain --lines 50
        ;;
    monitor)
        echo "📊 Real-time Monitoring (Ctrl+C to exit):"
        pm2 monit
        ;;
    web)
        echo "🌐 Opening web interface..."
        if command -v xdg-open > /dev/null; then
            xdg-open http://localhost:3000
        elif command -v open > /dev/null; then
            open http://localhost:3000
        else
            echo "Please open http://localhost:3000 in your browser"
        fi
        ;;
    *)
        echo "PharbitChain Server Management"
        echo "=============================="
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|monitor|web}"
        echo ""
        echo "Commands:"
        echo "  start    - Start the server"
        echo "  stop     - Stop the server"
        echo "  restart  - Restart the server"
        echo "  status   - Show server status and health"
        echo "  logs     - Show server logs"
        echo "  monitor  - Real-time monitoring dashboard"
        echo "  web      - Open web interface in browser"
        echo ""
        echo "🌐 Web Interface: http://localhost:3000"
        echo "📡 API Base: http://localhost:3000/api"
        ;;
esac