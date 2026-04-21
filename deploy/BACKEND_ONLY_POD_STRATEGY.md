# Backend-Only Kubernetes Pod Strategy

This strategy keeps your Laravel backend as one codebase while splitting runtime responsibilities into dedicated pods.

## Why this works

You asked for separate pods for email, session/login/signup, and events.
With Laravel, this is best done by role-based pods using the same backend image:

- backend-api pod: regular API endpoints
- backend-auth pod: login/signup/logout/user/sanctum endpoints
- worker-email pod: queue worker for emails queue
- worker-events pod: queue worker for events queue
- worker-default pod: queue worker for default queue
- scheduler pod: runs Laravel scheduler loop

This avoids an early microservice split while still giving operational isolation and scaling control.

## Added files

- deploy/k8s/backend-only/00-namespace.yaml
- deploy/k8s/backend-only/01-configmap.yaml
- deploy/k8s/backend-only/02-secrets.template.yaml
- deploy/k8s/backend-only/03-postgres.yaml
- deploy/k8s/backend-only/04-api.yaml
- deploy/k8s/backend-only/05-auth-session.yaml
- deploy/k8s/backend-only/06-workers.yaml
- deploy/k8s/backend-only/07-ingress.yaml
- Jenkinsfile.backend

## Routing model

Host: api.kinetic.local

- /api/login, /api/register, /api/logout, /api/user, /sanctum -> backend-auth service
- /api -> backend-api service
- /up -> backend-api service

## Deployment steps (Minikube)

1. Start cluster and ingress:

```bash
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
```

2. Build backend image:

```bash
docker build -t kinetic-backend:latest backend
minikube image load kinetic-backend:latest
```

3. Apply manifests:

```bash
kubectl apply -f 00-namespace.yaml
kubectl apply -f 01-configmap.yaml
kubectl apply -f 02-secrets.template.yaml
kubectl apply -f 03-postgres.yaml
kubectl apply -f 04-api.yaml
kubectl apply -f 05-auth-session.yaml
kubectl apply -f 06-workers.yaml
kubectl apply -f 07-ingress.yaml
```

4. Run migrations:

```bash
kubectl -n kinetic-backend exec deploy/backend-api -- php artisan migrate --force
kubectl -n kinetic-backend port-forward svc/backend-api 8080:8080
```

5. Host mapping:

```bash
minikube ip
```

Add this in your hosts file:

```text
<MINIKUBE_IP> api.kinetic.local
```

## Queue routing for email and events

For this pod split to be effective, dispatch jobs explicitly to queues:

- emails queue: use onQueue('emails')
- events queue: use onQueue('events')
- everything else: default queue

If jobs are not assigned queue names, most will land in default and only worker-default will process them.

## Session/login/signup pod note

Your app currently uses web guard + Sanctum with DB-backed sessions. Session is shared because all pods use the same database.
This means auth/session behavior remains consistent even when auth and api are separate pods.

## Jenkins automation

Use Jenkinsfile.backend as the pipeline script for backend-only deploys.
It builds one backend image and updates all backend role deployments to that image tag.

## When to split into true microservices

Keep this role-based split until one of these happens:

- independent deployment cadence is required per domain
- strict team ownership boundaries
- conflicting dependencies between domains
- sustained scale differences that justify separate codebases

At that point, extract auth/events/email into dedicated services with separate repos and APIs.
