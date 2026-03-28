# AI Insurance Adjuster

> From accident photo to claim decision in under 10 seconds.

An end-to-end AI pipeline that automates auto insurance claims — detecting damage, estimating repair costs, and scoring fraud risk from photos alone. Built for insurers who want to cut settlement time from days to hours without replacing their existing claims infrastructure.

\---

## How It Works

```
Photo Upload → Image Processing → Damage Detection → Cost Model + Fraud Engine → Claim Report → Adjuster Review
```

|Stage|What happens|Time|
|-|-|-|
|**Intake**|Photos uploaded, VIN decoded, EXIF validated|<1s|
|**Image Processing**|CLAHE normalization, vehicle segmentation, tiling|\~0.5s|
|**Damage Detection**|YOLOv8-L identifies damage class, severity, panel|\~0.8s|
|**Cost Estimation**|XGBoost regression → P10/P50/P90 repair range|\~0.2s|
|**Fraud Scoring**|ELA forensics + physics + policy signals → 0–100 score|\~0.3s|
|**Report**|Annotated photos, itemized costs, fraud summary, shop options|\~0.5s|
|**Total**||**\~3.3s** (+ network)|

\---

## Key Numbers

|Metric|Value|
|-|-|
|Average end-to-end processing|5.8 seconds|
|Damage detection mAP @ IoU 0.5|0.87|
|Cost estimate within ±15% of realized|82% of claims|
|Fraud precision @ 0.7 threshold|91%|
|Claims auto-approved (no human touch)|63%|
|Adjuster time saved|70%|

\---

## Tech Stack

### Frontend

* React / Next.js
* Tailwind CSS + Framer Motion
* WebSocket for real-time status
* PWA with offline upload queue

### Backend

* Node.js API gateway
* FastAPI ML microservices
* JWT authentication
* Redis job queue
* PostgreSQL + pgvector

### AI / ML

* **YOLOv8-L** — damage detection (PyTorch, fine-tuned on 180K images)
* **XGBoost** — cost regression (trained on 2.4M historical claims)
* **OpenCV** — image preprocessing (CLAHE, segmentation, tiling)
* **ELA model** — fraud image forensics
* **MLflow** — experiment tracking and model registry

### Infrastructure

* Docker + Kubernetes
* A10G GPU node pool
* AWS S3 object storage
* Terraform IaC
* GitHub Actions CI/CD

\---

## Getting Started

### Prerequisites

* Docker + Docker Compose
* Python 3.11+
* Node.js 20+
* NVIDIA GPU with CUDA 12.x (CPU fallback available, \~8× slower)

### 1\. Clone and configure

```bash
git clone https://github.com/your-org/ai-insurance-adjuster.git
cd ai-insurance-adjuster
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
POSTGRES\_PASSWORD=your\_strong\_password
JWT\_SECRET=your\_jwt\_secret
S3\_BUCKET=your-claims-bucket
AWS\_ACCESS\_KEY\_ID=...
AWS\_SECRET\_ACCESS\_KEY=...

# Optional integrations
NHTSA\_API\_KEY=           # VIN decode (free tier, no key needed)
REPAIR\_NETWORK\_API\_KEY=  # Parts pricing
CARFAX\_API\_KEY=          # Vehicle history
```

### 2\. Start services

```bash
docker compose up -d
```

This starts:

* `adjuster-api` — Node.js gateway on port 3000
* `ml-service` — FastAPI + GPU on port 8000
* `postgres` — Claims database on port 5432
* `redis` — Job queue on port 6379

### 3\. Download model weights

```bash
./scripts/download\_models.sh
```

Downloads YOLOv8-L fine-tuned weights (\~140 MB) and the XGBoost cost model to `./models/`.

### 4\. Open the app

```
http://localhost:3000
```

\---

## Project Structure

```
ai-insurance-adjuster/
├── frontend/               # Next.js app
│   ├── app/
│   ├── components/
│   └── public/
├── api/                    # Node.js gateway
│   ├── routes/
│   ├── middleware/
│   └── integrations/
├── ml/                     # FastAPI ML service
│   ├── detection/          # YOLOv8 inference
│   ├── cost/               # XGBoost cost model
│   ├── fraud/              # Fraud ensemble
│   └── preprocessing/      # OpenCV pipeline
├── models/                 # Model weights (gitignored)
├── infra/                  # Terraform + Kubernetes manifests
├── scripts/                # Setup and utility scripts
├── docs/                   # Additional documentation
└── docker-compose.yml
```

\---

## API Reference

### Submit a claim

```http
POST /api/claims
Content-Type: multipart/form-data
Authorization: Bearer <token>

photos\[]        required  JPEG/HEIC/PNG/WebP, max 20 MB each
policy\_number   required  string
vin             required  17-character VIN
description     optional  string, incident description
```

### Get claim status

```http
GET /api/claims/:id
Authorization: Bearer <token>
```

### Get claim report

```http
GET /api/claims/:id/report
Accept: application/json | application/pdf
Authorization: Bearer <token>
```

\---

## Fraud Score Routing

|Score|Action|% of claims|
|-|-|-|
|0–39|Auto-approved|63%|
|40–69|Adjuster review|31%|
|70–100|SIU escalation|6%|

\---

## Deployment

### Production (Kubernetes)

```bash
# Apply infrastructure
terraform -chdir=infra/terraform apply

# Deploy to cluster
kubectl apply -f infra/k8s/

# Verify GPU nodes
kubectl get nodes -l accelerator=nvidia-a10g
```

### GPU vs. CPU

The ML service detects GPU availability automatically. CPU fallback works but increases inference time from \~0.8s to \~6.5s per claim. Not recommended for production throughput above \~50 claims/hour.

\---

## License

Proprietary. See [LICENSE.md](LICENSE.md) for terms.

Commercial use of the bundled YOLOv8 weights requires an [Ultralytics enterprise license](https://ultralytics.com/license).

\---

## Contributing

This is a closed-source project. External contributions are not accepted at this time. Bug reports and security disclosures can be sent to **ai-insurance-adjuster@komplex.health**

For security vulnerabilities, please email directly rather than opening a public issue.

