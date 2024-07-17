BASEDIR=$1
CMD=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../ssh/vars.sh
ssh -i $BASEDIR/config/id_rsa $SSH_OPTIONS_CLI $SSHPORT $SSHUSERNAME_AT_MACHINE $2