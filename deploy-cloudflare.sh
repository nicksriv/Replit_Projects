#!/bin/bash

# YouTube AI LMS - Cloudflare Subdomain Deployment
# Deploys to lms.codescribed.com

echo "🌐 YouTube AI LMS - Cloudflare Deployment"
echo "=========================================="
echo ""
echo "Subdomain: lms.codescribed.com"
echo "VPS IP: 213.199.48.187"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Confirm deployment
read -p "Deploy to lms.codescribed.com? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "📦 Step 1/6: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"
echo ""
echo "📤 Step 2/6: Uploading files to VPS..."
scp -r dist package.json root@$VPS_HOST:$VPS_DEPLOY_PATH/

echo "✅ Files uploaded"
echo ""
echo "⚙️  Step 3/6: Uploading nginx configuration..."
scp nginx-cloudflare.conf root@$VPS_HOST:/etc/nginx/sites-available/lms-codescribed

echo "✅ Nginx config uploaded"
echo ""
echo "🔧 Step 4/6: Enabling nginx configuration..."
ssh root@$VPS_HOST 'ln -sf /etc/nginx/sites-available/lms-codescribed /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'

echo "✅ Nginx configured and reloaded"
echo ""
echo "🔄 Step 5/6: Restarting application..."
ssh root@$VPS_HOST "cd $VPS_DEPLOY_PATH && pm2 restart youtube-ai --update-env"

echo "✅ Application restarted"
echo ""
echo "🧪 Step 6/6: Testing deployment..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$VPS_HOST:5001/health)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check returned: $HTTP_CODE"
fi

echo ""
echo "================================================"
echo "✅ Deployment Complete!"
echo "================================================"
echo ""
echo "📋 CLOUDFLARE SETUP INSTRUCTIONS:"
echo ""
echo "1️⃣  Login to Cloudflare Dashboard:"
echo "   https://dash.cloudflare.com/"
echo ""
echo "2️⃣  Select your domain: codescribed.com"
echo ""
echo "3️⃣  Go to: DNS → Records → Add record"
echo ""
echo "4️⃣  Add A Record:"
echo "   ┌─────────────────────────────────────┐"
echo "   │ Type:    A                          │"
echo "   │ Name:    lms                        │"
echo "   │ IPv4:    213.199.48.187             │"
echo "   │ Proxy:   ☁️  Proxied (Orange Cloud) │"
echo "   │ TTL:     Auto                       │"
echo "   └─────────────────────────────────────┘"
echo ""
echo "5️⃣  Click 'Save'"
echo ""
echo "6️⃣  Configure SSL/TLS:"
echo "   → SSL/TLS → Overview"
echo "   → Select: 'Full' or 'Full (strict)'"
echo ""
echo "7️⃣  (Optional) Page Rules for optimization:"
echo "   → Rules → Page Rules → Create Page Rule"
echo "   → URL: lms.codescribed.com/assets/*"
echo "   → Settings:"
echo "     • Browser Cache TTL: 1 day"
echo "     • Cache Level: Cache Everything"
echo ""
echo "⏱️  DNS Propagation: 2-5 minutes (usually instant with Cloudflare)"
echo ""
echo "🌐 Your LMS will be available at:"
echo "   http://lms.codescribed.com (redirects to HTTPS)"
echo "   https://lms.codescribed.com (SSL enabled via Cloudflare)"
echo ""
echo "🔍 Check DNS propagation:"
echo "   https://dnschecker.org/#A/lms.codescribed.com"
echo ""
echo "📊 Test the application:"
echo "   curl -I http://lms.codescribed.com/health"
echo ""
