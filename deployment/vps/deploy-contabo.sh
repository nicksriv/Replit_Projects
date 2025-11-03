#!/bin/bash
# Contabo VPS Deployment Script for YouTube AI Demo
# Run this script from your local machine to deploy to your VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 YouTube AI Demo - Contabo VPS Deployment${NC}"
echo "============================================"

# Configuration (CONFIGURED FOR YOUR VPS)
VPS_IP="213.199.48.187"                # Your Contabo VPS IP
VPS_USER="root"                        # Usually 'root' for Contabo
SSH_PORT="22"                          # Default SSH port
APP_DOMAIN=""                          # Optional: your domain name
USE_SSL=false                          # Set to true if you have a domain

# Multi-app configuration
APP_NAME="youtube-ai"                  # This app's name
APP_PATH="/apps"                       # Base path for all apps
FULL_APP_PATH="$APP_PATH/$APP_NAME"    # Full path: /apps/youtube-ai
WEB_PATH="/apps"                       # URL path: http://ip/apps/youtube-ai

# Validate configuration
if [ "$VPS_IP" = "YOUR_VPS_IP_HERE" ]; then
    echo -e "${RED}❌ Please update VPS_IP in this script with your actual Contabo VPS IP${NC}"
    echo "Edit deployment/vps/deploy-contabo.sh and update the configuration section"
    exit 1
fi

echo -e "${GREEN}✅ Using VPS IP: $VPS_IP${NC}"

# Check if we can connect to VPS
echo -e "\n${YELLOW}🔍 Testing VPS connection...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SSH_PORT $VPS_USER@$VPS_IP exit 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to VPS. Please check:${NC}"
    echo "   - VPS IP address: $VPS_IP"
    echo "   - SSH access is working"
    echo "   - Firewall allows SSH (port $SSH_PORT)"
    echo ""
    echo "Test manually with: ssh $VPS_USER@$VPS_IP"
    exit 1
fi

echo -e "${GREEN}✅ VPS connection successful${NC}"

# Create deployment directory on VPS
echo -e "\n${YELLOW}📁 Creating multi-app directory structure...${NC}"
ssh -p $SSH_PORT $VPS_USER@$VPS_IP "mkdir -p $FULL_APP_PATH"

# Upload setup script to VPS
echo -e "\n${YELLOW}📤 Uploading setup script...${NC}"
scp -P $SSH_PORT deployment/vps/server-setup.sh $VPS_USER@$VPS_IP:$FULL_APP_PATH/
scp -P $SSH_PORT deployment/vps/nginx-multi-app.conf $VPS_USER@$VPS_IP:$FULL_APP_PATH/nginx.conf
scp -P $SSH_PORT deployment/.env.production $VPS_USER@$VPS_IP:$FULL_APP_PATH/.env

# Make setup script executable and run it
echo -e "\n${YELLOW}🔧 Running server setup...${NC}"
ssh -p $SSH_PORT $VPS_USER@$VPS_IP "chmod +x $FULL_APP_PATH/server-setup.sh && APP_NAME=$APP_NAME APP_PATH=$FULL_APP_PATH WEB_PATH=$WEB_PATH $FULL_APP_PATH/server-setup.sh"

# Upload application code
echo -e "\n${YELLOW}📦 Uploading application code...${NC}"
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='temp_downloads' -czf app.tar.gz .
scp -P $SSH_PORT app.tar.gz $VPS_USER@$VPS_IP:$FULL_APP_PATH/
rm app.tar.gz

# Extract and setup application
echo -e "\n${YELLOW}🏗️  Setting up application...${NC}"
ssh -p $SSH_PORT $VPS_USER@$VPS_IP << EOF
cd $FULL_APP_PATH
tar -xzf app.tar.gz
rm app.tar.gz

# Install dependencies and build
npm install --production
npm run build

# Setup database
touch db.sqlite
chown www-data:www-data db.sqlite 2>/dev/null || chown $VPS_USER:$VPS_USER db.sqlite
chmod 644 db.sqlite

# Setup PM2 and start application
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start dist/index.js --name $APP_NAME
pm2 save
pm2 startup systemd -u $VPS_USER --hp /root

# Start nginx
systemctl enable nginx
systemctl restart nginx

echo "✅ Application setup complete"
EOF

# Get VPS public IP for final URL
FINAL_URL="http://$VPS_IP$WEB_PATH/$APP_NAME"
if [ -n "$APP_DOMAIN" ]; then
    FINAL_URL="http://$APP_DOMAIN$WEB_PATH/$APP_NAME"
    if [ "$USE_SSL" = true ]; then
        FINAL_URL="https://$APP_DOMAIN$WEB_PATH/$APP_NAME"
    fi
fi

echo -e "\n${GREEN}🎉 Deployment Successful!${NC}"
echo -e "${GREEN}========================${NC}"
echo -e "${BLUE}🌐 Your app is available at: ${NC}$FINAL_URL"
echo -e "${BLUE}🔧 VPS IP: ${NC}$VPS_IP"
echo -e "${BLUE}🔑 SSH Access: ${NC}ssh $VPS_USER@$VPS_IP"
echo -e "${BLUE}📁 App Location: ${NC}$FULL_APP_PATH"

echo -e "\n${YELLOW}📱 Next Steps:${NC}"
echo "1. Update your API keys in $FULL_APP_PATH/.env on the VPS"
echo "2. Restart the application: ssh $VPS_USER@$VPS_IP 'pm2 restart $APP_NAME'"
if [ -n "$APP_DOMAIN" ]; then
    echo "3. Point your domain $APP_DOMAIN to IP $VPS_IP"
    if [ "$USE_SSL" = true ]; then
        echo "4. Setup SSL certificate (Let's Encrypt)"
    fi
