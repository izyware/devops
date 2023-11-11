#!/bin/bash
SCRIPTNAME=nodesync
echo [$SCRIPTNAME] start
BASEDIR=$1;
CODEPATH=$2;
APPNAME=$3;
APPPARAM=$4;
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
REMOTEHOMEDIR=`ssh -i $BASEDIR/config/id_rsa $USERNAME@$MACHINEADDR pwd`;
LOCALHOMEDIR=`echo $HOME`;
REMOTEDIR="${CODEPATH/"~"/$REMOTEHOMEDIR}"
LOCALDIR="${CODEPATH/"~"/$LOCALHOMEDIR}"
REMOTECMD="mkdir -p $REMOTEDIR/"
echo [$SCRIPTNAME] remotecmd $REMOTECMD
ssh -i $BASEDIR/config/id_rsa $USERNAME@$MACHINEADDR $REMOTECMD
echo [$SCRIPTNAME] rsync local:$LOCALDIR to remote:$REMOTEDIR
rsync -av -e "ssh -i $BASEDIR/config/id_rsa" --exclude="node_modules/*" --exclude=".git/*" --exclude=".DS_Store" $LOCALDIR/ $USERNAME@$MACHINEADDR:$REMOTEDIR
if [ -z "$APPNAME" ]
then
      echo [$SCRIPTNAME] no app specified for running
else
      REMOTECMD="cd $REMOTEDIR;cp $REMOTEDIR/container-config/$SOURCEINFORMATIONBUCKETID/service-compose.json $REMOTEDIR/container-config/service-compose.json;node apps/$APPNAME.js $APPPARAM"
      clear && printf '\e[3J';
      echo [$SCRIPTNAME] running $APPNAME
      echo [$SCRIPTNAME] remotecmd $REMOTECMD
      ssh -t -i $BASEDIR/config/id_rsa $USERNAME@$MACHINEADDR $REMOTECMD
fi
echo [$SCRIPTNAME] complete