# 🚀 Contabo VPS Deployment Guide

Deploy your YouTube AI Knowledge Base to Contabo VPS with these scripts.

## 📋 Prerequisites

### **1. Contabo VPS Requirements:**
- **Minimum**: 2GB RAM, 2 CPU cores, 20GB SSD
- **Recommended**: 4GB RAM, 4 CPU cores, 40GB SSD
- **OS**: Ubuntu 20.04/22.04 LTS

### **2. Local Requirements:**
- SSH access to your VPS
- Your API keys (OpenAI, Sarvam AI)

## 🔧 **Before Deployment**

### **1. Get Your VPS Details:**
```bash
# From Contabo dashboard, note down:
VPS_IP="your.vps.ip.address"      # e.g., "185.23.45.67"
VPS_USER="root"                   # Usually 'root' for fresh Contabo VPS
SSH_PORT="22"                     # Default SSH port
```

### **2. Test VPS Connection:**
```bash
# Test SSH access
ssh root@YOUR_VPS_IP

# If this works, you're ready to deploy!
```

### **3. Update Configuration:**
Edit `deployment/vps/deploy-contabo.sh` and update:
```bash
VPS_IP="YOUR_ACTUAL_VPS_IP"       # Change this!
VPS_USER="root"                   # Change if different
SSH_PORT="22"                     # Change if different
APP_DOMAIN=""                     # Optional: your domain
USE_SSL=false                     # Set true if you have domain
```

## 🚀 **One-Command Deployment**

```bash
# Make scripts executable
chmod +x deployment/vps/*.sh

# Deploy everything to your VPS
./deployment/vps/deploy-contabo.sh
```

This will:
- ✅ Setup server (Node.js, nginx, PM2, firewall)
- ✅ Upload and configure your application
- ✅ Start the service with auto-restart
- ✅ Configure nginx reverse proxy
- ✅ Setup security (firewall, fail2ban)

## 📁 **Files Overview**

- **`deploy-contabo.sh`** - Main deployment script
- **`server-setup.sh`** - Server configuration script
- **`nginx.conf`** - Nginx configuration with security
- **`setup-ssl.sh`** - SSL certificate setup (optional)
- **`health-check.sh`** - VPS health monitoring
- **`manage-vps.sh`** - Application management (auto-created)

## 🔧 **Post-Deployment Steps**

### **1. Update API Keys:**
```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Edit environment file
nano /opt/youtube-ai-demo/.env

# Update these lines:
OPENAI_API_KEY=your-actual-openai-key
SARVAM_API_KEY=your-actual-sarvam-key

# Restart application
pm2 restart youtube-demo
```

### **2. Verify Deployment:**
```bash
# Check application status
./deployment/vps/manage-vps.sh status

# View logs
./deployment/vps/manage-vps.sh logs

# Quick health check
./deployment/vps/health-check.sh
```

### **3. Access Your Application:**
- **URL**: `http://YOUR_VPS_IP`
- **Admin SSH**: `ssh root@YOUR_VPS_IP`

## 🌐 **Domain Setup (Optional)**

### **1. Point Domain to VPS:**
Create an A record in your DNS:
```
Type: A
Name: @ (or subdomain)
Value: YOUR_VPS_IP
TTL: 300
```

### **2. Setup SSL Certificate:**
```bash
# Update deploy script with your domain
# Then run SSL setup
ssh root@YOUR_VPS_IP '/opt/youtube-ai-demo/setup-ssl.sh yourdomain.com admin@yourdomain.com'
```

## 🛠️ **Management Commands**

```bash
# Application management
./deployment/vps/manage-vps.sh status    # Check status
./deployment/vps/manage-vps.sh logs      # View logs
./deployment/vps/manage-vps.sh restart   # Restart app
./deployment/vps/manage-vps.sh update    # Update code
./deployment/vps/manage-vps.sh ssh       # SSH into VPS

# Health monitoring
./deployment/vps/health-check.sh         # Quick health check
```

## 🐛 **Troubleshooting**

### **Connection Issues:**
```bash
# Test VPS connectivity
ping YOUR_VPS_IP

# Test SSH
ssh -v root@YOUR_VPS_IP

# Check firewall on VPS
ssh root@YOUR_VPS_IP 'ufw status'
```

### **Application Issues:**
```bash
# Check PM2 status
ssh root@YOUR_VPS_IP 'pm2 status'

# View application logs
ssh root@YOUR_VPS_IP 'pm2 logs youtube-demo'

# Check nginx status
ssh root@YOUR_VPS_IP 'systemctl status nginx'

# Check nginx logs
ssh root@YOUR_VPS_IP 'tail -f /var/log/nginx/youtube-demo-error.log'
```

### **Common Solutions:**
```bash
# Restart everything
ssh root@YOUR_VPS_IP 'pm2 restart youtube-demo && systemctl restart nginx'

# Rebuild application
ssh root@YOUR_VPS_IP 'cd /opt/youtube-ai-demo && npm run build && pm2 restart youtube-demo'

# Check disk space
ssh root@YOUR_VPS_IP 'df -h'

# Check memory usage
ssh root@YOUR_VPS_IP 'free -h'
```

## 💰 **Contabo VPS Costs**

### **VPS Options:**
- **VPS S**: €4.99/month (2GB RAM, 2 cores) - Minimum
- **VPS M**: €8.99/month (4GB RAM, 4 cores) - Recommended
- **VPS L**: €15.99/month (8GB RAM, 6 cores) - Production

### **Additional Costs:**
- Domain: €10-15/year (optional)
- SSL Certificate: FREE (Let's Encrypt)

## 🔒 **Security Features**

- ✅ UFW Firewall configured
- ✅ Fail2ban for intrusion prevention
- ✅ Nginx rate limiting
- ✅ Security headers
- ✅ SSL support (with domain)
- ✅ PM2 process management

## 📊 **Performance Tuning**

For high traffic, optimize in `/opt/youtube-ai-demo/.env`:
```env
# Increase limits
MAX_CONCURRENT_REQUESTS=10
RATE_LIMIT_PER_MINUTE=50
MAX_VIDEO_LENGTH=1200

# Enable caching
ENABLE_REDIS_CACHE=true
```

## 🔄 **Backups**

```bash
# Create backup script
ssh root@YOUR_VPS_IP 'crontab -e'

# Add this line for daily backups at 2 AM:
# 0 2 * * * tar -czf /root/backup-$(date +\%Y\%m\%d).tar.gz /opt/youtube-ai-demo
```

## 📞 **Support**

If deployment fails:
1. Check the script output for error messages
2. Verify VPS connectivity and credentials
3. Ensure VPS meets minimum requirements
4. Check Contabo VPS status in dashboard

Need help? Check the logs and error messages first!