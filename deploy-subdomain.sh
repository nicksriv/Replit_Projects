#!/bin/bash

# Subdomain Deployment Script for YouTube AI Application
# This script sets up the application on a subdomain

echo "🌐 YouTube AI - Subdomain Deployment Setup"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Prompt for subdomain
read -p "Enter your subdomain (e.g., youtube-ai.yourdomain.com): " SUBDOMAIN

if [ -z "$SUBDOMAIN" ]; then
    echo "❌ Error: Subdomain cannot be empty"
    exit 1
fi

echo ""
echo "📝 Configuration Summary:"
echo "   Subdomain: $SUBDOMAIN"
echo "   VPS IP: $VPS_HOST"
echo "   Deploy Path: $VPS_DEPLOY_PATH"
echo ""

# Ask for confirmation
read -p "Continue with deployment? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "📦 Step 1: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "📤 Step 2: Uploading files to VPS..."
scp -r dist package.json root@$VPS_HOST:$VPS_DEPLOY_PATH/

echo ""
echo "⚙️  Step 3: Creating nginx configuration..."

# Create nginx config with the subdomain
cat > /tmp/nginx-subdomain.conf << EOF
server {
    listen 80;
    server_name $SUBDOMAIN;

    # Main location for the YouTube AI app
    location / {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Disable buffering for SSE/streaming
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Serve assets directly
    location /assets/ {
        proxy_pass http://localhost:5001/assets/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # Serve figma assets
    location /figmaAssets/ {
        proxy_pass http://localhost:5001/figmaAssets/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }
}
EOF

echo ""
echo "📤 Step 4: Uploading nginx configuration..."
scp /tmp/nginx-subdomain.conf root@$VPS_HOST:/etc/nginx/sites-available/youtube-ai-subdomain

echo ""
echo "🔧 Step 5: Enabling nginx configuration..."
ssh root@$VPS_HOST 'ln -sf /etc/nginx/sites-available/youtube-ai-subdomain /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'

echo ""
echo "🔄 Step 6: Restarting PM2..."
ssh root@$VPS_HOST "cd $VPS_DEPLOY_PATH && pm2 restart youtube-ai --update-env"

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure DNS A Record:"
echo "   Type: A"
echo "   Name: $(echo $SUBDOMAIN | cut -d'.' -f1)"
echo "   Value: $VPS_HOST"
echo "   TTL: 3600"
echo ""
echo "2. Wait for DNS propagation (5-30 minutes)"
echo ""
echo "3. Access your application at: http://$SUBDOMAIN"
echo ""
echo "4. (Optional) Set up SSL certificate:"
echo "   ssh root@$VPS_HOST"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d $SUBDOMAIN"
echo ""
echo "🔒 SSL will enable HTTPS access at: https://$SUBDOMAIN"

# Clean up
rm -f /tmp/nginx-subdomain.conf
