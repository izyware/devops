SCRIPTNAME=info
CONFIG_FILE=$1
COMMAND=$2
EXTRA_PARAMS=$3
SCRIPTDIR=$(dirname "$0")
echo [$SCRIPTNAME] start
source $SCRIPTDIR/vars.sh

TARGET_GROUP_ARN=$(aws ecs describe-services $AWS_OPTIONS_CLI \
  --cluster "$AWS_ECS_CLUSTER_ARN" \
  --services "$AWS_ECS_SERVICE_NAME" \
  --query "services[0].loadBalancers[0].targetGroupArn" \
  --output text)

if [[ -z "$TARGET_GROUP_ARN" || "$TARGET_GROUP_ARN" == "None" ]]; then
  echo "[$SCRIPTNAME] No load balancer or target group found for this ECS service."
  exit 1
fi

aws elbv2 describe-target-groups $AWS_OPTIONS_CLI  \
  --target-group-arns "$TARGET_GROUP_ARN" \
  --query "TargetGroups[0].{Path:HealthCheckPath,Protocol:HealthCheckProtocol,Port:HealthCheckPort,Matcher:Matcher.HttpCode}" \
  --output table

LB_ARN=$(aws elbv2 describe-target-groups $AWS_OPTIONS_CLI \
  --target-group-arns "$TARGET_GROUP_ARN" \
  --query "TargetGroups[0].LoadBalancerArns[0]" \
  --output text)

if [[ "$LB_ARN" == "None" || -z "$LB_ARN" ]]; then
  echo "[$SCRIPTNAME] No Load Balancer associated with this Target Group."
  exit 1
fi
echo "[$SCRIPTNAME] Load Balancer: $LB_ARN"

LB_DNS=$(aws elbv2 describe-load-balancers $AWS_OPTIONS_CLI \
  --load-balancer-arns "$LB_ARN" \
  --query "LoadBalancers[0].DNSName" \
  --output text)

if [[ -z "$LB_DNS" ]]; then
  echo "[$SCRIPTNAME] Could not retrieve ALB DNS name."
  exit 1
fi

echo "[$SCRIPTNAME] Load Balancer: $LB_DNS"

aws elbv2 describe-target-health $AWS_OPTIONS_CLI \
  --target-group-arn "$TARGET_GROUP_ARN" \
  --query "TargetHealthDescriptions[*].{Target:Target.Id,Port:Target.Port,Health:TargetHealth.State,Reason:TargetHealth.Reason}" \
  --output table
