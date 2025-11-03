#!/bin/bash
# Quick VPS Health Check Script

VPS_IP="${VPS_IP:-213.199.48.187}"
VPS_USER="${VPS_USER:-root}"

if [ "$VPS_IP" = "YOUR_VPS_IP" ]; then
    echo "Please set VPS_IP environment variable or edit this script"
    exit 1
fi

echo "🔍 VPS Health Check for $VPS_IP"
echo "================================"

# Check if VPS is reachable
echo -n "🌐 VPS Connection: "
if ping -c 1 $VPS_IP >/dev/null 2>&1; then
    echo "✅ Online"
else
    echo "❌ Offline"
    exit 1
fi

# Check SSH
echo -n "🔑 SSH Access: "
if ssh -o ConnectTimeout=5 -o BatchMode=yes $VPS_USER@$VPS_IP exit 2>/dev/null; then
    echo "✅ Working"
else
    echo "❌ Failed"
fi

# Check HTTP response
echo -n "🌐 HTTP Response: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://$VPS_IP/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ OK (200)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ No response"
else
    echo "⚠️ $HTTP_CODE"
fi

# Check app status via SSH
if ssh -o ConnectTimeout=5 -o BatchMode=yes $VPS_USER@$VPS_IP exit 2>/dev/null; then
    echo ""
    echo "📱 Application Status:"
    ssh $VPS_USER@$VPS_IP 'pm2 jlist | jq -r ".[] | \"\(.name): \(.pm2_env.status)\""' 2>/dev/null || \
    ssh $VPS_USER@$VPS_IP 'pm2 status --no-colors'
    
    echo ""
    echo "💾 Disk Usage:"
    ssh $VPS_USER@$VPS_IP 'df -h / | tail -n 1'
    
    echo ""
    echo "🧠 Memory Usage:"
    ssh $VPS_USER@$VPS_IP 'free -h | head -n 2'
    
    echo ""
    echo "⚡ CPU Load:"
    ssh $VPS_USER@$VPS_IP 'uptime'
fi