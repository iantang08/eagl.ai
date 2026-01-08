# Infrastructure - AWS Resources

This directory contains Terraform configurations for deploying eagl.ai to AWS.

**Status: Skeleton only - not fully provisioned**

## AWS Resources Required

### Networking
- **VPC** with public and private subnets
- **NAT Gateway** for private subnet internet access
- **Security Groups** for API, worker, and RDS

### Compute
- **ECS Cluster** with Fargate
- **ECS Service - API** (FastAPI application)
  - Desired count: 2
  - CPU: 512, Memory: 1024
  - Port: 8000
- **ECS Service - Worker** (Celery worker)
  - Desired count: 2
  - CPU: 1024, Memory: 2048
  - No public port

### Database
- **RDS PostgreSQL** (db.t3.micro for MVP)
  - Multi-AZ: false (enable for production)
  - Storage: 20GB gp3
  - Automated backups: 7 days

### Cache/Queue
- **ElastiCache Redis** (cache.t3.micro)
  - Single node for MVP
  - Used for Celery broker and result backend

### Storage
- **S3 Bucket - Uploads** (eaglai-uploads-{env})
  - Raw video uploads
  - CORS configured for presigned uploads
  - Lifecycle: Move to IA after 30 days
- **S3 Bucket - Results** (eaglai-results-{env})
  - Analysis results JSON
  - Thumbnails
  - Lifecycle: Expire after 1 year

### Load Balancing
- **Application Load Balancer**
  - HTTPS listener (port 443)
  - HTTP redirect to HTTPS
  - Target group for API service

### DNS/SSL
- **Route 53** hosted zone
- **ACM Certificate** for api.eagl.ai

### Secrets
- **Secrets Manager**
  - Database credentials
  - JWT secret
  - RevenueCat webhook secret

### Monitoring
- **CloudWatch Log Groups**
  - /ecs/eaglai-api
  - /ecs/eaglai-worker
- **CloudWatch Alarms**
  - API 5xx rate
  - Worker queue depth
  - RDS CPU/connections

### IAM
- **ECS Task Role**
  - S3 read/write to upload and results buckets
  - Secrets Manager read
- **ECS Execution Role**
  - ECR pull
  - CloudWatch Logs

## Estimated Monthly Costs (MVP)

| Resource | Type | Est. Cost |
|----------|------|-----------|
| ECS Fargate (API) | 2x 0.5vCPU/1GB | ~$30 |
| ECS Fargate (Worker) | 2x 1vCPU/2GB | ~$60 |
| RDS PostgreSQL | db.t3.micro | ~$15 |
| ElastiCache Redis | cache.t3.micro | ~$12 |
| S3 | Variable | ~$5 |
| ALB | Per hour + LCU | ~$20 |
| NAT Gateway | Per hour + data | ~$35 |
| **Total** | | **~$177/mo** |

## Environment Variables for Production

```hcl
# API Service
DATABASE_URL        = "postgresql://..." (from Secrets Manager)
REDIS_URL           = "redis://elasticache-endpoint:6379/0"
JWT_SECRET          = "..." (from Secrets Manager)
USE_LOCAL_STORAGE   = "false"
AWS_S3_BUCKET       = "eaglai-uploads-prod"
AWS_S3_RESULTS_BUCKET = "eaglai-results-prod"
AWS_REGION          = "us-east-1"

# Worker Service
# Same as API plus:
CELERY_BROKER_URL   = "redis://elasticache-endpoint:6379/0"
```

## Deployment Steps (Future)

1. Configure AWS credentials
2. Initialize Terraform: `terraform init`
3. Review plan: `terraform plan`
4. Apply: `terraform apply`
5. Push Docker images to ECR
6. Update ECS services

## Files to Create

```
terraform/
├── main.tf           # Provider, backend config
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── vpc.tf            # VPC, subnets, NAT
├── ecs.tf            # Cluster, services, tasks
├── rds.tf            # PostgreSQL instance
├── elasticache.tf    # Redis cluster
├── s3.tf             # Buckets and policies
├── alb.tf            # Load balancer
├── iam.tf            # Roles and policies
├── secrets.tf        # Secrets Manager
├── cloudwatch.tf     # Logs and alarms
└── terraform.tfvars  # Variable values (gitignored)
```
