BASEDIR=$1
OPTIONS=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
REMOTE_PORT=$((22000+$SOURCEINFORMATIONBUCKETID))
LOCAL_PORT=22
if [ ! -z "${OPTIONS}" ]; then
  LOCAL_PORT=$OPTIONS
fi
echo service $LOCAL_PORT pushed as $REMOTE_PORT
# add -f to run in background. The current implementation will block until an error
ssh -i $BASEDIR/config/id_rsa -v -N $SSH_OPTIONS_CLI -R $REMOTE_PORT:localhost:$LOCAL_PORT $SSHPORT $SSHUSERNAME_AT_MACHINE
