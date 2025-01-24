if [[ ! -f $BASEDIR/config/machinenaddr ]]
then
    echo $BASEDIR/config/machinenaddr does not exist. Please create it.
    exit -1
fi
MACHINEADDR=`cat $BASEDIR/config/machinenaddr`

if [[ ! -f $BASEDIR/config/username ]]
then
    echo $BASEDIR/config/username does not exist. Please create it - leave it empty if no username.
    exit -1
fi
USERNAME=`cat $BASEDIR/config/username`

if [[ ! -f $BASEDIR/config/sourceinformationbucketid ]]
then
    echo $BASEDIR/config/sourceinformationbucketid does not exist. Please create it.
    exit -1
fi
SOURCEINFORMATIONBUCKETID=`cat $BASEDIR/config/sourceinformationbucketid`

SSHUSERNAME_AT_MACHINE=$USERNAME@$MACHINEADDR
if [ -z "${USERNAME}" ]; then
  SSHUSERNAME_AT_MACHINE=$MACHINEADDR
fi

SSHPORT=
if [[ -f $BASEDIR/config/sshport ]]; then
  SSHPORT="-p `cat $BASEDIR/config/sshport`"
fi

SSH_OPTIONS_CLI="-o StrictHostKeyChecking=no -o ServerAliveInterval=60"
