# Kinetic

Kinetic is an event orchestration platform with a Laravel backend and a Next.js frontend. It covers event creation, guest invitations, RSVP handling, schedule management, guest uploads, and an event dashboard for tracking activity and engagement.

## What The App Does

Kinetic is built around a creator portal and a guest-facing upload flow.

The main product features are:

- Authentication with register, login, logout, and current-user endpoints powered by Sanctum.
- Event management for listing, creating, and viewing events.
- Guest invitation workflows for sending, tracking, accepting, responding to, and deleting invitations.
- Event scheduling tools for creating, editing, viewing, and deleting schedule items.
- Activity logs for event-level operational history.
- Guest photo uploads through public share links, including upload verification, file limits, and per-event upload history.
- A guest-facing upload page that lets attendees submit images without signing in.
- A portal dashboard with event stats, guest management, schedule management, and upload management.

## Tech Stack

### Backend

- Laravel 12
- PHP 8.2+
- Laravel Sanctum for API authentication
- Queue workers for email delivery
- AWS S3-compatible storage support through Flysystem
- PHPUnit for testing

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Motion for UI animation
- OGL and react-icons for interactive UI elements

### Deployment And Infrastructure

- Docker for container builds
- Jenkins for CI/CD
- Terraform for infrastructure provisioning
- AWS EC2 for the Kubernetes control plane and worker nodes
- Kubernetes v1.30 with kubeadm-based bootstrap scripts
- Calico for cluster networking
- Nginx Ingress for routing API traffic

## Feature Overview

### Authentication

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/user`
- `/api/auth/logout`

### Events

- `/api/events` for listing and creating events
- `/api/events/{event}` for viewing a single event
- Event dashboard UI for RSVP status, invitations, and activity logs

### Guest Invitations

- Invite guests from the portal
- Send invitation emails
- Accept and respond to invitation links from the public site
- Remove invitations when needed
- Track accepted, pending, and rejected guest states

### Schedules

- Calendar-style schedule management per event
- Create, update, and delete schedule items
- Public schedule lookup through guest upload links

### Guest Uploads

- Generate share links for event guests
- Validate share links publicly
- Upload up to 5 images per guest share link
- Show uploaded image history and remaining upload slots
- Store uploads in object storage with event-scoped paths

### Portal Experience

- Event overview terminal
- Guest management rail
- Event schedule calendar
- Upload management tab
- Activity log viewer

## Deployment Architecture

The deployment setup is designed for a self-managed Kubernetes environment on EC2.

Terraform provisions the infrastructure in `deploy/infra`, including:

- A control plane EC2 instance
- An application worker EC2 instance
- A monitoring worker EC2 instance
- Security group rules for SSH, Kubernetes API, HTTP, and NodePort traffic
- Outputs for public and private IP addresses plus SSH helper commands

Bootstrap scripts install and configure:

- containerd
- kubelet, kubeadm, and kubectl
- Helm
- Kubernetes control-plane initialization
- Worker node join setup
- Cluster networking setup through Calico

The Kubernetes manifests in `deploy/k8s/backend-ec2` define:

- Namespace isolation
- ConfigMap and secret-based configuration
- Priority classes
- Separate backend deployments for general API traffic, auth traffic, and email queue workers
- Nginx Ingress routing for `/api`, `/auth`, and `/sanctum`

## Jenkins CI/CD Pipeline

The Jenkins pipeline in `Jenkinsfile.ec2` automates the backend delivery flow:

1. Checks out the repository.
2. Builds the backend Docker image.
3. Tags and pushes the image to Docker Hub.
4. Destroys and recreates the infrastructure with Terraform.
5. Waits for SSH access to the EC2 control plane.
6. Fetches the generated kubeconfig from the control plane.
7. Installs Calico into the cluster.
8. Applies the backend Kubernetes manifests.
9. Brings up the app, auth, and email worker workloads on the worker nodes.

This pipeline is intentionally opinionated: it treats Terraform as the source of truth for infrastructure and Kubernetes manifests as the deployment contract for the backend runtime.

## Local Development

### Backend

```bash
cd backend
composer install
npm install
php artisan serve
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

- `backend/` Laravel API, models, controllers, mail, and deployment manifests
- `frontend/` Next.js portal and guest-facing UI
- `deploy/infra/` Terraform and EC2 bootstrap scripts
- `deploy/k8s/backend-ec2/` Kubernetes manifests for backend deployment
- `Jenkinsfile.ec2` Jenkins pipeline for build and deployment automation

## Notes

- The guest upload flow is documented in `backend/GUEST_UPLOAD_FEATURE.md`.
- The backend exposes both authenticated portal endpoints and public guest endpoints for invitations and uploads.
- The frontend includes a protected event portal and a public guest upload experience.