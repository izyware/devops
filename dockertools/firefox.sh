#!/bin/bash
BASEDIR=$1
OPTIONS=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
NAME=firefox$SOURCEINFORMATIONBUCKETID
WEBSERVERPORT=$((5800+$SOURCEINFORMATIONBUCKETID))
DATADIR=/Volumes/firefox_data_dir_$SOURCEINFORMATIONBUCKETID/firefox;
BROWSERDIR=$SCRIPTDIR/../firefox;
$SCRIPTDIR/killanddeletedata.sh $NAME
docker run -d \
  --name=$NAME -p $WEBSERVERPORT:5800 -v $DATADIR:/config:rw -v $BROWSERDIR:/browserdir:rw \
  jlesage/firefox
echo Browser state is persisted in $DATADIR
echo You can access $NAME from http://localhost:$WEBSERVERPORT
echo You can set the firefox proxy to your local by using host.docker.internal:PORT 
