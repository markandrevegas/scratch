#!/bin/bash

PORT=3000

# Check if port is in use
PID=$(lsof -ti tcp:$PORT)

if [ -n "$PID" ]; then
	echo "Port $PORT is in use by PID $PID. Killing..."
	kill -9 $PID
else
	echo "Port $PORT is free."
fi
