BASEDIR=$1
REMOTEPATH=$3
LOCALPATH=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
rsync -avP -e "ssh -i $BASEDIR/config/id_rsa" $LOCALPATH $USERNAME@$MACHINEADDR:$REMOTEPATH
