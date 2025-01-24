SCRIPTNAME=download
BASEDIR=$1
REMOTEPATH=$2
LOCALPATH=$3
SCRIPTDIR=$(dirname "$0")
echo [$SCRIPTNAME] start
source $SCRIPTDIR/../ssh/vars.sh

COMMON_FLAGS=-vazP

RSYNCPROCOTOL=ssh
if [[ -f $BASEDIR/config/rsync ]]
then
    RSYNCPROCOTOL=rsync
fi

echo [$SCRIPTNAME] rsync via $RSYNCPROCOTOL

if [[ $RSYNCPROCOTOL == "ssh" ]]; then
  rsync $COMMON_FLAGS -e "ssh -i $BASEDIR/config/id_rsa" $USERNAME@$MACHINEADDR:$REMOTEPATH $LOCALPATH
fi

if [[ $RSYNCPROCOTOL == "rsync" ]]; then
  REMOTEDIR="${REMOTEPATH/"~"//HOME}"
  rsync $COMMON_FLAGS rsync://@$MACHINEADDR:8082$REMOTEDIR $LOCALPATH
fi