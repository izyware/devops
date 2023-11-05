BASEDIR=$1
CMD=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
ssh -i $BASEDIR/config/id_rsa $USERNAME@$MACHINEADDR $2