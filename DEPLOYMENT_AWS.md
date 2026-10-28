# GeoMine AI — Cloud Architecture & AWS Deployment Guide

This document details the complete deployment workflow for **GeoMine AI — Smart Governance and Compliance Monitoring System for Coal & Mineral Mines** to Amazon Web Services (AWS) using **AWS Amplify**, **Amazon ECS / Fargate**, **Neon PostgreSQL**, and **Amazon S3**.

---

## 1. System Architecture Overview

```
                                      AWS CLOUD
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                                                             │
 │    ┌────────────────────────┐                   ┌───────────────────────┐   │
 │    │  AWS Amplify / CloudFront  ◄─── HTTPS ────►│   User Web Browser    │   │
 │    │   (React 19 Vite SPA)  │                   │ (Admin, Officer, ...) │   │
 │    └───────────┬────────────┘                   └───────────────────────┘   │
 │                │                                            ▲               │
 │                │ API Calls (REST / JSON)                    │               │
 │                ▼                                            │ Direct S3     │
 │    ┌────────────────────────┐                               │ Imagery       │
 │    │ Application Load Balancer                              │ URLs          │
 │    └───────────┬────────────┘                               │               │
 │                ▼                                            │               │
 │    ┌────────────────────────┐                   ┌───────────┴───────────┐   │
 │    │   Amazon ECS / Fargate │                   │    Amazon S3 Bucket   │   │
 │    │ (FastAPI Docker Tasks) ├──────────────────►│ (Satellite & Evidence)│   │
 │    └───────────┬────────────┘                   └───────────────────────┘   │
 │                │                                                            │
 └────────────────┼────────────────────────────────────────────────────────────┘
                  │ Encrypted TLS / SSL Connection
                  ▼
       ┌────────────────────────┐
       │   Neon Serverless      │
       │   PostgreSQL           │
       │ (38 Districts, 146 Mines)
       └────────────────────────┘
```

---

## 2. Prerequisites

1. **AWS CLI** installed and configured (`aws configure`).
2. **Docker Desktop** installed.
3. **Neon PostgreSQL Account** ([https://neon.tech](https://neon.tech)):
   - Create a project: `geomine-prod`.
   - Copy the connection string:
     `postgresql://<user>:<password>@<ep-name>.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## 3. Step 1: Database Setup on Neon

1. Log into [Neon Console](https://console.neon.tech).
2. Create a database called `geominedb`.
3. In your local backend or CI/CD pipeline, set the environment variable:
   ```bash
   DATABASE_URL="postgresql://<user>:<password>@<ep-name>.us-east-2.aws.neon.tech/geominedb?sslmode=require"
   ```
4. Run the automated database seeder to populate all 38 districts and 146 verified mines:
   ```bash
   python backend/app/seed.py
   ```

---

## 4. Step 2: Containerize Backend with Amazon ECR & ECS Fargate

### A. Create Amazon ECR Repository
```bash
aws ecr create-repository --repository-name geomine-backend --region ap-south-1
```

### B. Build, Tag, and Push Docker Image
```bash
# 1. Authenticate Docker with Amazon ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com

# 2. Build backend Docker image
docker build -t geomine-backend ./backend

# 3. Tag image
docker tag geomine-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/geomine-backend:latest

# 4. Push image
docker push <AWS_ACCOUNT_ID>.dkr.ecr.ap-south-1.amazonaws.com/geomine-backend:latest
```

### C. Deploy on Amazon ECS / Fargate
1. Create an ECS Cluster:
   ```bash
   aws ecs create-cluster --cluster-name geomine-cluster --region ap-south-1
   ```
2. Store secrets in **AWS Secrets Manager**:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `SECRET_KEY`: High-entropy 64-character secret key.
3. Configure the Task Definition with:
   - Memory: `1024 MB`, CPU: `512` (0.5 vCPU).
   - Port mappings: `8000:8000`.
   - Health check: `curl -f http://localhost:8000/api/health || exit 1`.
4. Create an Application Load Balancer (ALB) pointing to the ECS Service.

---

## 5. Step 3: Frontend Deployment on AWS Amplify

1. Push your repository to **GitHub** / **AWS CodeCommit**.
2. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify).
3. Select **Host web app** $\rightarrow$ connect your Git repository $\rightarrow$ choose `main` branch.
4. Amplify auto-detects Vite. Verify the build configuration:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
5. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://api.yourdomain.com/api` (or your ALB DNS URL).
6. Click **Save and Deploy**. AWS Amplify will automatically build, optimize, and deploy the React 19 app across CloudFront edge locations.

---

## 6. Step 4: Amazon S3 for Satellite Evidence & Photographs

1. Create a private S3 bucket: `geomine-evidence-storage`.
2. Enable CORS configuration for the bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["https://*.amplifyapp.com", "http://localhost:5173"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
3. Use presigned S3 URLs from FastAPI for direct browser-to-S3 uploads without proxying heavy imagery through the backend container.

---

## 7. Local Testing Before Cloud Deployment

To test the entire containerized stack locally before deploying to AWS:

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:5173`
- **FastAPI API**: `http://localhost:8000`
- **Swagger Documentation**: `http://localhost:8000/docs`
- **Local PostgreSQL**: `localhost:5432`

