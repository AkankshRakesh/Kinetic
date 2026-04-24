# Jenkins Deployment Plan for Laravel Backend on AWS EC2

## Backend Scan Summary

The backend is a Laravel 12 application running on PHP 8.2 with these deployment-sensitive traits:

- Sanctum is enabled for stateful auth.
- Sessions use the database driver.
- Queues use the database driver.
- Cache uses the database driver.
- The app exposes a health endpoint at `/up`.
- The backend already supports a role-based split through auth routes and the Laravel queue system.

The synopsis changes the deployment shape: this should be deployed on Kubernetes running on AWS EC2, not as one monolithic EC2 container. The backend should be split into three pods:

- auth pod for login, register, logout, and user lookup
- email pod for asynchronous email delivery jobs
- general pod for core application and event APIs

## Recommended Approach

Use Jenkins to build one backend image, push it to ECR, and update three Kubernetes workloads on an EC2-hosted cluster.

This matches the synopsis and keeps the backend codebase unified while separating runtime responsibilities by pod role. It also fits the current Laravel setup because the same image can be reused for auth and general API pods, while the email pod runs the same image in worker mode.

## Target AWS Stack

- EC2 instance or EC2 cluster hosting Kubernetes
- ECR for backend images
- External PostgreSQL database, such as Supabase per the synopsis
- Ingress controller for HTTP routing
- Optional CloudWatch or S3 for logs and artifacts

## Pod Responsibilities

### Auth Pod

Handles:

- `/api/register`
- `/api/login`
- `/api/logout`
- `/api/user`
- `/sanctum/csrf-cookie`

This pod must stay stateful-session aware because the backend uses database sessions and Sanctum.

### Email Pod

Consumes queue jobs for email and notification delivery.

This pod should run a worker command rather than expose public HTTP traffic. It should watch a dedicated queue such as `emails` so it does not compete with core application jobs.

### General Pod

Handles the rest of the backend APIs, including event and application logic, and serves the `/up` health endpoint.

## EC2 Host Responsibilities

The EC2 layer should provide:

- Kubernetes control plane and worker capacity, or a single-node cluster for demo purposes
- `kubectl` access from Jenkins
- ECR pull permissions
- Ingress exposure on ports `80` and `443`
- DNS or load balancer routing to the ingress endpoint

## Environment Variables

Store these in Kubernetes Secrets and ConfigMaps, then inject them into all three workloads as needed:

- `APP_NAME`
- `APP_ENV=production`
- `APP_KEY`
- `APP_DEBUG=false`
- `APP_URL=https://your-domain`
- `DB_CONNECTION=pgsql`
- `DB_HOST`
- `DB_PORT=5432`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SANCTUM_STATEFUL_DOMAINS`
- `SESSION_DRIVER=database`
- `SESSION_DOMAIN`
- `QUEUE_CONNECTION=database`
- `CACHE_STORE=database`
- `MAIL_*` values if email delivery uses SMTP or another provider

Because Sanctum is enabled, `SANCTUM_STATEFUL_DOMAINS` must match the frontend domain(s) that will send authenticated requests.

## Jenkins Pipeline Stages

### 1. Checkout

Pull the code and determine the deployment version from the commit SHA or build number.

### 2. Backend Validation

Run a fast validation step before packaging:

- `composer install --no-dev --prefer-dist --no-interaction`
- PHPUnit or a focused backend test run
- Optional PHP linting or Pint

### 3. Build Backend Image

Build the backend Docker image from `backend/Dockerfile`.

The same image can be reused for the auth and general pods. The email pod can use the same image with a worker command override.

### 4. Push to ECR

- Tag the image with the build number and commit SHA
- Push the image to ECR

### 5. Update Kubernetes Workloads

Use `kubectl` from Jenkins to update the image on three workloads:

- auth deployment
- email worker deployment
- general deployment

Rollouts should happen one workload at a time so you can detect which slice failed.

### 6. Run Database Migrations

Run `php artisan migrate --force` against the external PostgreSQL database after the new version is available.

This is necessary because the backend depends on database tables for:

- sessions
- queue jobs
- cache entries
- failed jobs

### 7. Warm Laravel Caches

After a successful rollout:

- `php artisan config:clear`
- `php artisan config:cache`
- `php artisan route:cache` if routes are stable
- `php artisan view:cache`
- `php artisan storage:link` if needed

### 8. Verify Health and Routing

Smoke test the deployed services:

- `/up` returns 200 on the general pod
- auth endpoints respond correctly on the auth pod
- the email worker is consuming jobs from its queue

## Jenkinsfile Outline

The EC2 Kubernetes pipeline should look like this:

1. Checkout source
2. Install backend dependencies for validation
3. Build backend Docker image
4. Push image to ECR
5. Update auth deployment image
6. Update email deployment image
7. Update general deployment image
8. Wait for rollout status on each workload
9. Run `php artisan migrate --force`
10. Refresh caches if you bake them into the release flow
11. Hit `/up` and the auth routes for smoke verification

## Rollback Plan

Keep the previous image tag available in ECR so rollback is straightforward:

1. Revert the auth, email, and general deployments to the previous tag
2. Re-run only backward-compatible migrations if required
3. Recheck `/up` and auth routes

If a migration is irreversible, add a manual approval gate before applying it.

## Production Notes

- Use an ingress controller in front of the three pods so external traffic is routed cleanly.
- Keep auth and general API endpoints separate only at the service/pod level, not as separate codebases.
- Run email delivery asynchronously so user-facing requests do not block on SMTP latency.
- Do not use `APP_DEBUG=true` in production.

## Suggested Follow-Up Files

- Add `deploy/k8s/backend/` manifests for auth, email, and general workloads.
- Add a `Jenkinsfile.ec2` that updates Kubernetes deployments instead of a single EC2 container.
- Add `.env.production.example` or a Kubernetes Secret template so the production settings are explicit.