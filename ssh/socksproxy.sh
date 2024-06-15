#!/bin/bash
BASEDIR=$1
OPTIONS=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
PROXYPORT=$((19000+$SOURCEINFORMATIONBUCKETID))
echo SOCKS proxy will be available on localhost:$PROXYPORT
ssh -i $BASEDIR/config/id_rsa -v -ND "*:$PROXYPORT" $USERNAME@$MACHINEADDR