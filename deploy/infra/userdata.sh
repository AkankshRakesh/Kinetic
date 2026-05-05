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
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
systemctl restart containerd

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

# Initialize cluster WITH public IP support
PUBLIC_IP=$(curl -s ifconfig.me)

kubeadm init \
  --pod-network-cidr=192.168.0.0/16 \
  --apiserver-cert-extra-sans=$PUBLIC_IP

# Setup kubectl for ubuntu user
mkdir -p /home/ubuntu/.kube
cp /etc/kubernetes/admin.conf /home/ubuntu/.kube/config
chown ubuntu:ubuntu /home/ubuntu/.kube/config

export KUBECONFIG=/etc/kubernetes/admin.conf

# Remove control-plane taint
kubectl taint nodes --all node-role.kubernetes.io/control-plane- || true

# Install Calico
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.2/manifests/calico.yaml

# Install Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Wait for nodes
sleep 30

kubectl get nodes

cp /etc/kubernetes/admin.conf /home/ubuntu/kubeconfig
chown ubuntu:ubuntu /home/ubuntu/kubeconfig