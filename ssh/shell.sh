#!/bin/bash
BASEDIR=$1
CMD=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
ssh -i $BASEDIR/config/id_rsa $SSHPORT $SSHUSERNAME_AT_MACHINE $2