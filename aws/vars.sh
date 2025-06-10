if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "[$SCRIPTNAME] File $CONFIG_FILE does not exist. create it."
  exit 1
fi

source $CONFIG_FILE
if [[ -z "$AWS_ECS_SERVICE_NAME" ]]; then
  echo "[$SCRIPTNAME] No AWS_ECS_SERVICE_NAME specified. Please define it in $CONFIG_FILE"
  exit 1
fi

if [[ -z "$AWS_ECS_CLUSTER_ARN" ]]; then
  echo "[$SCRIPTNAME] No AWS_ECS_CLUSTER_ARN specified. Please define it in $CONFIG_FILE"
  exit 1
fi

if [[ -z "$AWS_OPTIONS_CLI" ]]; then
  echo "[$SCRIPTNAME] No AWS_OPTIONS_CLI specified. Please define it in $CONFIG_FILE"
  exit 1
fi
