provider "aws" {
  region = "ap-south-1"
}

########################################
# CONTROL PLANE NODE
########################################

resource "aws_instance" "control_plane" {
  ami           = "ami-0388e3ada3d9812da"
  instance_type = "c7i-flex.large"
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.k8s.id]

  user_data = file("userdata-control-plane.sh")

  lifecycle {
    ignore_changes = [ami]
  }

  tags = {
    Name = "kinetic-control-plane"
    Role = "control-plane"
  }
}

########################################
# MONITORING WORKER NODE
########################################

resource "aws_instance" "monitoring_worker" {
  ami           = "ami-0388e3ada3d9812da"
  instance_type = "c7i-flex.large"
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.k8s.id]
  
  user_data = file("userdata-worker.sh")

  lifecycle {
    ignore_changes = [ami]
  }

  tags = {
    Name = "kinetic-monitoring-worker"
    Role = "monitoring"
  }
}