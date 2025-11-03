#!/bin/bash
# Server Setup Script for Multi-App Contabo VPS
# This script runs ON the VPS server to install and configure everything

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment variables passed from deploy script
APP_NAME="${APP_NAME:-youtube-ai}"
APP_PATH="${APP_PATH:-/apps}"
FULL_APP_PATH="${FULL_APP_PATH:-/apps/youtube-ai}"

echo -e "${BLUE}🔧 Setting up Multi-App VPS for ${APP_NAME}...${NC}"

# Update system
echo -e "\n${BLUE}📦 Updating system packages...${NC}"
apt-get update -y
apt-get upgrade -y

# Install required packages
echo -e "\n${BLUE}📦 Installing required packages...${NC}"
apt-get install -y curl wget git nginx sqlite3 ufw fail2ban htop tree

# Install Node.js 18.x
echo -e "\n${BLUE}📦 Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
echo -e "\n${BLUE}📦 Installing PM2...${NC}"
npm install -g pm2

# Create apps directory structure
echo -e "\n${BLUE}📁 Creating multi-app directory structure...${NC}"
mkdir -p ${APP_PATH}
chmod 755 ${APP_PATH}

# Setup firewall
echo -e "\n${BLUE}🛡️ Configuring firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# Configure fail2ban
echo -e "\n${BLUE}🛡️ Configuring fail2ban...${NC}"
systemctl enable fail2ban
systemctl start fail2ban

# Configure Nginx for multi-app setup
echo -e "\n${BLUE}🌐 Configuring Nginx for multi-app hosting...${NC}"

# Remove default nginx config
rm -f /etc/nginx/sites-enabled/default

# Create multi-app nginx configuration
cat > /etc/nginx/sites-available/multi-app << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Root directory for serving static files
    root /var/www/html;
    index index.html index.htm;
    
    # Main landing page (optional)
    location = / {
        return 200 '<html><head><title>VPS Applications</title></head><body><h1>Available Applications</h1><ul><li><a href="/apps/youtube-ai">YouTube AI Demo</a></li></ul></body></html>';
        add_header Content-Type text/html;
    }
    
    # YouTube AI Application
    location /apps/youtube-ai {
        # Remove the /apps/youtube-ai prefix and proxy to the app
        rewrite ^/apps/youtube-ai/?(.*) /$1 break;
        
        # Proxy to the Node.js application
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Original-URI $request_uri;
        proxy_cache_bypass $http_upgrade;
        
        # Handle WebSocket connections
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # API routes for YouTube AI
    location /apps/youtube-ai/api {
        rewrite ^/apps/youtube-ai/?(.*) /$1 break;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Original-URI $request_uri;
        
        # API specific settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Static assets for YouTube AI
    location /apps/youtube-ai/assets {
        rewrite ^/apps/youtube-ai/?(.*) /$1 break;
        proxy_pass http://localhost:3000;
        
        # Cache static assets
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # Future applications can be added here
    # Example for a second app:
    # location /apps/another-app {
    #     rewrite ^/apps/another-app/?(.*) /$1 break;
    #     proxy_pass http://localhost:3001;
    #     # ... similar proxy settings
    # }
    
    # Generic error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    
    location = /404.html {
        return 404 '<html><head><title>404 Not Found</title></head><body><h1>Application Not Found</h1><p>The requested application is not available.</p><a href="/">Return to applications list</a></body></html>';
        add_header Content-Type text/html;
    }
    
    location = /50x.html {
        return 500 '<html><head><title>Server Error</title></head><body><h1>Server Error</h1><p>The application is temporarily unavailable.</p><a href="/">Return to applications list</a></body></html>';
        add_header Content-Type text/html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/x-javascript
        application/xml+rss
        application/json
        application/javascript;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=5r/s;
    
    location /apps/youtube-ai/api {
        limit_req zone=api burst=20 nodelay;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/multi-app /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
    exit 1
fi

# Create log directory for applications
echo -e "\n${BLUE}📝 Setting up logging...${NC}"
mkdir -p /var/log/apps
mkdir -p /var/log/apps/${APP_NAME}
chown www-data:www-data /var/log/apps
chown www-data:www-data /var/log/apps/${APP_NAME}

# Setup PM2 startup
echo -e "\n${BLUE}⚙️ Configuring PM2 startup...${NC}"
pm2 startup systemd -u root --hp /root

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

echo -e "\n${GREEN}✅ Multi-app server setup completed successfully!${NC}"
echo -e "${YELLOW}📁 Apps directory: ${APP_PATH}${NC}"
echo -e "${YELLOW}🌐 Nginx configured for multi-app hosting${NC}"
echo -e "${YELLOW}📍 Next: Deploy your ${APP_NAME} application${NC}"