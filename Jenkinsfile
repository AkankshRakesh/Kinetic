pipeline {
  agent any

  environment {
    K8S_NAMESPACE = 'kinetic'
    BACKEND_IMAGE = "kinetic-backend:${BUILD_NUMBER}"
    FRONTEND_IMAGE = "kinetic-frontend:${BUILD_NUMBER}"
  }

  options {
    timestamps()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Frontend CI') {
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run lint'
          sh 'npm run build'
        }
      }
    }

    stage('Backend CI') {
      steps {
        dir('backend') {
          sh 'php -v'
          sh 'composer --version'
          sh 'composer install --no-interaction --prefer-dist'
        }
      }
    }

    stage('Build Images') {
      steps {
        sh 'docker build -t $BACKEND_IMAGE backend'
        sh '''docker build -t $FRONTEND_IMAGE \
          --build-arg NEXT_PUBLIC_AUTH_MODE=api \
          --build-arg NEXT_PUBLIC_AUTH_BACKEND=laravel-sanctum \
          --build-arg NEXT_PUBLIC_AUTH_API_BASE_URL= \
          --build-arg NEXT_PUBLIC_AUTH_INCLUDE_CREDENTIALS=true \
          --build-arg NEXT_PUBLIC_AUTH_CSRF_ENDPOINT=/sanctum/csrf-cookie \
          --build-arg NEXT_PUBLIC_AUTH_LOGIN_ENDPOINT=/api/login \
          --build-arg NEXT_PUBLIC_AUTH_REGISTER_ENDPOINT=/api/register \
          --build-arg NEXT_PUBLIC_AUTH_LOGOUT_ENDPOINT=/api/logout \
          --build-arg NEXT_PUBLIC_AUTH_USER_ENDPOINT=/api/user \
          frontend'''
      }
    }

    stage('Load Images Into Minikube') {
      steps {
        sh 'minikube image load $BACKEND_IMAGE'
        sh 'minikube image load $FRONTEND_IMAGE'
      }
    }

    stage('Deploy To Kubernetes') {
      steps {
        sh 'kubectl apply -f deploy/k8s/minikube/00-namespace.yaml'
        sh 'kubectl apply -f deploy/k8s/minikube/01-configmap.yaml'
        sh 'kubectl apply -f deploy/k8s/minikube/02-secrets.template.yaml'
        sh 'kubectl apply -f deploy/k8s/minikube/03-postgres.yaml'
        sh 'kubectl apply -f deploy/k8s/minikube/04-backend.yaml'
        sh 'kubectl apply -f deploy/k8s/minikube/05-frontend.yaml'
        sh 'kubectl apply -f deploy/k8s/minikube/06-ingress.yaml'

        sh 'kubectl -n $K8S_NAMESPACE set image deployment/backend backend=$BACKEND_IMAGE'
        sh 'kubectl -n $K8S_NAMESPACE set image deployment/frontend frontend=$FRONTEND_IMAGE'

        sh 'kubectl -n $K8S_NAMESPACE rollout status deployment/postgres --timeout=120s'
        sh 'kubectl -n $K8S_NAMESPACE rollout status deployment/backend --timeout=180s'
        sh 'kubectl -n $K8S_NAMESPACE rollout status deployment/frontend --timeout=180s'
      }
    }

    stage('Run Migrations') {
      steps {
        sh 'kubectl -n $K8S_NAMESPACE exec deploy/backend -- php artisan migrate --force'
      }
    }
  }

  post {
    always {
      sh 'kubectl -n $K8S_NAMESPACE get pods -o wide || true'
      sh 'kubectl -n $K8S_NAMESPACE get svc || true'
      sh 'kubectl -n $K8S_NAMESPACE get ingress || true'
    }
  }
}
