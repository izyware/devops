variable "container_id" {
  type        = string
  default     = "."
  description = "Container ID"
}

terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Change to your preferred region
}

resource "aws_key_pair" "example" {
  key_name   = "izy.devops.apps.vpn/${base64encode(var.container_id)}"
  
  public_key = file("${var.container_id}/config/id_rsa.pub") # Use your existing SSH public key
}

resource "aws_security_group" "ssh_sg" {
  name        = "ssh and tcp access for ${base64encode(var.container_id)}"
  description = "Allow from anywhere"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # open to all
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # open to all
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_instance" "example" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t2.micro" # Free-tier eligible
  key_name      = aws_key_pair.example.key_name
  security_groups = [aws_security_group.ssh_sg.name]

  tags = {
    Name = "Terraform-SSH-Instance"
  }

  user_data = <<-EOF
      #!/bin/bash
      yum update -y
      amazon-linux-extras enable nginx1
      yum install -y nginx
      systemctl start nginx
      systemctl enable nginx
  EOF
}

resource "local_file" "machine_address" {
  content  = aws_instance.example.public_ip
  filename = "${var.container_id}/config/machinenaddr"
}

resource "local_file" "username" {
  content  = "ec2-user"
  filename = "${var.container_id}/config/username"
}

