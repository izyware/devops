SCRIPTNAME=consolidate
ID_TOKEN=$1
SCRIPTDIR=$(dirname "$0")
echo [$SCRIPTNAME] start

HOST_DIR=~/izyware/izy-idman-tools/id/$ID_TOKEN/host
WORKSTATION_DIR="~/izyware/izy-idman-tools/id/"$ID_TOKEN/workstation
HOSTCMD=$(echo izy.devops \"rsync?download\" $WORKSTATION_DIR \"$WORKSTATION_DIR/\" $WORKSTATION_DIR)
HOSTCMD=$(echo $HOSTCMD | base64)
LOCALCMD=$(echo izy.devops \"rsync?download\" $HOST_DIR \"$WORKSTATION_DIR/\" $WORKSTATION_DIR)
echo [$SCRIPTNAME] host
izy.devops "ssh?shell" $HOST_DIR "echo $HOSTCMD | base64 --decode | bash -i"
echo [$SCRIPTNAME] local
LOCAL_WORKSTATION_DIR="${WORKSTATION_DIR/"~"/$HOME}"
$SCRIPTDIR/download.sh $HOST_DIR "$WORKSTATION_DIR/" $LOCAL_WORKSTATION_DIR


