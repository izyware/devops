BASEDIR=$1
LOCAL_PORT=$2
REMOTE_PORT=$3
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
if [ -z "${LOCAL_PORT}" ]; then
  LOCAL_PORT=22
fi
if [ -z "${REMOTE_PORT}" ]; then
  REMOTE_PORT=$((22000+$SOURCEINFORMATIONBUCKETID))
fi
echo port $LOCAL_PORT is being made available as $REMOTE_PORT
# add -f to run in background. The current implementation will block until an error
# add -v for verbose output
ssh -i $BASEDIR/config/id_rsa -o ExitOnForwardFailure=yes -N $SSH_OPTIONS_CLI -R $REMOTE_PORT:localhost:$LOCAL_PORT $SSHPORT $SSHUSERNAME_AT_MACHINE
