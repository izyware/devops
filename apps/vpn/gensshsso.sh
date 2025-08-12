SCRIPTNAME=gensshsso
BASEDIR=$1
CONTAINER_ID=$2
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../../ssh/vars.sh
PRIVATE_KEY_CONTENT=$(cat $BASEDIR/config/id_rsa | base64)
PRIVATE_KEY_PATH=./pk.fly
SSOUSER=mynewuser
SSH_PORT_AT_VPN_CONTAINER=$((22000+$SOURCEINFORMATIONBUCKETID))

echo [$SCRIPTNAME] generate script, SSH_PORT_AT_VPN_CONTAINER = $SSH_PORT_AT_VPN_CONTAINER
rm -f ssolink.sh
cat <<EOF > ssolink.sh
#!/usr/bin/env bash
{
echo sso setting up
echo "$PRIVATE_KEY_CONTENT" | base64 -d > $PRIVATE_KEY_PATH
chmod 600 $PRIVATE_KEY_PATH
echo sso start
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o UserKnownHostsFile=/dev/null -i $PRIVATE_KEY_PATH -f -N -R $SSH_PORT_AT_VPN_CONTAINER:localhost:22 $SSOUSER@$MACHINEADDR
}
EOF
chmod +x ssolink.sh
echo [$SCRIPTNAME] upload script
izy.devops "rsync?upload" . ./ssolink.sh "~/ssolink.sh"
# this fails: izy.devops "ssh?shell" . "command below" due to console 
echo [$SCRIPTNAME] move to server directory 
ssh $SSH_OPTIONS_IDENTITY_FILE $SSHUSERNAME_AT_MACHINE "sudo cp ~/ssolink.sh /usr/share/nginx/html/$SOURCEINFORMATIONBUCKETID.html"

echo [$SCRIPTNAME] provision $SSOUSER
ssh $SSH_OPTIONS_IDENTITY_FILE $SSHUSERNAME_AT_MACHINE "sudo adduser $SSOUSER;sudo mkdir -p /home/$SSOUSER/.ssh;sudo cp /home/ec2-user/.ssh/authorized_keys /home/$SSOUSER/.ssh/authorized_keys;sudo chown -R $SSOUSER:$SSOUSER /home/$SSOUSER/.ssh;sudo chmod 700 /home/$SSOUSER/.ssh;sudo chmod 600 /home/$SSOUSER/.ssh/authorized_keys"

if [ -n "$CONTAINER_ID" ]; then
    echo [$SCRIPTNAME] update $CONTAINER_ID
    echo localhost > $CONTAINER_ID/config/machinenaddr
    cp $BASEDIR/config/sourceinformationbucketid $CONTAINER_ID/config/sourceinformationbucketid
    echo $SSH_PORT_AT_VPN_CONTAINER > $CONTAINER_ID/config/sshport 
else
    echo [$SCRIPTNAME] Success. Use the below commands
    echo remote container: "curl http://$MACHINEADDR/$SOURCEINFORMATIONBUCKETID.html | bash"
    echo    vpn container: ssh -p $SSH_PORT_AT_VPN_CONTAINER localhost
fi

