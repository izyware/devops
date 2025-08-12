BASEDIR=$1
CMD=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/vars.sh
# -f will push ssh to the background  just before command execution and will exit ssh after the command is completed
# See https://www.cyberciti.biz/faq/apple-osx-mountain-lion-mavericks-install-xquartz-server/
ssh -f -X $SSH_OPTIONS_IDENTITY_FILE $USERNAME@$MACHINEADDR $2
