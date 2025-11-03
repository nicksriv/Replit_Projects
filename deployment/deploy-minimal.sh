#!/bin/bash
set -e

echo "🚀 Deploying YouTube AI Demo to AWS (Minimal Cost Setup)"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KEY_NAME="youtube-demo-key"
SECURITY_GROUP_NAME="youtube-demo-sg"
INSTANCE_NAME="youtube-ai-demo"
REGION="us-east-1"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured. Please run: aws configure${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Current AWS Account:${NC}"
aws sts get-caller-identity

# Step 1: Create or use existing key pair
echo -e "\n${YELLOW}🔑 Setting up SSH key pair...${NC}"
if aws ec2 describe-key-pairs --key-name $KEY_NAME --region $REGION >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Key pair '$KEY_NAME' already exists${NC}"
else
    echo -e "${YELLOW}🔧 Creating new key pair...${NC}"
    aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --region $REGION \
        --query 'KeyMaterial' \
        --output text > ${KEY_NAME}.pem
    
    chmod 400 ${KEY_NAME}.pem
    echo -e "${GREEN}✅ Created key pair: ${KEY_NAME}.pem${NC}"
fi

# Step 2: Create security group
echo -e "\n${YELLOW}🛡️  Setting up security group...${NC}"
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --group-names $SECURITY_GROUP_NAME \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "None")

if [ "$SECURITY_GROUP_ID" = "None" ]; then
    echo -e "${YELLOW}🔧 Creating security group...${NC}"
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP_NAME \
        --description "Security group for YouTube AI Demo" \
        --region $REGION \
        --query 'GroupId' \
        --output text)
    
    # Add inbound rules
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 22 --cidr 0.0.0.0/0 \
        --region $REGION
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 \
        --region $REGION
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 443 --cidr 0.0.0.0/0 \
        --region $REGION
    
    echo -e "${GREEN}✅ Created security group: $SECURITY_GROUP_ID${NC}"
else
    echo -e "${GREEN}✅ Security group already exists: $SECURITY_GROUP_ID${NC}"
fi

# Step 3: Get the latest Amazon Linux 2 AMI ID
echo -e "\n${YELLOW}🔍 Finding latest Amazon Linux 2 AMI...${NC}"
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters 'Name=name,Values=amzn2-ami-hvm-*' 'Name=state,Values=available' \
    --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
    --region $REGION \
    --output text)

echo -e "${GREEN}✅ Using AMI: $AMI_ID${NC}"

# Step 4: Check if instance already exists
echo -e "\n${YELLOW}🔍 Checking for existing instance...${NC}"
EXISTING_INSTANCE=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$INSTANCE_NAME" "Name=instance-state-name,Values=running,pending" \
    --region $REGION \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text 2>/dev/null || echo "None")

if [ "$EXISTING_INSTANCE" != "None" ] && [ "$EXISTING_INSTANCE" != "null" ]; then
    echo -e "${YELLOW}⚠️  Instance already running: $EXISTING_INSTANCE${NC}"
    PUBLIC_IP=$(aws ec2 describe-instances \
        --instance-ids $EXISTING_INSTANCE \
        --region $REGION \
        --query 'Reservations[0].Instances[0].PublicIpAddress' \
        --output text)
    echo -e "${GREEN}🌐 Your demo is already available at: http://$PUBLIC_IP${NC}"
    exit 0
fi

# Step 5: Launch EC2 instance
echo -e "\n${YELLOW}🚀 Launching EC2 instance (t2.micro - Free Tier)...${NC}"
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type t2.micro \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data file://deployment/user-data.sh \
    --region $REGION \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}✅ Instance launched: $INSTANCE_ID${NC}"

# Step 6: Wait for instance to be running
echo -e "\n${YELLOW}⏳ Waiting for instance to start (this may take 2-3 minutes)...${NC}"
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# Step 7: Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "\n${GREEN}🎉 Deployment Successful!${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${BLUE}🌐 Demo URL: ${NC}http://$PUBLIC_IP"
echo -e "${BLUE}🔑 SSH Access: ${NC}ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP"
echo -e "${BLUE}📊 Instance ID: ${NC}$INSTANCE_ID"
echo -e "${BLUE}💰 Estimated Cost: ${NC}FREE (first 12 months) or ~$3-5/month after"

echo -e "\n${YELLOW}⏳ Note: The application setup will take 5-10 minutes to complete.${NC}"
echo -e "${YELLOW}📱 You can check the setup progress by SSH-ing into the instance.${NC}"

echo -e "\n${BLUE}🧹 To clean up later, run: ${NC}./deployment/cleanup-demo.sh"

# Save deployment info
cat > deployment/deployment-info.txt << EOF
Deployment completed at: $(date)
Instance ID: $INSTANCE_ID
Public IP: $PUBLIC_IP
Region: $REGION
Key Name: $KEY_NAME
Security Group: $SECURITY_GROUP_ID
Demo URL: http://$PUBLIC_IP
SSH Command: ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP
EOF

echo -e "\n${GREEN}📝 Deployment info saved to: deployment/deployment-info.txt${NC}"