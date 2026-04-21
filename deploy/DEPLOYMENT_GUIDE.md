# Kinetic Deployment Guide (Minikube + Jenkins)

This guide is built for a free local Kubernetes deployment first (Minikube), with Jenkins automating build and deployment.

## 1) Architecture

- Frontend: Next.js app, served on port 3000
- Backend: Laravel app behind Nginx + PHP-FPM, served on port 8080
- Database: PostgreSQL in-cluster (local dev use only)
- Ingress: NGINX Ingress routes traffic via host kinetic.local

Routing:
- /api -> backend
- /sanctum -> backend
- /up -> backend (health)
- / -> frontend

## 2) Files Added

- frontend/Dockerfile
- frontend/.dockerignore
- deploy/k8s/minikube/00-namespace.yaml
- deploy/k8s/minikube/01-configmap.yaml
- deploy/k8s/minikube/02-secrets.template.yaml
- deploy/k8s/minikube/03-postgres.yaml
- deploy/k8s/minikube/04-backend.yaml
- deploy/k8s/minikube/05-frontend.yaml
- deploy/k8s/minikube/06-ingress.yaml
- Jenkinsfile

## 3) Prerequisites

Install locally:
- Docker Desktop
- kubectl
- Minikube
- Jenkins (or Jenkins in Docker)

Start Minikube and enable ingress:

```bash
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
```

Map local host:

1. Get Minikube IP:

```bash
minikube ip
```

2. Add host entry in your OS hosts file:

```text
<MINIKUBE_IP> kinetic.local
```

## 4) Build and Deploy Manually (First Run)

From repo root:

```bash
docker build -t kinetic-backend:latest backend

docker build -t kinetic-frontend:latest \
  --build-arg NEXT_PUBLIC_AUTH_MODE=api \
  --build-arg NEXT_PUBLIC_AUTH_BACKEND=laravel-sanctum \
  --build-arg NEXT_PUBLIC_AUTH_API_BASE_URL= \
  --build-arg NEXT_PUBLIC_AUTH_INCLUDE_CREDENTIALS=true \
  --build-arg NEXT_PUBLIC_AUTH_CSRF_ENDPOINT=/sanctum/csrf-cookie \
  --build-arg NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/api/login \
  --build-arg NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT=/api/register \
  --build-arg NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT=/api/logout \
  --build-arg NEXT_PUBLIC_AUTH_USER_ENDPOINT=/api/user \
  frontend
```

Load images into Minikube:

```bash
minikube image load kinetic-backend:latest
minikube image load kinetic-frontend:latest
```

Apply manifests:

```bash
kubectl apply -f deploy/k8s/minikube/00-namespace.yaml
kubectl apply -f deploy/k8s/minikube/01-configmap.yaml
kubectl apply -f deploy/k8s/minikube/02-secrets.template.yaml
kubectl apply -f deploy/k8s/minikube/03-postgres.yaml
kubectl apply -f deploy/k8s/minikube/04-backend.yaml
kubectl apply -f deploy/k8s/minikube/05-frontend.yaml
kubectl apply -f deploy/k8s/minikube/06-ingress.yaml
```

Wait for rollouts:

```bash
kubectl -n kinetic rollout status deployment/postgres
kubectl -n kinetic rollout status deployment/backend
kubectl -n kinetic rollout status deployment/frontend
```

Run migrations:

```bash
kubectl -n kinetic exec deploy/backend -- php artisan migrate --force
```

Open app:

```text
http://kinetic.local
```

## 5) Jenkins Pipeline

The root Jenkinsfile does:
- Checkout
- Frontend CI (npm ci, lint, build)
- Backend dependency install
- Build Docker images tagged by build number
- Load images into Minikube
- Apply Kubernetes manifests
- Update deployment images to the new build tag
- Wait for rollout
- Run Laravel migrations

### Jenkins Agent Requirements

The Jenkins agent must have:
- docker
- kubectl
- minikube
- node + npm
- php + composer

If your Jenkins agent is a container, use a custom Jenkins agent image with these tools preinstalled.

## 6) Secrets and Environment

Before real use, update:
- deploy/k8s/minikube/02-secrets.template.yaml

Set:
- APP_KEY (Laravel key)
- DB credentials

Generate key locally if needed:

```bash
cd backend
php artisan key:generate --show
```

Copy that into APP_KEY.

## 7) Free Deployment Reality

For truly free Kubernetes:
- Minikube on your machine is the best option
- Managed Kubernetes (EKS/GKE/AKS) is not truly free at steady state

Recommended path:
1. Develop and validate on Minikube
2. Move DB to managed service first when needed
3. Move cluster to managed K8s only when traffic/uptime justifies cost

## 8) Troubleshooting

Check objects:

```bash
kubectl -n kinetic get pods,svc,ingress
```

Backend logs:

```bash
kubectl -n kinetic logs deploy/backend --tail=200
```

Frontend logs:

```bash
kubectl -n kinetic logs deploy/frontend --tail=200
```

Postgres logs:

```bash
kubectl -n kinetic logs deploy/postgres --tail=200
```

If ingress is not reachable:
- verify minikube ingress addon is enabled
- verify hosts entry points kinetic.local to minikube ip
- verify ingress object exists in namespace kinetic
