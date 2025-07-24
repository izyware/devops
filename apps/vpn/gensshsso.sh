BASEDIR=$1
SCRIPTDIR=$(dirname "$0")
source $SCRIPTDIR/../../ssh/vars.sh
PRIVATE_KEY_CONTENT=$(cat $BASEDIR/config/id_rsa | base64)
PRIVATE_KEY_PATH=./pk.fly
SSOUSER=mynewuser

echo [gensshsso] generate script
rm -f ssolink.sh
cat <<EOF > ssolink.sh
#!/usr/bin/env bash
{
echo sso setting up
echo "$PRIVATE_KEY_CONTENT" | base64 -d > $PRIVATE_KEY_PATH
chmod 600 $PRIVATE_KEY_PATH
echo sso start
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o UserKnownHostsFile=/dev/null -i $PRIVATE_KEY_PATH -f -N -R 22$SOURCEINFORMATIONBUCKETID:localhost:22 $SSOUSER@$MACHINEADDR
}
EOF
chmod +x ssolink.sh
echo [gensshsso] upload script
izy.devops "rsync?upload" . ./ssolink.sh "~/ssolink.sh"
# this fails: izy.devops "ssh?shell" . "command below" due to console 
echo [gensshsso] move to server directory 
ssh -i $BASEDIR/config/id_rsa $SSHUSERNAME_AT_MACHINE "sudo cp ~/ssolink.sh /usr/share/nginx/html/$SOURCEINFORMATIONBUCKETID.html"

echo [gensshsso] provision $SSOUSER
ssh -i $BASEDIR/config/id_rsa $SSHUSERNAME_AT_MACHINE "sudo adduser $SSOUSER;sudo mkdir -p /home/$SSOUSER/.ssh;sudo cp /home/ec2-user/.ssh/authorized_keys /home/$SSOUSER/.ssh/authorized_keys;sudo chown -R $SSOUSER:$SSOUSER /home/$SSOUSER/.ssh;sudo chmod 700 /home/$SSOUSER/.ssh;sudo chmod 600 /home/$SSOUSER/.ssh/authorized_keys"

echo [gensshsso] Success. Use the below commands
echo remote container: "curl http://$MACHINEADDR/$SOURCEINFORMATIONBUCKETID.html | bash"
echo    vpn container: ssh -p 22$SOURCEINFORMATIONBUCKETID localhost
