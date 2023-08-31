#!/bin/bash
while :
do
	timestamp=`date +%H:%M:%S`
	prefix=`echo [$CONTAINER_CONTEXT] [$timestamp]`
	echo $prefix $CMD_TO_RUN
	$CMD_TO_RUN
	sleep $SLEEP_SECONDS
done
