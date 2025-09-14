#!/bin/bash

# ===========================================
# PHARBIT BLOCKCHAIN EC2 DEPLOYMENT SCRIPT
# ===========================================
# Complete deployment script for AWS EC2 with automatic startup
# Includes PM2, Nginx, SSL, and monitoring setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST="ec2-13-53-40-13.eu-north-1.compute.amazonaws.com"
EC2_USER="ubuntu"
EC2_KEY_PATH="~/.ssh/pharbit-key.pem"
PROJECT_DIR="/home/ubuntu/pharbit-blockchain"
REPO_URL="https://github.com/Maitreyapharbit/Blockchain.git"
DOMAIN="pharbit.com"  # Replace with your domain
EMAIL="admin@pharbit.com"  # Replace with your email

# ASCII Art Banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║    🏥 PHARBIT BLOCKCHAIN EC2 DEPLOYMENT 🏥                  ║"
    echo "║                                                              ║"
    echo "║    Production-ready pharmaceutical blockchain deployment     ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if SSH key exists
    if [ ! -f "${EC2_KEY_PATH/#\~/$HOME}" ]; then
        log_error "SSH key not found at ${EC2_KEY_PATH}"
        log_info "Please ensure your SSH key is available at the specified path"
        exit 1
    fi
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found. Some features may not work."
    fi
    
    # Check if PM2 is installed locally
    if ! command -v pm2 &> /dev/null; then
        log_warning "PM2 not found locally. Installing..."
        npm install -g pm2
    fi
    
    log_success "Prerequisites check completed"
}

# Connect to EC2 and setup environment
setup_ec2_environment() {
    log_step "Setting up EC2 environment..."
    
    ssh -i "${EC2_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << 'EOF'
        # Update system packages
        sudo apt update && sudo apt upgrade -y
        
        # Install Node.js 18
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
        
        # Install PM2 globally
        sudo npm install -g pm2
        
        # Install Nginx
        sudo apt install -y nginx
        
        # Install PostgreSQL
        sudo apt install -y postgresql postgresql-contrib
        
        # Install Redis
        sudo apt install -y redis-server
        
        # Install additional tools
        sudo apt install -y git curl wget unzip htop
        
        # Create project directory
        sudo mkdir -p /home/ubuntu/pharbit-blockchain
        sudo chown ubuntu:ubuntu /home/ubuntu/pharbit-blockchain
        
        # Create logs directory
        mkdir -p /home/ubuntu/pharbit-blockchain/logs
        mkdir -p /home/ubuntu/pharbit-blockchain/blockchain-data
        
        # Setup PostgreSQL
        sudo -u postgres psql -c "CREATE DATABASE pharbit;"
        sudo -u postgres psql -c "CREATE USER pharbit_user WITH PASSWORD 'pharbit_secure_password_2024';"
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pharbit TO pharbit_user;"
        
        # Configure Redis
        sudo systemctl enable redis-server
        sudo systemctl start redis-server
        
        # Configure PostgreSQL
        sudo systemctl enable postgresql
        sudo systemctl start postgresql
        
        echo "EC2 environment setup completed"
EOF
    
    log_success "EC2 environment setup completed"
}

