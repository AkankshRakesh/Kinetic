```bash
#!/bin/bash

set -e

# Log everything
exec > /var/log/user-data.log 2>&1

# Update
apt update -y && apt upgrade -y

# Install Docker
apt install -y docker.io
systemctl enable docker
systemctl start docker

# Disable swap
swapoff -a
sed -i '/ swap / s/^/#/' /etc/fstab

# Kernel modules
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# Sysctl
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
net.ipv4.ip_forward=1
EOF

sysctl --system

# Containerd
apt install -y containerd

mkdir -p /etc/containerd

containerd config default > /etc/containerd/config.toml

sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' \
/etc/containerd/config.toml

systemctl restart containerd
systemctl enable containerd

# Kubernetes install
apt install -y apt-transport-https ca-certificates curl gpg

mkdir -p /etc/apt/keyrings

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | \
gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /" \
> /etc/apt/sources.list.d/kubernetes.list

apt update

apt install -y kubelet kubeadm kubectl

apt-mark hold kubelet kubeadm kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Fetch EC2 public IP from AWS metadata
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Initialize Kubernetes
kubeadm init \
  --pod-network-cidr=192.168.0.0/16 \
  --apiserver-cert-extra-sans=$PUBLIC_IP

# Export kubeconfig
export KUBECONFIG=/etc/kubernetes/admin.conf

# Setup kubeconfig for ubuntu user
mkdir -p /home/ubuntu/.kube

cp /etc/kubernetes/admin.conf /home/ubuntu/.kube/config
cp /etc/kubernetes/admin.conf /home/ubuntu/kubeconfig

# Rewrite ANY old/private IP with current public IP
sed -i "s|server: https://.*:6443|server: https://$PUBLIC_IP:6443|g" \
/home/ubuntu/kubeconfig

# Permissions
chown -R ubuntu:ubuntu /home/ubuntu/.kube
chown ubuntu:ubuntu /home/ubuntu/kubeconfig

# Remove control-plane taint
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true

# Install Calico
kubectl apply -f \
https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/calico.yaml

# Install NGINX Ingress
kubectl apply -f \
https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

echo "Waiting for Kubernetes node to become Ready..."

until kubectl get nodes | grep -q " Ready"; do
  echo "Waiting for node readiness..."
  sleep 10
done

kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Add Prometheus repo
helm repo add prometheus-community \
https://prometheus-community.github.io/helm-charts

helm repo update

# Monitoring namespace
kubectl create namespace monitoring || true

# Install Prometheus + Grafana
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring || true

# Give monitoring stack time
sleep 60

kubectl get nodes

# Wait for monitoring pods but don't fail entire script
kubectl wait --for=condition=Ready pods --all \
  -n monitoring \
  --timeout=1200s || true

# Expose Grafana
kubectl patch svc monitoring-grafana -n monitoring \
-p '{"spec": {"type": "NodePort"}}' || true

# Expose Prometheus
kubectl patch svc monitoring-kube-prometheus-prometheus -n monitoring \
-p '{"spec": {"type": "NodePort"}}' || true

echo "Grafana Service:"
kubectl get svc monitoring-grafana -n monitoring

echo "Prometheus Service:"
kubectl get svc monitoring-kube-prometheus-prometheus -n monitoring

echo "Grafana Admin Password:"
kubectl get secret -n monitoring monitoring-grafana \
-o jsonpath="{.data.admin-password}" | base64 -d

echo ""

echo "Ingress Services:"
kubectl get svc -n ingress-nginx

echo "Bootstrap completed successfully."
```
