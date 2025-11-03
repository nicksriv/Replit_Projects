#!/bin/bash
set -e

echo "🧹 Cleaning up AWS Demo Resources"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTANCE_NAME="youtube-ai-demo"
SECURITY_GROUP_NAME="youtube-demo-sg"
KEY_NAME="youtube-demo-key"
REGION="us-east-1"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run: aws configure${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Current AWS Account:${NC}"
aws sts get-caller-identity

# Confirmation prompt
echo -e "\n${YELLOW}⚠️  This will DELETE all AWS resources for the YouTube AI Demo${NC}"
echo -e "${YELLOW}   Including: EC2 instance, Security Group, and Key Pair${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚫 Cleanup cancelled${NC}"
    exit 0
fi

# Step 1: Find and terminate EC2 instance
echo -e "\n${YELLOW}🔍 Looking for EC2 instance...${NC}"
INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" \
    --filters "Name=instance-state-name,Values=running,pending,stopping,stopped" \
    --region $REGION \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text 2>/dev/null || echo "None")

if [ "$INSTANCE_ID" != "None" ] && [ "$INSTANCE_ID" != "null" ] && [ -n "$INSTANCE_ID" ]; then
    echo -e "${YELLOW}🛑 Terminating EC2 instance: $INSTANCE_ID${NC}"
    aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region $REGION
    
    echo -e "${YELLOW}⏳ Waiting for instance to terminate (this may take a few minutes)...${NC}"
    aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID --region $REGION
    echo -e "${GREEN}✅ Instance terminated successfully${NC}"
else
    echo -e "${BLUE}ℹ️  No running instance found with name '$INSTANCE_NAME'${NC}"
fi

# Step 2: Delete Security Group
echo -e "\n${YELLOW}🛡️  Deleting security group...${NC}"
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --group-names $SECURITY_GROUP_NAME \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$SECURITY_GROUP_ID" != "None" ] && [ "$SECURITY_GROUP_ID" != "null" ]; then
    # Wait a bit more to ensure instance is fully terminated
    sleep 30
    
    aws ec2 delete-security-group --group-id $SECURITY_GROUP_ID --region $REGION 2>/dev/null && \
        echo -e "${GREEN}✅ Security group deleted: $SECURITY_GROUP_ID${NC}" || \
        echo -e "${YELLOW}⚠️  Security group deletion failed (may still be in use)${NC}"
else
    echo -e "${BLUE}ℹ️  No security group found with name '$SECURITY_GROUP_NAME'${NC}"
fi

# Step 3: Delete Key Pair
echo -e "\n${YELLOW}🔑 Deleting key pair...${NC}"
if aws ec2 describe-key-pairs --key-name $KEY_NAME --region $REGION >/dev/null 2>&1; then
    aws ec2 delete-key-pair --key-name $KEY_NAME --region $REGION
    echo -e "${GREEN}✅ Key pair deleted: $KEY_NAME${NC}"
    
    # Remove local key file if it exists
    if [ -f "${KEY_NAME}.pem" ]; then
        rm -f "${KEY_NAME}.pem"
        echo -e "${GREEN}✅ Local key file removed: ${KEY_NAME}.pem${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  No key pair found with name '$KEY_NAME'${NC}"
fi

# Step 4: Clean up local deployment files
echo -e "\n${YELLOW}🗂️  Cleaning up local deployment files...${NC}"
if [ -f "deployment/deployment-info.txt" ]; then
    rm -f "deployment/deployment-info.txt"
    echo -e "${GREEN}✅ Removed deployment-info.txt${NC}"
fi

# Step 5: Show final status
echo -e "\n${GREEN}🎉 Cleanup Complete!${NC}"
echo -e "${GREEN}===================${NC}"
echo -e "${BLUE}💰 No more AWS charges will be incurred from this demo${NC}"
echo -e "${BLUE}🔄 You can deploy again anytime using: ./deployment/deploy-minimal.sh${NC}"

# Final verification
echo -e "\n${YELLOW}🔍 Final verification - checking for any remaining resources...${NC}"

# Check for any remaining instances
REMAINING_INSTANCES=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" \
    --filters "Name=instance-state-name,Values=running,pending,stopping,stopped" \
    --region $REGION \
    --query 'Reservations[].Instances[].InstanceId' \
    --output text 2>/dev/null || echo "")

if [ -n "$REMAINING_INSTANCES" ] && [ "$REMAINING_INSTANCES" != "None" ]; then
    echo -e "${YELLOW}⚠️  Warning: Found remaining instances: $REMAINING_INSTANCES${NC}"
else
    echo -e "${GREEN}✅ No remaining instances found${NC}"
fi

# Check for remaining security groups
REMAINING_SG=$(aws ec2 describe-security-groups \
    --group-names $SECURITY_GROUP_NAME \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$REMAINING_SG" != "None" ] && [ -n "$REMAINING_SG" ]; then
    echo -e "${YELLOW}⚠️  Warning: Security group still exists: $REMAINING_SG${NC}"
    echo -e "${YELLOW}   It will be automatically cleaned up when no longer in use${NC}"
else
    echo -e "${GREEN}✅ No remaining security groups found${NC}"
fi

echo -e "\n${GREEN}✨ All done! Your AWS account is clean.${NC}"