terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.35"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = var.kube_context
}

resource "kubernetes_deployment_v1" "api" {
  metadata {
    name = "api"
    labels = {
      app = "api"
    }
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = "api"
      }
    }

    template {
      metadata {
        labels = {
          app = "api"
        }
      }

      spec {
        container {
          name              = "api"
          image             = var.image
          image_pull_policy = "IfNotPresent"

          port {
            container_port = var.port
          }

          env_from {
            secret_ref {
              name = "api-secrets"
            }
          }

          env {
            name  = "PORT"
            value = tostring(var.port)
          }

          env {
            name  = "NODE_ENV"
            value = "production"
          }

          readiness_probe {
            http_get {
              path = "/api/health"
              port = var.port
            }
            initial_delay_seconds = 5
            period_seconds        = 10
          }

          liveness_probe {
            http_get {
              path = "/api/health"
              port = var.port
            }
            initial_delay_seconds = 15
            period_seconds        = 20
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "api" {
  metadata {
    name = "api"
  }

  spec {
    selector = {
      app = "api"
    }

    port {
      port        = var.port
      target_port = var.port
    }
  }
}