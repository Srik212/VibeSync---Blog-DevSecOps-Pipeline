variable "aws_region" {
    description = "AWS region to deploy the EKS cluster"
    type = string
    default = "ca-central-1"
}

variable "environment" {
    description = "Environment name (e.g., dev, staging, prod)"
    type = string
    default = "dev"
}

variable "cluster_name" {
    description = "Name of the EKS cluster"
    type = string
    default = "devsecops-eks"
}

variable "cluster_version" {
    description = "Kuberenetes Version of the EKS cluster"
    type = string
    default = "1.27"
}

variable "vpc_cidr" {
    description = "CIDR block for the VPC"
    type = string
    default = "10.0.0.0/16"
}