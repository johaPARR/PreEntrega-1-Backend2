variable "kube_context" {
  type    = string
  default = "kind-eventos"
}

variable "image" {
  type    = string
  default = "plataforma-eventos-api:local"
}

variable "replicas" {
  type    = number
  default = 2
}

variable "port" {
  type    = number
  default = 8080
}