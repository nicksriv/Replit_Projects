# Quick Reference: Cloudflare DNS Setup
## For lms.codescribed.com

---

## 🎯 What You Need to Do in Cloudflare

### 1. Login to Cloudflare
→ https://dash.cloudflare.com/
→ Select: **codescribed.com**

---

### 2. Add DNS Record

**Navigation:** DNS → Records → Add record

```
┌───────────────────────────────────────┐
│ TYPE:    A                            │
│ NAME:    lms                          │
│ IPv4:    213.199.48.187               │
│ PROXY:   ☁️  ON (Orange Cloud)       │
│ TTL:     Auto                         │
└───────────────────────────────────────┘
```

**Click:** Save

---

### 3. Configure SSL

**Navigation:** SSL/TLS → Overview

**Select:** Full (strict)

```
┌─────────────────────────────────┐
│ ○ Off                           │
│ ○ Flexible                      │
│ ○ Full                          │
│ ● Full (strict) ← SELECT THIS  │
└─────────────────────────────────┘
```

---

### 4. Wait 2-5 Minutes

DNS propagation is usually instant with Cloudflare

---

### 5. Test

Open in browser:
```
https://lms.codescribed.com
```

You should see:
- ✅ Green padlock (SSL)
- ✅ LMS Dashboard
- ✅ All icons and images

---

## ⚡ Deploy to VPS

On your local machine, run:

```bash
./deploy-cloudflare.sh
```

Type `y` when prompted.

---

## 🎉 That's It!

Your LMS will be live at:
**https://lms.codescribed.com**

---

## 🔍 Verify DNS

Check if DNS is propagated:
https://dnschecker.org/#A/lms.codescribed.com

Should show: **213.199.48.187** worldwide

---

## ❓ Need Help?

See: CLOUDFLARE_SETUP_GUIDE.md
