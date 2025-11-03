#!/bin/bash
# Quick setup script for AWS deployment

echo "🚀 YouTube AI Demo - AWS Setup Helper"
echo "===================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   macOS: brew install awscli"
    echo "   Linux: sudo apt install awscli"
    echo "   Windows: Download from https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please configure it first:"
    echo "   Run: aws configure"
    echo "   You'll need:"
    echo "   - AWS Access Key ID"
    echo "   - AWS Secret Access Key" 
    echo "   - Default region (e.g., us-east-1)"
    echo "   - Default output format (json)"
    exit 1
fi

echo "✅ AWS CLI is configured"
aws sts get-caller-identity

# Check for API keys
echo -e "\n🔑 API Keys Setup"
if [ -f ".env" ]; then
    echo "✅ Found .env file"
    if grep -q "your-.*-key-here" .env; then
        echo "⚠️  Warning: Default API keys detected in .env file"
        echo "   Please update with your actual keys before deploying"
    fi
else
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your actual API keys:"
    echo "   - OPENAI_API_KEY (get from https://platform.openai.com)"
    echo "   - SARVAM_API_KEY (get from https://www.sarvam.ai)"
fi

echo -e "\n📋 Pre-deployment Checklist:"
echo "   ✅ AWS CLI installed and configured"
echo "   ⚠️  Update API keys in .env file"
echo "   ⚠️  Update GitHub repository URL in deployment/user-data.sh"

echo -e "\n🚀 Ready to deploy? Run:"
echo "   ./deployment/deploy-minimal.sh"

echo -e "\n🧹 To cleanup later, run:"
echo "   ./deployment/cleanup-demo.sh"

echo -e "\n💰 Estimated costs:"
echo "   - First 12 months: FREE (AWS Free Tier)"
echo "   - After free tier: ~$3-5/month"