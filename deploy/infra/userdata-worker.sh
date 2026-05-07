#!/bin/bash

set -euxo pipefail

LOG_FILE="/var/log/user-data.log"

exec > >(tee -a ${LOG_FILE}) 2>&1

export DEBIAN_FRONTEND=noninteractive

apt update -y

apt install -y \
  curl \
  apt-transport-https \
  ca-certificates \
  gnupg \
  software-properties-common \
  containerd

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
# Configure containerd
#######################################

mkdir -p /etc/containerd

containerd config default | tee /etc/containerd/config.toml

sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' \
  /etc/containerd/config.toml

systemctl daemon-reexec
systemctl enable containerd
systemctl restart containerd

#######################################
# Kubernetes packages
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

echo "Worker bootstrap complete"