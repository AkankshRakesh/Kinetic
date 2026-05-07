#!/bin/bash

set -euxo pipefail

LOG_FILE="/var/log/user-data.log"

exec > >(tee -a ${LOG_FILE}) 2>&1

echo "========== BOOTSTRAP START =========="

#######################################
# Basic system prep
#######################################

export DEBIAN_FRONTEND=noninteractive

apt update -y

# IMPORTANT:
# DO NOT RUN apt upgrade -y
# It causes random networking/service restarts during cloud-init

apt install -y \
  curl \
  wget \
  vim \
  git \
  unzip \
  apt-transport-https \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common

#######################################
# Disable swap
#######################################

swapoff -a
sed -i '/ swap / s/^/#/' /etc/fstab

#######################################
# Kernel modules
#######################################

cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

#######################################
# Sysctl
#######################################

cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF

sysctl --system

#######################################
# Install containerd
#######################################

apt install -y containerd

mkdir -p /etc/containerd

containerd config default | tee /etc/containerd/config.toml

# Required for kubeadm
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' \
  /etc/containerd/config.toml

# Sandbox image compatibility
sed -i 's#sandbox_image = .*#sandbox_image = "registry.k8s.io/pause:3.9"#' \
  /etc/containerd/config.toml

systemctl daemon-reexec
systemctl enable containerd
systemctl restart containerd

#######################################
# Wait for containerd
#######################################

echo "Waiting for containerd..."

until systemctl is-active --quiet containerd; do
  sleep 2
done

#######################################
# Install Kubernetes
#######################################

mkdir -p /etc/apt/keyrings

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key \
  | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" \
| tee /etc/apt/sources.list.d/kubernetes.list

apt update -y

apt install -y kubelet kubeadm kubectl

apt-mark hold kubelet kubeadm kubectl

systemctl enable kubelet

#######################################
# Install Helm
#######################################

curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

#######################################
# Public IP
#######################################

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "PUBLIC IP: ${PUBLIC_IP}"

#######################################
# kubeadm init
#######################################

echo "Initializing Kubernetes..."

kubeadm init \
  --pod-network-cidr=192.168.0.0/16 \
  --apiserver-cert-extra-sans=${PUBLIC_IP} \
  --cri-socket=unix:///run/containerd/containerd.sock

#######################################
# KUBECONFIG
#######################################

mkdir -p /home/ubuntu/.kube

PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo "PUBLIC_IP=${PUBLIC_IP}"

cp /etc/kubernetes/admin.conf /home/ubuntu/.kube/config

cat > /home/ubuntu/kubeconfig <<EOF
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: $(grep certificate-authority-data /etc/kubernetes/admin.conf | awk '{print $2}')
    server: https://${PUBLIC_IP}:6443
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    user: kubernetes-admin
  name: kubernetes-admin@kubernetes
current-context: kubernetes-admin@kubernetes
kind: Config
preferences: {}
users:
- name: kubernetes-admin
  user:
    client-certificate-data: $(grep client-certificate-data /etc/kubernetes/admin.conf | awk '{print $2}')
    client-key-data: $(grep client-key-data /etc/kubernetes/admin.conf | awk '{print $2}')
EOF

chown -R ubuntu:ubuntu /home/ubuntu/.kube
chown ubuntu:ubuntu /home/ubuntu/kubeconfig

chmod 600 /home/ubuntu/kubeconfig

echo "========== GENERATED KUBECONFIG =========="
cat /home/ubuntu/kubeconfig

#######################################
# Remove master taint
#######################################

# kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true

#######################################
# Install Calico
#######################################

# echo "Installing Calico..."

# kubectl apply -f \
# https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/calico.yaml

# #######################################
# # Wait for node ready
# #######################################

# echo "Waiting for node readiness..."

# timeout 600 bash -c '
# until kubectl get nodes 2>/dev/null | grep -q " Ready"; do
#   sleep 5
# done
# '

# kubectl get nodes -o wide

# #######################################
# # Install ingress nginx
# #######################################

# echo "Installing ingress-nginx..."

# kubectl apply -f \
# https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# #######################################
# # Wait for ingress
# #######################################

# kubectl wait \
#   --namespace ingress-nginx \
#   --for=condition=Ready pod \
#   --selector=app.kubernetes.io/component=controller \
#   --timeout=600s || true

#######################################
# Generate worker join command
#######################################

echo "Generating worker join command..."

kubeadm token create \
  --ttl 24h \
  --print-join-command \
  > /home/ubuntu/join-command.sh

echo " --cri-socket=unix:///run/containerd/containerd.sock" \
>> /home/ubuntu/join-command.sh

chmod +x /home/ubuntu/join-command.sh

#######################################
# Label current node
#######################################

# CONTROL_NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')

# kubectl label node ${CONTROL_NODE} \
# node-role.kubernetes.io/control-plane=control-plane --overwrite

#######################################
# Install lightweight monitoring
#######################################

cat <<'EOF' > /home/ubuntu/install-monitoring.sh
#!/bin/bash

set -euxo pipefail

export KUBECONFIG=/etc/kubernetes/admin.conf

helm repo add prometheus-community \
https://prometheus-community.github.io/helm-charts

helm repo update

kubectl create namespace monitoring || true

helm upgrade --install monitoring \
prometheus-community/kube-prometheus-stack \
--namespace monitoring \

--set alertmanager.enabled=false \
--set defaultRules.create=false \

--set kubeEtcd.enabled=false \
--set kubeScheduler.enabled=false \
--set kubeControllerManager.enabled=false \

--set prometheus.prometheusSpec.retention=1d \
--set prometheus.prometheusSpec.scrapeInterval=60s \

--set prometheus.prometheusSpec.nodeSelector.monitoring=true \
--set grafana.nodeSelector.monitoring=true \

--set prometheus.prometheusSpec.resources.requests.cpu=100m \
--set prometheus.prometheusSpec.resources.requests.memory=512Mi \

--set grafana.resources.requests.cpu=50m \
--set grafana.resources.requests.memory=128Mi \

--set prometheus.prometheusSpec.tolerations[0].key=monitoring \
--set prometheus.prometheusSpec.tolerations[0].operator=Equal \
--set prometheus.prometheusSpec.tolerations[0].value=true \
--set prometheus.prometheusSpec.tolerations[0].effect=NoSchedule \

--set grafana.tolerations[0].key=monitoring \
--set grafana.tolerations[0].operator=Equal \
--set grafana.tolerations[0].value=true \
--set grafana.tolerations[0].effect=NoSchedule \

--wait \
--timeout 20m || true

kubectl patch svc monitoring-grafana \
-n monitoring \
-p '{"spec":{"type":"NodePort"}}' || true

kubectl patch svc monitoring-kube-prometheus-prometheus \
-n monitoring \
-p '{"spec":{"type":"NodePort"}}' || true

EOF

chmod +x /home/ubuntu/install-monitoring.sh

#######################################
# Final status
#######################################

echo "========== FINAL STATUS =========="

kubectl get nodes || true
kubectl get pods -A || true

echo "========== BOOTSTRAP COMPLETE =========="