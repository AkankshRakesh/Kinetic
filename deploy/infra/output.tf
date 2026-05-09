output "control_plane_ip" {
  value = aws_instance.control_plane.public_ip
}

output "monitoring_worker_ip" {
  value = aws_instance.monitoring_worker.public_ip
}

output "ssh_control_plane" {
  value = "ssh -i kin.pem ubuntu@${aws_instance.control_plane.public_ip}"
}

output "ssh_monitoring_worker" {
  value = "ssh -i kin.pem ubuntu@${aws_instance.monitoring_worker.public_ip}"
}

output "app_worker_ip" {
  value = aws_instance.app_worker.public_ip
}

output "ssh_app_worker" {
  value = "ssh -i kin.pem ubuntu@${aws_instance.app_worker.public_ip}"
}

output "monitoring_worker_private_ip" {
  value = aws_instance.monitoring_worker.private_ip
}

output "app_worker_private_ip" {
  value = aws_instance.app_worker.private_ip
}