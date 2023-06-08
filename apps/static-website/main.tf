terraform {}

# Variables 
variable "aws_region" { type = string }
variable "aws_access_key_id" { type = string }
variable "aws_secret_access_key" { type = string }
variable "domain_name" { type = string }
variable "acm_certificate_arn" { type = string }
variable "hosted_zone_id" { type = string }
variable "izy_instance_id" { type = string }

provider "aws" {
  region = var.aws_region
  access_key = "${var.aws_access_key_id}"
  secret_key = "${var.aws_secret_access_key}"
}

# Using https://docs.aws.amazon.com/AmazonS3/latest/userguide/HostingWebsiteOnS3Setup.html
resource "aws_s3_bucket" "izy-aws-app-static-website-s3-bucket" {
  bucket = "izy-aws-app-static-website-s3-bucket-${var.izy_instance_id}"
}

resource "aws_s3_bucket_website_configuration" "izy-aws-app-static-website-s3-bucket-website-configuration" {
  bucket = aws_s3_bucket.izy-aws-app-static-website-s3-bucket.id

  index_document {
    suffix = "index.html"
  }
}

resource "aws_s3_bucket_public_access_block" "izy-aws-app-static-website-s3-bucket" {
  bucket = aws_s3_bucket.izy-aws-app-static-website-s3-bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "make_content_publicly_available" {
  bucket = aws_s3_bucket.izy-aws-app-static-website-s3-bucket.id
  policy = data.aws_iam_policy_document.make_content_publicly_available.json
}

data "aws_iam_policy_document" "make_content_publicly_available" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = [
      "s3:GetObject"
    ]

    resources = [
      aws_s3_bucket.izy-aws-app-static-website-s3-bucket.arn,
      "${aws_s3_bucket.izy-aws-app-static-website-s3-bucket.arn}/*",
    ]
  }
}

resource "aws_cloudfront_distribution" "app-cf" { 
  origin {
    domain_name = aws_s3_bucket.izy-aws-app-static-website-s3-bucket.website_endpoint
    origin_id   = "izy-aws-app-static-website-s3-bucket"

    custom_origin_config {
      http_port = 80
      https_port = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols = ["TLSv1.1", "TLSv1.2"]
    }
  }

  aliases = [var.domain_name]

  comment             = "${var.domain_name} izy-aws-app-static-website"
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "izy-aws-app-static-website-s3-bucket"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Methods"]

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.acm_certificate_arn
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }
}

resource "aws_route53_record" "attach_domain_to_cf" {
  zone_id = var.hosted_zone_id
  name    = "${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.app-cf.domain_name]
}

output "AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME" {
  value = aws_cloudfront_distribution.app-cf.domain_name
}

output "AWS_CLOUDFRONT_DISTRIBUTION_ID" {
  value = aws_cloudfront_distribution.app-cf.id
}

output "AWS_S3_BUCKET_ID" {
  value = aws_s3_bucket.izy-aws-app-static-website-s3-bucket.id
}
