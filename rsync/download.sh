BASEDIR=$1
REMOTEPATH=$2
LOCALPATH=$3
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
rsync -avP -e "ssh -i $BASEDIR/config/id_rsa" $USERNAME@$MACHINEADDR:$REMOTEPATH $LOCALPATH