#!/bin/bash
# EC2 User Data Script - Auto-setup for YouTube AI Demo
# This script runs automatically when the EC2 instance boots

exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
echo "Starting user data script execution at $(date)"

# Update system
yum update -y

# Install Node.js 18.x
echo "Installing Node.js..."
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install additional dependencies
yum install -y git nginx gcc-c++ make

# Install PM2 globally
npm install -g pm2

# Create app directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Clone the repository (you'll need to update this with your actual repo)
echo "Cloning repository..."
git clone https://github.com/nicksriv/Replit_Projects.git .

# Install dependencies
echo "Installing Node.js dependencies..."
npm install --production

# Create SQLite database file
echo "Setting up SQLite database..."
touch db.sqlite
chown ec2-user:ec2-user db.sqlite

# Create environment configuration
echo "Setting up environment variables..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
DATABASE_URL=file:./db.sqlite
OPENAI_API_KEY=your-openai-key-here
SARVAM_API_KEY=your-sarvam-key-here

# Demo-specific settings
MAX_VIDEO_LENGTH=600
ENABLE_TRANSLATION=true
ENABLE_BLOG_GENERATION=true
ENABLE_SEMANTIC_SEARCH=true
EOF

# Build the application
echo "Building application..."
npm run build

# Setup nginx reverse proxy
echo "Configuring Nginx..."
cat > /etc/nginx/conf.d/youtube-demo.conf << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    # Root location - proxy to Node.js app
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Remove default nginx config
rm -f /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Set proper ownership for app directory
chown -R ec2-user:ec2-user /home/ec2-user/app

# Create a simple startup script
cat > /home/ec2-user/start-app.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/app

# Source environment variables
export $(cat .env | grep -v ^# | xargs)

# Start the application with PM2
pm2 start dist/index.js --name youtube-demo --log /var/log/youtube-demo.log

# Save PM2 configuration
pm2 save

echo "YouTube AI Demo started successfully!"
echo "Check logs with: pm2 logs youtube-demo"
EOF

chmod +x /home/ec2-user/start-app.sh

# Switch to ec2-user and start the application
su - ec2-user -c "cd /home/ec2-user/app && /home/ec2-user/start-app.sh"

# Setup PM2 to start on boot
su - ec2-user -c "pm2 startup systemd -u ec2-user --hp /home/ec2-user"
systemctl enable pm2-ec2-user

# Create a status check script
cat > /home/ec2-user/check-status.sh << 'EOF'
#!/bin/bash
echo "=== YouTube AI Demo Status ==="
echo "Nginx Status:"
systemctl status nginx --no-pager -l

echo -e "\nPM2 Status:"
pm2 status

echo -e "\nApplication Health:"
curl -s http://localhost:5001/health || echo "Application not responding"

echo -e "\nNginx Access Log (last 10 lines):"
tail -n 10 /var/log/nginx/access.log

echo -e "\nApplication Log (last 10 lines):"
pm2 logs youtube-demo --lines 10
EOF

chmod +x /home/ec2-user/check-status.sh
chown ec2-user:ec2-user /home/ec2-user/check-status.sh

# Create a simple index page for immediate feedback
mkdir -p /var/www/html
cat > /var/www/html/setup-status.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>YouTube AI Demo - Setup in Progress</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .status { color: #666; margin: 20px 0; }
    </style>
    <script>
        // Auto-refresh every 30 seconds to check if main app is ready
        setTimeout(function() {
            fetch('/api/youtube/analyses')
                .then(response => {
                    if (response.ok) {
                        location.reload();
                    }
                })
                .catch(() => {
                    // App not ready yet, continue showing setup page
                });
        }, 30000);
    </script>
</head>
<body>
    <div class="container">
        <h1>🚀 YouTube AI Demo</h1>
        <div class="spinner"></div>
        <div class="status">Setup in progress...</div>
        <p>Your AI-powered YouTube knowledge base is being set up. This usually takes 5-10 minutes.</p>
        <p>The page will automatically refresh when ready, or you can manually refresh in a few minutes.</p>
        <hr>
        <small>Instance launched at: <!-- TIMESTAMP --></small>
    </div>
</body>
</html>
EOF

# Add timestamp
sed -i "s/<!-- TIMESTAMP -->/$(date)/" /var/www/html/setup-status.html

echo "User data script completed at $(date)"

# Final status check
echo "=== Final Status Check ==="
systemctl status nginx --no-pager
su - ec2-user -c "pm2 status"

echo "Setup completed! The application should be accessible shortly."