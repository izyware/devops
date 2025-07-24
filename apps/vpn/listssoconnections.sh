BASEDIR=$1
izy.devops "ssh?shell" $BASEDIR "sudo netstat -tnp | grep sshd"