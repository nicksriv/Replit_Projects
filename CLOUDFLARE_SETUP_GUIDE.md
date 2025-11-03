# Cloudflare Subdomain Setup Guide
## Deploying YouTube AI LMS to lms.codescribed.com

---

## 🎯 Overview

This guide will help you deploy the YouTube AI LMS application to your custom subdomain **lms.codescribed.com** using Cloudflare DNS and SSL.

**Final URL:** https://lms.codescribed.com

---

## 📋 Prerequisites

- [x] Domain: codescribed.com (managed by Cloudflare)
- [x] VPS Server: 213.199.48.187 (Contabo)
- [x] Application built and ready to deploy

---

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
./deploy-cloudflare.sh
```

This will:
1. Build the application
2. Upload files to VPS
3. Configure nginx
4. Restart services
5. Show you the Cloudflare DNS setup instructions

### Option 2: Manual Deployment

```bash
# 1. Build
npm run build

# 2. Upload
scp -r dist package.json root@213.199.48.187:/apps/youtube-ai/

# 3. Configure nginx
scp nginx-cloudflare.conf root@213.199.48.187:/etc/nginx/sites-available/lms-codescribed
ssh root@213.199.48.187 'ln -sf /etc/nginx/sites-available/lms-codescribed /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx'

# 4. Restart app
ssh root@213.199.48.187 'cd /apps/youtube-ai && pm2 restart youtube-ai'
```

---

## ☁️ Cloudflare Configuration

### Step 1: Access Cloudflare Dashboard

1. Go to https://dash.cloudflare.com/
2. Login with your Cloudflare credentials
3. Select **codescribed.com** from your domains list

### Step 2: Add DNS Record

1. Click on **DNS** in the left sidebar
2. Click **Add record** button
3. Configure the A record:

```
┌─────────────────────────────────────────────┐
│ Type:       A                               │
│ Name:       lms                             │
│ IPv4:       213.199.48.187                  │
│ Proxy:      ☁️  Proxied (Orange Cloud ON)  │
│ TTL:        Auto                            │
└─────────────────────────────────────────────┘
```

4. Click **Save**

**Important:** Make sure the **Orange Cloud is ON** (Proxied) to enable Cloudflare's CDN, DDoS protection, and SSL.

### Step 3: Configure SSL/TLS

1. Go to **SSL/TLS** → **Overview**
2. Select encryption mode: **Full** or **Full (strict)**

**Recommended:** Full (strict) - Most secure option

- **Off:** No SSL (not recommended)
- **Flexible:** Cloudflare to visitor only (not recommended)
- **Full:** End-to-end encryption (recommended)
- **Full (strict):** End-to-end with certificate validation (most secure)

### Step 4: Configure Page Rules (Optional but Recommended)

Optimize asset caching:

1. Go to **Rules** → **Page Rules**
2. Click **Create Page Rule**
3. Configure:

**Rule 1: Asset Caching**
```
URL: lms.codescribed.com/assets/*
Settings:
  • Browser Cache TTL: 1 day
  • Cache Level: Cache Everything
  • Edge Cache TTL: 1 day
```

**Rule 2: API No Cache**
```
URL: lms.codescribed.com/api/*
Settings:
  • Cache Level: Bypass
```

### Step 5: Additional Security (Optional)

**Firewall Rules:**
1. Go to **Security** → **WAF**
2. Enable **Web Application Firewall**

**Rate Limiting:**
1. Go to **Security** → **Rate Limiting**
2. Create rule for API endpoints if needed

---

## 🔧 VPS Nginx Configuration

The nginx configuration includes:

### Features:
- ✅ Cloudflare real IP detection
- ✅ Security headers
- ✅ Asset caching
- ✅ API proxying
- ✅ Health check endpoint
- ✅ WebSocket support

### Configuration File Location:
```
/etc/nginx/sites-available/lms-codescribed
/etc/nginx/sites-enabled/lms-codescribed -> /etc/nginx/sites-available/lms-codescribed
```

### Test Nginx Config:
```bash
ssh root@213.199.48.187 'nginx -t'
```

### Reload Nginx:
```bash
ssh root@213.199.48.187 'systemctl reload nginx'
```

---

## ✅ Verification Steps

### 1. Check DNS Propagation

Visit: https://dnschecker.org/#A/lms.codescribed.com

You should see: **213.199.48.187** globally

### 2. Test HTTP Response

```bash
curl -I http://lms.codescribed.com/health
```

Expected: `HTTP/1.1 200 OK`

### 3. Test HTTPS (After SSL setup)

```bash
curl -I https://lms.codescribed.com/health
```

Expected: `HTTP/2 200` with Cloudflare headers

### 4. Browser Test

Open: https://lms.codescribed.com

You should see the LMS dashboard with:
- ✅ Vertx logo
- ✅ Navigation sidebar icons
- ✅ Course cards with images
- ✅ Performance metrics
- ✅ All UI elements loading correctly

---

## 🔍 Troubleshooting

### Issue: DNS not resolving

**Solution:**
1. Check DNS record in Cloudflare
2. Wait 2-5 minutes for propagation
3. Clear browser cache: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. Check DNS: `nslookup lms.codescribed.com`

### Issue: 502 Bad Gateway

**Solution:**
```bash
# Check if app is running
ssh root@213.199.48.187 'pm2 status'

# Check app logs
ssh root@213.199.48.187 'pm2 logs youtube-ai --lines 20'

# Check nginx logs
ssh root@213.199.48.187 'tail -f /var/log/nginx/error.log'

# Restart app
ssh root@213.199.48.187 'pm2 restart youtube-ai'
```

### Issue: SSL Certificate Error

**Solution:**
1. Make sure SSL/TLS mode is set to **Full** in Cloudflare
2. Orange cloud should be ON (Proxied)
3. Wait 1-2 minutes for SSL to activate

### Issue: Assets not loading

**Solution:**
1. Clear Cloudflare cache:
   - Cloudflare Dashboard → Caching → Purge Everything
2. Check nginx configuration
3. Verify base path is "/" in vite.config.ts

---

## 📊 Performance Optimization

### Cloudflare Settings

**Speed → Optimization:**
- ✅ Auto Minify: HTML, CSS, JS
- ✅ Brotli compression
- ✅ Rocket Loader: Off (can interfere with React)

**Caching → Configuration:**
- ✅ Caching Level: Standard
- ✅ Browser Cache TTL: Respect Existing Headers

**Network:**
- ✅ HTTP/2: Enabled
- ✅ HTTP/3 (QUIC): Enabled
- ✅ WebSockets: Enabled

---

## 🔐 Security Best Practices

1. **SSL/TLS:** Use Full (strict) mode
2. **HSTS:** Enable HTTP Strict Transport Security
3. **Firewall:** Enable Web Application Firewall
4. **DDoS Protection:** Automatically enabled with Cloudflare
5. **Rate Limiting:** Configure for API endpoints

---

## 📈 Monitoring

### Cloudflare Analytics
- Dashboard → Analytics → Traffic
- View visitors, bandwidth, threats blocked

### Server Monitoring
```bash
# Check PM2 status
ssh root@213.199.48.187 'pm2 monit'

# Check logs
ssh root@213.199.48.187 'pm2 logs youtube-ai'

# Check server resources
ssh root@213.199.48.187 'htop'
```

---

## 🔄 Future Deployments

For future updates, simply run:

```bash
./deploy-cloudflare.sh
```

This will rebuild and deploy the latest version without reconfiguring DNS or nginx.

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PM2 logs: `ssh root@213.199.48.187 'pm2 logs youtube-ai'`
3. Review nginx logs: `ssh root@213.199.48.187 'tail -f /var/log/nginx/error.log'`

---

## ✨ Success Checklist

- [ ] DNS A record created in Cloudflare
- [ ] Orange cloud enabled (Proxied)
- [ ] SSL/TLS set to Full or Full (strict)
- [ ] Application deployed to VPS
- [ ] Nginx configured and reloaded
- [ ] PM2 process running
- [ ] Health check returns 200
- [ ] Browser can access https://lms.codescribed.com
- [ ] All assets and icons loading correctly
- [ ] SSL certificate valid (green padlock)

---

**🎉 Congratulations!** Your LMS is now live at **https://lms.codescribed.com**
