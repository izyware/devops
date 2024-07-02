#!/bin/bash
BASEDIR=$1
OPTIONS=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
NAME=chrome$SOURCEINFORMATIONBUCKETID
WEBSERVERPORT=$((6900+$SOURCEINFORMATIONBUCKETID))
PROXYPORT=$((19000+$SOURCEINFORMATIONBUCKETID))
URL=chrome://version/
# the user agent switching is disabled - wrong user agent will cause chrome webstore to not detect chrome 
# USERAGENTBASE64=`cat $BASEDIR/config/useragent | sed 's/ / /g' | openssl enc -base64` 
# -e APP_ARGS="--proxy-server=socks5://host.docker.internal:$PROXYPORT --user-agent=`echo $USERAGENTBASE64 | base64 --decode`" \
DATADIR=$HOME/izyware/izy-idman-tools/id/$SOURCEINFORMATIONBUCKETID/Desktop/chrome;
mkdir -p $DATADIR

$SCRIPTDIR/killanddeletedata.sh $NAME
docker run \
  --name=$NAME -p $WEBSERVERPORT:6901 -e LAUNCH_URL=$URL \
  -e APP_ARGS="--proxy-server=socks5://host.docker.internal:$PROXYPORT" \
  -e VNC_PW=password \
  -v $DATADIR:/home/kasm-user:rw \
  --shm-size=512m \
  kasmweb/chrome:1.14.0

# echo user-agent: `echo $USERAGENTBASE64 | base64 --decode`
echo Browser state is persisted in $DATADIR/.config/google-chrome/Default
echo You can access $NAME from https://localhost:$WEBSERVERPORT 
echo Enter [kasm_user, password] for credentials when prompted.
echo You can set the chrome proxy to your local by using host.docker.internal:$PROXYPORT 
