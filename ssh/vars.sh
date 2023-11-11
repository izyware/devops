if [[ ! -f $BASEDIR/config/machinenaddr ]]
then
    echo $BASEDIR/config/machinenaddr does not exist. Please create it.
    exit -1
fi
MACHINEADDR=`cat $BASEDIR/config/machinenaddr`
if [[ ! -f $BASEDIR/config/username ]]
then
    echo $BASEDIR/config/username does not exist. Please create it.
    exit -1
fi
USERNAME=`cat $BASEDIR/config/username`
if [[ ! -f $BASEDIR/config/sourceinformationbucketid ]]
then
    echo $BASEDIR/config/sourceinformationbucketid does not exist. Please create it.
    exit -1
fi
SOURCEINFORMATIONBUCKETID=`cat $BASEDIR/config/sourceinformationbucketid`
if [[ ! -f $BASEDIR/config/id_rsa ]]
then
    echo $BASEDIR/config/id_rsa does not exist. Please create it.
    exit -1
fi