#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
    echo "Error: .env file not found"
    exit 1
fi

# Check if required variables are set
if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_PASSWORD" ] || [ -z "$VPS_DEPLOY_PATH" ]; then
    echo "Error: Missing required environment variables (VPS_HOST, VPS_USER, VPS_PASSWORD, VPS_DEPLOY_PATH)"
    exit 1
fi

echo "🚀 Deploying to VPS: $VPS_HOST"
echo "📁 Deploy path: $VPS_DEPLOY_PATH"

# Create expect script for automated SSH with password
cat > /tmp/ssh_deploy.exp << EOF
#!/usr/bin/expect -f
set timeout 30
spawn ssh $VPS_USER@$VPS_HOST "mkdir -p $VPS_DEPLOY_PATH"
expect {
    "password:" {
        send "$VPS_PASSWORD\r"
        exp_continue
    }
    eof
}
wait
EOF

chmod +x /tmp/ssh_deploy.exp
/tmp/ssh_deploy.exp

# Create expect script for rsync with password
cat > /tmp/rsync_deploy.exp << EOF
#!/usr/bin/expect -f
set timeout 120
spawn rsync -avz --delete ./dist/ ./package.json ./node_modules/ $VPS_USER@$VPS_HOST:$VPS_DEPLOY_PATH/
expect {
    "password:" {
        send "$VPS_PASSWORD\r"
        exp_continue
    }
    eof
}
wait
EOF

chmod +x /tmp/rsync_deploy.exp
echo "📦 Uploading files..."
/tmp/rsync_deploy.exp

# Restart PM2 process
cat > /tmp/restart_pm2.exp << EOF
#!/usr/bin/expect -f
set timeout 30
spawn ssh $VPS_USER@$VPS_HOST "cd $VPS_DEPLOY_PATH && pm2 restart youtube-ai || pm2 start dist/index.js --name youtube-ai"
expect {
    "password:" {
        send "$VPS_PASSWORD\r"
        exp_continue
    }
    eof
}
wait
EOF

chmod +x /tmp/restart_pm2.exp
echo "🔄 Restarting PM2 process..."
/tmp/restart_pm2.exp

# Check status
cat > /tmp/check_status.exp << EOF
#!/usr/bin/expect -f
set timeout 30
spawn ssh $VPS_USER@$VPS_HOST "pm2 status && pm2 logs youtube-ai --lines 10"
expect {
    "password:" {
        send "$VPS_PASSWORD\r"
        exp_continue
    }
    eof
}
wait
EOF

chmod +x /tmp/check_status.exp
echo "📊 Checking status..."
/tmp/check_status.exp

# Clean up temporary files
rm -f /tmp/ssh_deploy.exp /tmp/rsync_deploy.exp /tmp/restart_pm2.exp /tmp/check_status.exp

echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://$VPS_HOST/apps/youtube-ai/"