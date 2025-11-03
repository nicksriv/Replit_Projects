#!/bin/bash
# Contabo VPS Pre-deployment Checker

echo "🔍 Contabo VPS Deployment Pre-Check"
echo "=================================="

# Check if jq is available for health checks
if ! command -v jq &> /dev/null; then
    echo "⚠️  Installing jq for better health checks..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq 2>/dev/null || echo "Install jq manually: brew install jq"
    else
        echo "Install jq manually: sudo apt install jq"
    fi
fi

# Check if deploy script has been configured
CONFIGURED_IP=$(grep "^VPS_IP=" deployment/vps/deploy-contabo.sh | cut -d'"' -f2)
if [ "$CONFIGURED_IP" = "YOUR_VPS_IP_HERE" ]; then
    echo "❌ VPS IP not configured in deployment/vps/deploy-contabo.sh"
    exit 1
else
    echo "✅ VPS IP configured: $CONFIGURED_IP"
fi

# Extract VPS details from deploy script
VPS_IP=$(grep "^VPS_IP=" deployment/vps/deploy-contabo.sh | cut -d'"' -f2)
VPS_USER=$(grep "^VPS_USER=" deployment/vps/deploy-contabo.sh | cut -d'"' -f2)
SSH_PORT=$(grep "^SSH_PORT=" deployment/vps/deploy-contabo.sh | cut -d'"' -f2)

echo "📋 Configuration found:"
echo "   VPS IP: $VPS_IP"
echo "   SSH User: $VPS_USER"
echo "   SSH Port: $SSH_PORT"
echo ""

# Test VPS connectivity
echo "🌐 Testing VPS connectivity..."
if ping -c 1 $VPS_IP >/dev/null 2>&1; then
    echo "✅ VPS is reachable"
else
    echo "❌ VPS is not reachable at $VPS_IP"
    echo "   Check if:"
    echo "   - VPS is running (check Contabo dashboard)"
    echo "   - IP address is correct"
    echo "   - Your internet connection is working"
    exit 1
fi

# Test SSH connectivity
echo "🔑 Testing SSH access..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SSH_PORT $VPS_USER@$VPS_IP exit 2>/dev/null; then
    echo "✅ SSH access working"
else
    echo "❌ SSH access failed"
    echo "   Trying interactive connection test..."
    echo "   (You may need to enter password or accept host key)"
    echo ""
    echo "Testing: ssh $VPS_USER@$VPS_IP"
    
    if ssh -o ConnectTimeout=10 -p $SSH_PORT $VPS_USER@$VPS_IP exit; then
        echo "✅ SSH works with interactive login"
        echo "   The deployment should work now"
    else
        echo "❌ SSH connection failed"
        echo "   Please check:"
        echo "   - VPS is running"
        echo "   - SSH service is enabled"
        echo "   - Firewall allows SSH (port $SSH_PORT)"
        echo "   - Username '$VPS_USER' is correct"
        exit 1
    fi
fi

# Check API keys
echo ""
echo "🔑 Checking API keys..."
if [ -f ".env" ]; then
    if grep -q "your-.*-key-here" .env; then
        echo "⚠️  Default API keys found in .env"
        echo "   Please update with your actual keys before deployment"
    else
        echo "✅ .env file exists with custom keys"
    fi
else
    echo "⚠️  No .env file found"
    echo "   Creating from example..."
    cp .env.example .env
    echo "   Please edit .env and add your API keys"
fi

echo ""
echo "🚀 Pre-deployment checklist:"
echo "   ✅ VPS connectivity verified"
echo "   ✅ SSH access working"
echo "   ⚠️  Update API keys in .env file"
echo "   ⚠️  Review configuration in deployment/vps/deploy-contabo.sh"

echo ""
echo "🎯 Ready to deploy? Run:"
echo "   ./deployment/vps/deploy-contabo.sh"

echo ""
echo "💡 After deployment, manage with:"
echo "   ./deployment/vps/manage-vps.sh status"