# Clone and setup project
setup_project() {
    log_step "Setting up project on EC2..."
    
    ssh -i "${EC2_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << EOF
        cd /home/ubuntu/pharbit-blockchain
        
        # Clone or update repository
        if [ -d ".git" ]; then
            log_info "Updating existing repository..."
            git pull origin main
        else
            log_info "Cloning repository..."
            git clone ${REPO_URL} .
        fi
        
        # Install dependencies
        npm install --production
        
        # Make scripts executable
        chmod +x scripts/*.sh
        
        # Create .env file if it doesn't exist
        if [ ! -f ".env" ]; then
            cp .env.example .env
            log_warning "Please configure your .env file with actual credentials"
        fi
        
        echo "Project setup completed"
EOF
    
    log_success "Project setup completed"
}

# Configure PM2
setup_pm2() {
    log_step "Configuring PM2..."
    
    ssh -i "${EC2_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << 'EOF'
        cd /home/ubuntu/pharbit-blockchain
        
        # Install PM2 startup script
        pm2 startup systemd -u ubuntu --hp /home/ubuntu
        
        # Start application with PM2
        pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 monitoring
        pm2 install pm2-logrotate
        
        echo "PM2 configuration completed"
EOF
    
    log_success "PM2 configuration completed"
}

# Configure Nginx
setup_nginx() {
    log_step "Configuring Nginx..."
    
    ssh -i "${EC2_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << EOF
        # Create Nginx configuration
        sudo tee /etc/nginx/sites-available/pharbit-blockchain << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=1r/s;
    
    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check endpoints
    location /health {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # API documentation
    location /api-docs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static files (if any)
    location /static/ {
        alias /home/ubuntu/pharbit-blockchain/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security
    location ~ /\. {
        deny all;
    }
    
    # Logging
    access_log /var/log/nginx/pharbit-blockchain.access.log;
    error_log /var/log/nginx/pharbit-blockchain.error.log;
}
EOF
        
        # Enable site
        sudo ln -sf /etc/nginx/sites-available/pharbit-blockchain /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test Nginx configuration
        sudo nginx -t
        
        # Restart Nginx
        sudo systemctl restart nginx
        sudo systemctl enable nginx
        
        echo "Nginx configuration completed"
EOF
    
    log_success "Nginx configuration completed"
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    log_step "Setting up SSL with Let's Encrypt..."
    
    ssh -i "${EC2_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << EOF
        # Install Certbot
        sudo apt install -y certbot python3-certbot-nginx
        
        # Obtain SSL certificate
        sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --email ${EMAIL} --agree-tos --non-interactive
        
        # Setup auto-renewal
        echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
        
        # Test renewal
        sudo certbot renew --dry-run
        
        echo "SSL setup completed"
EOF
    
    log_success "SSL setup completed"
}

# Configure firewall
setup_firewall() {
    log_step "Configuring firewall..."
    
    ssh -i "${EC2_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << 'EOF'
        # Configure UFW firewall
        sudo ufw --force reset
        sudo ufw default deny incoming
        sudo ufw default allow outgoing
        
        # Allow SSH
        sudo ufw allow ssh
        
        # Allow HTTP and HTTPS
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        
        # Allow application port (if needed for direct access)
        sudo ufw allow 3000/tcp
        
        # Enable firewall
        sudo ufw --force enable
        
        # Check status
        sudo ufw status verbose
        
        echo "Firewall configuration completed"
EOF
    
    log_success "Firewall configuration completed"
}

# Setup monitoring and health checks
setup_monitoring() {
    log_step "Setting up monitoring and health checks..."
    
    ssh -i "${EC2_KEY_PATH}" "${EC2_USER}@${EC2_HOST}" << 'EOF'
        cd /home/ubuntu/pharbit-blockchain
        
        # Create health check script
        cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for PharbitChain

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="/home/ubuntu/pharbit-blockchain/logs/health-check.log"

check_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$response" = "200" ]; then
        echo "[$timestamp] Health check passed (HTTP $response)" >> $LOG_FILE
        return 0
    else
        echo "[$timestamp] Health check failed (HTTP $response)" >> $LOG_FILE
        return 1
    fi
}

# Perform health check
if check_health; then
    exit 0
else
    # Restart PM2 processes if health check fails
    pm2 restart pharbit-blockchain
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarted PM2 processes due to health check failure" >> $LOG_FILE
    exit 1
fi
EOF
        
        chmod +x scripts/health-check.sh
        
        # Setup cron job for health checks
        echo "*/5 * * * * /home/ubuntu/pharbit-blockchain/scripts/health-check.sh" | crontab -
        
        # Create log rotation configuration
        sudo tee /etc/logrotate.d/pharbit-blockchain << 'EOF'
/home/ubuntu/pharbit-blockchain/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
        
        echo "Monitoring setup completed"
EOF
    
    log_success "Monitoring setup completed"
}

# Test deployment
test_deployment() {
    log_step "Testing deployment..."
    
    # Wait for services to start
    sleep 30
    
    # Test health endpoint
    if curl -f "http://${EC2_HOST}/health" > /dev/null 2>&1; then
        log_success "Health check passed"
    else
        log_warning "Health check failed, but deployment may still be successful"
    fi
    
    # Test API endpoint
    if curl -f "http://${EC2_HOST}/api/health" > /dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_warning "API health check failed"
    fi
    
    log_success "Deployment testing completed"
}

# Show deployment summary
show_summary() {
    log_step "Deployment Summary"
    echo -e "${GREEN}================================${NC}"
    echo -e "EC2 Host: ${YELLOW}${EC2_HOST}${NC}"
    echo -e "Project Directory: ${YELLOW}${PROJECT_DIR}${NC}"
    echo -e "Domain: ${YELLOW}${DOMAIN}${NC}"
    echo -e "API URL: ${YELLOW}https://${DOMAIN}/api${NC}"
    echo -e "Health Check: ${YELLOW}https://${DOMAIN}/health${NC}"
    echo -e "API Docs: ${YELLOW}https://${DOMAIN}/api-docs${NC}"
    echo -e "${GREEN}================================${NC}"
    
    echo -e "\n${CYAN}Next Steps:${NC}"
    echo "1. Configure your .env file with actual credentials"
    echo "2. Run database migrations: npm run migrate"
    echo "3. Seed initial data: npm run seed"
    echo "4. Monitor logs: pm2 logs pharbit-blockchain"
    echo "5. Check status: pm2 status"
    
    echo -e "\n${YELLOW}Security Notes:${NC}"
    echo "- Ensure your AWS security groups allow ports 22, 80, 443"
    echo "- Keep your SSH key secure"
    echo "- Regularly update system packages"
    echo "- Monitor application logs for security issues"
    
    echo -e "\n${PURPLE}Management Commands:${NC}"
    echo "- Restart app: pm2 restart pharbit-blockchain"
    echo "- Stop app: pm2 stop pharbit-blockchain"
    echo "- View logs: pm2 logs pharbit-blockchain"
    echo "- Monitor: pm2 monit"
}

# Main deployment function
main() {
    show_banner
    
    log_info "Starting PharbitChain EC2 deployment..."
    
    check_prerequisites
    setup_ec2_environment
    setup_project
    setup_pm2
    setup_nginx
    setup_ssl
    setup_firewall
    setup_monitoring
    test_deployment
    show_summary
    
    log_success "🎉 PharbitChain deployment completed successfully!"
    log_info "Your pharmaceutical blockchain is now running on AWS EC2"
}

# Run main function
main "$@"