fi

echo -e "\n${BLUE}🔍 Useful Commands:${NC}"
echo "# Check application status:"
echo "ssh $VPS_USER@$VPS_IP 'pm2 status'"
echo ""
echo "# View application logs:"
echo "ssh $VPS_USER@$VPS_IP 'pm2 logs $APP_NAME'"
echo ""
echo "# Restart application:"
echo "ssh $VPS_USER@$VPS_IP 'pm2 restart $APP_NAME'"

echo -e "\n${GREEN}🏗️  Multi-App Setup:${NC}"
echo "Your VPS is now configured for multiple applications!"
echo "Future apps can be deployed to: $APP_PATH/app-name"
echo "URLs will be: http://$VPS_IP/apps/app-name"

# Create local management script
cat > deployment/vps/manage-vps.sh << EOF
#!/bin/bash
# VPS Management Helper Script for Multi-App Setup

VPS_IP="$VPS_IP"
VPS_USER="$VPS_USER"
SSH_PORT="$SSH_PORT"
APP_NAME="$APP_NAME"
FULL_APP_PATH="$FULL_APP_PATH"

case "\$1" in
    "status")
        ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP 'pm2 status && systemctl status nginx'
        ;;
    "logs")
        ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP "pm2 logs \$APP_NAME --lines 50"
        ;;
    "restart")
        ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP "pm2 restart \$APP_NAME"
        ;;
    "ssh")
        ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP
        ;;
    "update")
        echo "Updating \$APP_NAME application..."
        tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='temp_downloads' -czf app.tar.gz .
        scp -P \$SSH_PORT app.tar.gz \$VPS_USER@\$VPS_IP:\$FULL_APP_PATH/
        rm app.tar.gz
        ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP "cd \$FULL_APP_PATH && tar -xzf app.tar.gz && rm app.tar.gz && npm install --production && npm run build && pm2 restart \$APP_NAME"
        ;;
    "list-apps")
        echo "All applications on VPS:"
        ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP "pm2 status"
        echo ""
        echo "Directory structure:"
        ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP "ls -la $APP_PATH/ 2>/dev/null || echo 'No apps directory yet'"
        ;;
    *)
        echo "Usage: \$0 {status|logs|restart|ssh|update|list-apps}"
        echo ""
        echo "Commands:"
        echo "  status    - Check application and server status"
        echo "  logs      - View \$APP_NAME application logs"
        echo "  restart   - Restart \$APP_NAME application"
        echo "  ssh       - SSH into the VPS"
        echo "  update    - Update \$APP_NAME application code"
        echo "  list-apps - List all applications on VPS"
        ;;
esac
EOF

chmod +x deployment/vps/manage-vps.sh

echo -e "\n${GREEN}📁 Created management script: deployment/vps/manage-vps.sh${NC}"
echo "Use it to manage your VPS: ./deployment/vps/manage-vps.sh {status|logs|restart|ssh|update|list-apps}"

# Create health check script
cat > deployment/vps/health-check.sh << EOF
#!/bin/bash
# Health Check Script for Multi-App VPS Setup

VPS_IP="$VPS_IP"
VPS_USER="$VPS_USER"
SSH_PORT="$SSH_PORT"
APP_NAME="$APP_NAME"
BASE_URL="http://\$VPS_IP$APP_PATH"

echo "🔍 Health Check for \$APP_NAME on VPS..."
echo "VPS IP: \$VPS_IP"
echo "Base URL: \$BASE_URL"
echo ""

# Check if VPS is reachable
if ping -c 1 \$VPS_IP > /dev/null 2>&1; then
    echo "✅ VPS is reachable"
else
    echo "❌ VPS is not reachable"
    exit 1
fi

# Check SSH connection
if ssh -p \$SSH_PORT -o ConnectTimeout=5 \$VPS_USER@\$VPS_IP 'echo "SSH OK"' > /dev/null 2>&1; then
    echo "✅ SSH connection working"
else
    echo "❌ SSH connection failed"
    exit 1
fi

# Check nginx status
if ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP 'systemctl is-active nginx' | grep -q 'active'; then
    echo "✅ Nginx is running"
else
    echo "❌ Nginx is not running"
fi

# Check PM2 processes
echo ""
echo "PM2 Status:"
ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP 'pm2 status'

# Check application URL
echo ""
echo "🌐 Checking application URLs..."
if curl -s -o /dev/null -w "%{http_code}" "\$BASE_URL/\$APP_NAME" | grep -q '200'; then
    echo "✅ \$APP_NAME application is responding"
else
    echo "⚠️  \$APP_NAME application may not be responding properly"
fi

# Check API endpoint
if curl -s -o /dev/null -w "%{http_code}" "\$BASE_URL/\$APP_NAME/api/health" | grep -q '200'; then
    echo "✅ API health endpoint is responding"
else
    echo "⚠️  API health endpoint may not be responding"
fi

echo ""
echo "📊 Server Resources:"
ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP 'echo "CPU Usage:"; top -bn1 | grep "Cpu(s)" | awk "{print \$2}" | awk -F"%" "{print \$1}"; echo "Memory Usage:"; free -h'

echo ""
echo "📋 All Applications:"
ssh -p \$SSH_PORT \$VPS_USER@\$VPS_IP "ls -la $APP_PATH/ 2>/dev/null || echo 'No apps directory yet'"
EOF

chmod +x deployment/vps/health-check.sh

echo -e "\n${GREEN}🏥 Created health check script: deployment/vps/health-check.sh${NC}"
echo "Use it to check your VPS health: ./deployment/vps/health-check.sh"