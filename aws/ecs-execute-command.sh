SCRIPTNAME=execute-command
CONFIG_FILE=$1
COMMAND=$2
EXTRA_PARAMS=$3
SCRIPTDIR=$(dirname "$0")
echo [$SCRIPTNAME] start
source $SCRIPTDIR/vars.sh

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