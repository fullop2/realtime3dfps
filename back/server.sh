#!/bin/bash

pid=$(ps -ef | grep node | grep -v grep | awk '{print $2}')

if [ "$pid" = "" ]
then
	node gameserver.js &
	node chatserver.js &
	echo open game server
else
	echo pids : $pid
	kill -9 $pid
	echo close game server
fi
