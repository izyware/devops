BASEDIR=$1
OPTIONS=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
PORTTOFORWARD=$((22000+$SOURCEINFORMATIONBUCKETID))
echo make $PORTTOFORWARD available on local
ssh -i $BASEDIR/config/id_rsa -v -NL "$PORTTOFORWARD:localhost:$PORTTOFORWARD" $SSHPORT $SSHUSERNAME_AT_MACHINE