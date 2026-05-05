provider "aws" {
  region = "ap-south-1"
}

resource "aws_instance" "k8s" {
  ami           = "ami-0388e3ada3d9812da"
  instance_type = "c7i-flex.large"
  key_name      = var.key_name

  vpc_security_group_ids = [aws_security_group.k8s.id]

  user_data = file("userdata.sh")

  tags = {
    Name = "kinetic-k8s"
  }
}