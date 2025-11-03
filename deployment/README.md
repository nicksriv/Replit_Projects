# 🚀 AWS Deployment Guide - YouTube AI Demo

This directory contains scripts for deploying your YouTube AI Knowledge Base to AWS with minimal cost (~$0-5/month).

## 📋 Prerequisites

1. **AWS Account** with free tier available
2. **AWS CLI** configured with your credentials
3. **API Keys** for OpenAI and Sarvam AI

### Setup AWS CLI
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure with your credentials
aws configure
```

## 🎯 Quick Deploy (One Command)

```bash
# Make scripts executable
chmod +x deployment/*.sh

# Deploy to AWS (creates everything automatically)
./deployment/deploy-minimal.sh
```

## 📁 Files Overview

- **`deploy-minimal.sh`** - Main deployment script (creates EC2, security groups, etc.)
- **`user-data.sh`** - Auto-setup script that runs on EC2 instance boot
- **`cleanup-demo.sh`** - Removes all AWS resources to stop charges
- **`.env.production`** - Production environment configuration
- **`../drizzle.config.minimal.ts`** - SQLite database config (saves $20-30/month vs RDS)

## 🔧 Before Deployment

1. **Update API Keys** in `deployment/.env.production`:
   ```bash
   # Edit the file and add your real API keys
   nano deployment/.env.production
   ```

2. **Update Repository URL** in `deployment/user-data.sh` (line 25):
   ```bash
   # Change this line to your actual GitHub repository
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
   ```

## 🚀 Deployment Steps

### Step 1: Deploy Infrastructure
```bash
./deployment/deploy-minimal.sh
```

This will:
- ✅ Create EC2 t2.micro instance (Free Tier)
- ✅ Setup security groups and SSH key
- ✅ Auto-install Node.js, nginx, and dependencies
- ✅ Configure SQLite database
- ✅ Start your application with PM2

### Step 2: Wait for Setup
- Initial deployment: ~2 minutes
- Application setup: ~5-10 minutes
- You'll get a URL like: `http://3.85.123.45`

### Step 3: Verify Deployment
```bash
# SSH into your instance (optional)
ssh -i youtube-demo-key.pem ec2-user@YOUR_PUBLIC_IP

# Check application status
./check-status.sh
```

## 💰 Cost Breakdown

### Free Tier (First 12 months):
- **EC2 t2.micro**: FREE (750 hours/month)
- **Storage**: FREE (30GB EBS)
- **Data Transfer**: FREE (15GB/month)
- **Total**: $0/month ✨

### After Free Tier:
- **EC2 t3.nano**: $3.50/month
- **Storage**: $0.80/month
- **Data Transfer**: $1-2/month
- **Total**: ~$5-6/month

## 🧹 Cleanup (Stop All Charges)

When you're done with the demo:

```bash
./deployment/cleanup-demo.sh
```

This removes ALL AWS resources and stops billing immediately.

## 🔍 Monitoring & Troubleshooting

### Check Application Status
```bash
# SSH into instance
ssh -i youtube-demo-key.pem ec2-user@YOUR_PUBLIC_IP

# Check PM2 processes
pm2 status

# View application logs
pm2 logs youtube-demo

# Check nginx status
sudo systemctl status nginx

# View system logs
tail -f /var/log/user-data.log
```

### Common Issues

1. **Application not loading**: Wait 5-10 minutes for setup to complete
2. **502 Bad Gateway**: Node.js app may still be installing dependencies
3. **Can't SSH**: Check security group allows port 22 from your IP

## 📊 Architecture

```
Internet → AWS Load Balancer → EC2 (nginx) → Node.js App → SQLite DB
                                                      ↓
                              OpenAI API ← → Sarvam API
```

## 🔐 Security Notes

- Default security group allows HTTP (80), HTTPS (443), and SSH (22)
- SSH key is automatically generated and saved as `youtube-demo-key.pem`
- Keep your API keys secure - never commit them to git

## 🚀 Scaling for Production

If you want to upgrade from demo to production:

1. **Database**: Migrate from SQLite to RDS PostgreSQL
2. **Compute**: Upgrade to t3.small or larger
3. **Load Balancer**: Add Application Load Balancer
4. **SSL**: Add CloudFront with SSL certificate
5. **Monitoring**: Setup CloudWatch alerts

Cost for production setup: ~$50-100/month

## 📞 Support

If deployment fails:
1. Check AWS CLI is configured: `aws sts get-caller-identity`
2. Verify you have appropriate AWS permissions
3. Check the deployment logs in the terminal output
4. Try cleanup and redeploy if needed

---

**Need help?** Check the deployment logs or create an issue in the repository.