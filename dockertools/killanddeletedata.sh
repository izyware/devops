#!/bin/bash
dockerStr=$1
echo stop container and remove associated volumes using \"$dockerStr\"
docker ps | grep $dockerStr | awk '{print $1}' | xargs -L1 docker kill  
docker container ls -a  | grep $dockerStr | awk '{print $1}' | xargs -L1 docker rm -v 
