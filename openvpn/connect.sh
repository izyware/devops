#!/bin/bash
BASEDIR=$1
SUDO_PASS=$2
SCRIPTDIR=$(dirname "$0")
echo $SUDO_PASS | sudo -S openvpn --config $BASEDIR/client.ovpn --auth-user-pass $BASEDIR/auth-user-pass.txt
