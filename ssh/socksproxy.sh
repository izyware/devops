BASEDIR=$1
OPTIONS=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
PROXYPORT=$((19000+$SOURCEINFORMATIONBUCKETID))
if [ "$OPTIONS" = "remote" ]; then
  SSHUSERNAME_AT_MACHINE=localhost
  SSHPORT="-p 22009"
fi
echo SOCKS proxy will be available on localhost:$PROXYPORT
ssh -i $BASEDIR/config/id_rsa -v -ND "*:$PROXYPORT" $SSHPORT $SSHUSERNAME_AT_MACHINE
