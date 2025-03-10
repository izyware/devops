SCRIPTNAME=upload
BASEDIR=$1
LOCALPATH=$2
REMOTEPATH=$3
EXTRA_PARAMS=$4
SCRIPTDIR=$(dirname "$0")
echo [$SCRIPTNAME] start
source $SCRIPTDIR/../ssh/vars.sh

RSYNCPROCOTOL=ssh
if [[ -f $BASEDIR/config/rsync ]]
then
    RSYNCPROCOTOL=rsync
fi

if [[ $RSYNCPROCOTOL == "ssh" ]]; then
  REMOTEHOMEDIR=`ssh -i $BASEDIR/config/id_rsa $USERNAME@$MACHINEADDR pwd`;
fi

if [[ $RSYNCPROCOTOL == "rsync" ]]; then
  REMOTEHOMEDIR=/HOME
fi

COMMON_FLAGS=-vuazP --exclude .DS_Store
LOCALHOMEDIR=`echo $HOME`;
REMOTEDIR="${REMOTEPATH/"~"/$REMOTEHOMEDIR}"
LOCALDIR="${LOCALPATH/"~"/$LOCALHOMEDIR}"
echo [$SCRIPTNAME] rsync via $RSYNCPROCOTOL - local:$LOCALDIR to remote:$REMOTEDIR

if [[ $RSYNCPROCOTOL == "ssh" ]]; then
  rsync $COMMON_FLAGS $EXTRA_PARAMS -e "ssh -i $BASEDIR/config/id_rsa $SSHPORT" $LOCALDIR $SSHUSERNAME_AT_MACHINE:$REMOTEDIR
fi

if [[ $RSYNCPROCOTOL == "rsync" ]]; then
  rsync $COMMON_FLAGS $EXTRA_PARAMS $LOCALDIR rsync://@$MACHINEADDR:8082$REMOTEDIR
fi

