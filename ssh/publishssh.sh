#!/bin/bash
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
# -f will run in background
ssh -i $BASEDIR/config/id_rsa -v -fN -R $REMOTE_PORT:localhost:$LOCAL_PORT $SSHPORT $SSHUSERNAME_AT_MACHINE
