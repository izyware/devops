SCRIPTNAME=service
BASEDIR=$1
CMD=$2
SCRIPT_DIR=$(dirname $0)
PORT=8082;
source $SCRIPTDIR/../ssh/vars.sh

TEMPLATE_FILE=$SCRIPT_DIR/rsyncd.conf

RSYNC_FOLDER=~/rsync;
CONFIG_FILE=$RSYNC_FOLDER/rsyncd.conf
TOKEN_GENRATED_TS=`date`
USERID=`whoami`
GROUPID=`id -gn`
LOG_FILE=$RSYNC_FOLDER/rsyncd.log
LOCK_FILE=$RSYNC_FOLDER/rsyncd.lock
PID_FILE=$RSYNC_FOLDER/rsyncd.pid
MODULE_PATH=~


echo [$SCRIPTNAME] Stop existing rsync
sudo kill $(ps aux | grep '[r]sync --daemon' | awk '{print $2}')
sleep 1
sudo rm -rf $RSYNC_FOLDER;
mkdir -p $RSYNC_FOLDER;

if [ "$CMD" = "start" ]; then
  echo [$SCRIPTNAME] Generate rsyncd.conf

    # Replace the placeholders in the template with the user input values
    cat $TEMPLATE_FILE | \
        sed -e "s#{{UID}}#$USERID#g" \
        -e "s#{{TOKEN_GENRATED_TS}}#$TOKEN_GENRATED_TS#g" \
        -e "s#{{GID}}#$GROUPID#g" \
        -e "s#{{LOG_FILE}}#$LOG_FILE#g" \
        -e "s#{{LOCK_FILE}}#$LOCK_FILE#g" \
        -e "s#{{PID_FILE}}#$PID_FILE#g" \
        -e "s#{{MODULE_PATH}}#$MODULE_PATH#g" \
        > $CONFIG_FILE

    # Inform the user that the file has been generated
    echo [$SCRIPTNAME] rsyncd.conf has been generated as $CONFIG_FILE

  echo [$SCRIPTNAME] Starting ... 
  sudo rsync --daemon --config $CONFIG_FILE --address=$MACHINEADDR;
  sleep 1
  cat $RSYNC_FOLDER/rsyncd.log;
  sleep 3
  echo [$SCRIPTNAME] Port status
  sudo lsof -i :$PORT;
fi