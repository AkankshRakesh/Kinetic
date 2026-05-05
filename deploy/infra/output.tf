output "public_ip" {
  value = aws_instance.k8s.public_ip
}

output "ssh_command" {
  value = "ssh -i kin.pem ubuntu@${aws_instance.k8s.public_ip}"
}