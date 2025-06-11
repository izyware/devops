SCRIPTNAME=execute-command
CONFIG_FILE=$1
COMMAND=$2
EXTRA_PARAMS=$3
SCRIPTDIR=$(dirname "$0")
echo [$SCRIPTNAME] start
source $SCRIPTDIR/vars.sh
export AWS_PAGER=""

UPDATE_TASK="No"
if [[ "$UPDATE_TASK" == "Yes" ]]; then
  echo "[$SCRIPTNAME] enable-execute-command"
  export AWS_PAGER=""
  aws ecs update-service $AWS_OPTIONS_CLI \
    --cluster "$AWS_ECS_CLUSTER_ARN" \
    --service "$AWS_ECS_SERVICE_NAME" \
    --enable-execute-command

  echo "[$SCRIPTNAME] force new deployment and wait for service to stabilize"
  aws ecs update-service $AWS_OPTIONS_CLI \
    --cluster "$AWS_ECS_CLUSTER_ARN" \
    --service "$AWS_ECS_SERVICE_NAME" \
    --force-new-deployment

  while true; do
    SERVICE_STATUS=$(aws ecs describe-services $AWS_OPTIONS_CLI \
      --cluster "$AWS_ECS_CLUSTER_ARN" \
      --services "$AWS_ECS_SERVICE_NAME" \
      --query "services[0].deployments[0].rolloutState" \
      --output text)

    echo "[$SCRIPTNAME] Service rollout state: $SERVICE_STATUS"

    if [[ "$SERVICE_STATUS" == "COMPLETED" ]]; then
      echo "[$SCRIPTNAME] Service is stable."
      break
    fi

    sleep 10
  done
fi

containerInstance=$(aws ecs list-container-instances $AWS_OPTIONS_CLI --cluster "$AWS_ECS_CLUSTER_ARN" --query "containerInstanceArns[0]" --output text)
agentConnected=$(aws ecs $AWS_OPTIONS_CLI describe-container-instances --cluster "$AWS_ECS_CLUSTER_ARN" --container-instances $containerInstance --query "containerInstances[0].agentConnected")
if [[ "$agentConnected" != "true" ]]; then
  echo "[$SCRIPTNAME] enableExecuteCommand not set. Please UPDATE_TASK"
  exit 1
fi

enableExecuteCommand=$(aws ecs describe-services $AWS_OPTIONS_CLI --cluster "$AWS_ECS_CLUSTER_ARN" --services "$AWS_ECS_SERVICE_NAME" --query "services[0].enableExecuteCommand" --output text)
if [[ "$enableExecuteCommand" != "True" ]]; then
  echo "[$SCRIPTNAME] enableExecuteCommand not set. Please UPDATE_TASK"
  exit 1
fi

TASK_ID=$(aws ecs list-tasks $AWS_OPTIONS_CLI --cluster "$AWS_ECS_CLUSTER_ARN" --service-name "$AWS_ECS_SERVICE_NAME" --query "taskArns[0]" --output text)
if [[ "$TASK_ID" == "None" || -z "$TASK_ID" ]]; then
  echo "[$SCRIPTNAME] No tasks found for service $AWS_ECS_SERVICE_NAME in cluster $AWS_ECS_CLUSTER_ARN."
  exit 1
fi

echo "[$SCRIPTNAME] TASK_ID: $TASK_ID"
CONTAINER_NAME=$(aws ecs describe-tasks $AWS_OPTIONS_CLI --cluster "$AWS_ECS_CLUSTER_ARN" --tasks "$TASK_ID" --query "tasks[0].containers[0].name" --output text)

echo "[$SCRIPTNAME] running command on $CONTAINER_NAME"
aws ecs execute-command $AWS_OPTIONS_CLI \
  --cluster $AWS_ECS_CLUSTER_ARN \
  --task $TASK_ID \
  --container $CONTAINER_NAME \
  --command $COMMAND \
  --interactive