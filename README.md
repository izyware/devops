# Install
To install the tools for global access to `izy.devops` command, use:

    curl -o- https://raw.githubusercontent.com/izyware/devops/master/sh/install.sh | bash


# Working with AWS CLI Profiles
Most users have their machines setup so that they have have a an `~/.aws/config` file with different profiles:


    [default]
    region = us-east-1
    role_arn = arn:aws:iam::XXXXX:role/engineer
    source_profile = default

    [profile john]
    role_arn = arn:aws:iam::YYYYY:role/marketing
    source_profile = default

    [profile james]
    role_arn = arn:aws:iam::ZZZZ:role/marketing
    source_profile = default

This will allow you to pass `--profile john` to the CLI. 

However, AWS node SDK does not support the profile option. You can always verify the "current user" by:

    izyaws.sh userId sts get-caller-identity

Or, from the scripting environment:

    const sts = new AWS.STS();

    sts.getCallerIdentity((err, data) => {
      console.log(err, data);
    });

To work around this problem, you can use assume role:

    izyaws.sh <ID> sts assume-role --role-arn "arn:aws:iam::xxxx" --role-session-name yourname --duration-seconds 3600
    
    
Remember that new IAM users by default may not have any permissions or be part of any groups. You can use the following as a starting point:

    // full access to AWS services and resources.
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "*",
                "Resource": "*"
            }
        ]
    }


You can then set

    export AWS_ACCESS_KEY_ID=
    export AWS_SECRET_ACCESS_KEY=
    export AWS_SESSION_TOKEN=

After you are done, be sure to unset the variables by

     unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
     
If you need to generate a One Time Password from the cli use

    izy.devops "otp?generate" queryObject.secretStrBase32 your_secret
    izy.devops "otp?generate" queryObject.secretPath ~/.aws/otpsecret
    izy.devops "otp?generate" queryObject.secretPath ~/googleAccount1/otpsecret
    
To create an aws session automatically using the otp feature do

    izy.aws "sts?newSession"


# Debugging AWS Node SDK Network Traffic

You can use the following snippet inside `aws-sdk/lib/http/node.js`. 

    console.log('HTTP_REQUEST', JSON.stringify(httpRequest, null, 2));
    var stream = http.request(options, function (httpResp) {
      console.log('OK-------------------------');

      var str = '';
      var response = httpResp;
      response.on('data', function (chunk) {
        str += chunk;
      });
      response.on('end', function () {
        console.log({
          success: true,
          responseText: str,
          status: response.statusCode,
          headers: response.headers
        });
      });
      return ;
      
# Working with SSH to access containers
You can access the ssh scripts by the ssh prefix:

    izy.devops "ssh?shell" MACHINE_ID
    izy.devops "ssh?runx" . "xeyes"
    izy.devops "ssh?socksproxy" MACHINE_ID
    
    [container] izy.devops "ssh?publishport" $HOME/vpn 8022
    [vpn] izy.devops "ssh?localforward" .
    [local] izy.devops "ssh?socksproxy" . remote
    

If your containers dont have key-pair setup, create the key-pair and push to the remote server:

    cd CONTAINER_DIR;
    ssh-keygen -f ./id_rsa
    chmod 400 id_rsa*
    mv id_rsa* config   
    ssh-copy-id -i ./config/id_rsa.pub user@server
    
Then test it with

    izy.devops "ssh?shell . 
    
## pem file permissions
You may get the following error when trying to SSH into the EC2 instance:

    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Permissions 0644 for 'private.pem' are too open.

To fix this chmod to

    chmod 400 private.pem
    
# Working with RSYNC to copy and move files around
If you have SSH access to the containers use:

    export CONTAINER_ID=~/izyware/izy-idman-tools/id/_id_/host;
    izy.devops "rsync?download" $CONTAINER_ID "~/Downloads/" ~/izyware/izy-idman-tools/id/x/Desktop/Downloads/
    izy.devops "rsync?upload" $CONTAINER_ID "~/Downloads/" ~/izyware/izy-idman-tools/id/x/Desktop/Downloads/
    izy.devops "rsync?nodesync" $CONTAINER_ID "~/codepath" appname appparam
    
If you prefer to move the files, use the `--remove-source-files` flag at the end.
    
If SSH access is not available or you are in an environment where SSH access is not safe, you may start RSYNC as a service on the unsafe environment:

    izy.devops "rsync?service" $CONTAINER_ID start|stop
    
Note: Make sure you are using the latest version of rsync on macOS by `brew install rsync`.
    
To consolidate all downstream container data for upstream utilization:

    rsync?consolidate ID
    
    
# Setting up VPN for your organization

## Server Setup
For the VPN server, we recomment using one of the standard AMIs that is maintainated and kept secure and up to date such as OpenVPN Access Server Community Image (AWS marketplaces OpenVPN Access Server-2-8-5). A t2.small with 8GB storage should be sufficient for all practical purposes. Pick the region that is geographically closest to your users.

One you launch the EC2, you should ssh into the machine. You will be greeted by the automatic setup script. Choose the following configuration options:

* default cypher algorithms (secp384r1)
* port number for the Admin Web UI: 943 
* TCP port number for the OpenVPN Daemon: 443
* Do you wish to login to the Admin UI as "openvpn"? Yes
* Should client traffic be routed by default through the VPN? Yes  default [no]
* Should client DNS traffic be routed by default through the VPN? Yes  default [no]
* Should private subnets be accessible to clients by default? yes
* You will also create a (username, password) pair for clients: if you need to update the password use:

        sudo passwd username
        

If you need to make futher changes to the server such as setting up SSO, etc. it can be configured by accessing its Admin Web UI using your Web browser.


## Client Setup
Access the Client UI at https://SERVER_IP:943/ using the credential created above and download the `client.ovpn` file. Also place the (username, password) pair in the `auth-user-pass.txt`.

You can copy the files to your destination client machine by doing

    izy.devops "rsync?upload" . "PATH/servers/vpn-server_id/" client_machine_path/servers/vpn-server_id
    
Use the following command:
                   
    izy.devops "openvpn?connect" . SUDO_PASSWORD

Note that the client will need sudo to get on the vpn. 

## Using the openVPN Client in the IzyShell docker container
The openvpn client uses the dev/net/tun device. With docker > 1.2 you should use use:
    
    --cap-add=NET_ADMIN
    --device /dev/net/tun 
    
If you are using an earlier version, you'll have to run it in privileged mode. 

To make sure that the DNS will always work, you should make sure that your DNS server is routed through the eth0 interface. For this reason always use the utilities provided in the ~/vpn folder:

    ~/vpn_connect.sh connectionfile.ovpn
    OR
    ~/vpn_connect_socks.sh connectionfile.ovpn
    
    ~/vpn_disconnect.sh
    
    
The VPN server will be sending commands to setup the tun interface devices. You should check the client output for:

    /sbin/ifconfig utun...
    
Then on the container check the routing config and the utun devices:

    ifconfig
    netstat -rn
    
and make sure that the tun interface is recieving traffic.

Then try connecting to a known IP address without using the DNS:

    nc -v myservice_ip myservice_port
    
The test the DNS, 

    cat /etc/resolv.conf 
    host izyware.com
    
## Offer a SOCKS server via the VPN interface 

To get the IP address for the VPN network interface, do

    VPN_SERVICE_IP=`ifconfig | grep 172 | awk -F'[: ]+' '{ print $3 }'`
    
Then use SSH 

    ssh -v -o StrictHostKeyChecking=no -ND "*:19009" test@$VPN_SERVICE_IP
    
## Tunneling the VPN via SOCKS
OpenVPN support tunneling the openVPN Client via SOCKS. OpenVPN expects a a SOCKS5 server. Notice that openSSH implementation of SOCKS5 does not support UDP and trying to connect to openSSH will result in:

    debug1: Connection to port __LOCALPORT__ forwarding to socks port 0 requested.
    debug2: fd 6 setting TCP_NODELAY
    debug2: fd 6 setting O_NONBLOCK
    debug3: fd 6 is O_NONBLOCK
    debug1: channel 2: new [dynamic-tcpip]
    debug2: channel 2: pre_dynamic: have 0
    debug2: channel 2: pre_dynamic: have 3
    debug2: channel 2: decode socks5
    debug2: channel 2: socks5 auth done
    debug2: channel 2: pre_dynamic: need more
    debug2: channel 2: pre_dynamic: have 0
    debug2: channel 2: pre_dynamic: have 10
    debug2: channel 2: decode socks5
    debug2: channel 2: socks5 post auth
    debug2: channel 2: only socks5 connect supported
    
However, successful connections would have resulted in ()

    debug2: channel 8: dynamic request: socks5 host __IP__ port 443 command 1
    
The reason is openSSH does not support "UDP ASSOCIATE" (only "SSH_SOCKS5_CONNECT"). See rfc1928 for more details.

To address this issue, either use protoco TCP (you would need to do the same for using http proxy because proxying is only supported for the TCP protocol). i.e. to have TCP enabled for your openVPN server:

    /etc/openvpn/server.conf
    /var/log/syslog
    service openvpn status
    service openvpn restart
    
As an alternative, you may use vendors that are SOCKS5 compliant. We recommend [dante]:

    git clone https://github.com/wernight/docker-dante
    sudo docker build --rm -t izyidman_dante .
    
    sudo docker run -d -p 1080:1080 izyidman_dante


# AWS Quirks
Use the following tools and processes to workaround the issues from aws.

## Codebuild
You can check the latest build status and logs by:

    izy.aws "codebuild?check" queryObject.izyUser 86 queryObject.showLogs true queryObject.projectName myProject
    
Exploring codebuild setup and viewing a build projects details
    
    npm run codebuild.projectDetails queryObject.izyUser 86 queryObject.projectName myProject 
    

To debug your code build scripts (buildspec.*) use the provided docker Image:

    docker build -f codebuild/Dockerfile -t izy-aws-codebuild:7.0  .;
    
You can then shell into the environment and run your commands:

    docker run -e BUILD_DIR=`pwd` --env-file ~/docker_env-file.list -v /var/run/docker.sock:/var/run/docker.sock  -v `pwd`:/sourcedirectory -it --entrypoint sh izy-aws-codebuild:7.0 -c bash;
    docker_shell>rsync -av /sourcedirectory/ ~/src;
    docker_shell>killanddeletedata.sh image_keyword (i.e. sql)
    
Notice that if you dont have a env file or AWS credentials are not available as environment variables you share your .aws folder:

    -v `echo ~/.aws`:/root/.aws


If your application generates or uses docker containers as part of its CICD, you will need to use privilaged mode inside codebuild. Notice that the filesystem/volume mapping and network interfaces addresses can get confusing in this case. The most common issue reported on MacOS platforms vs Linux (Codebuild) is that the docker-compose volume mapping (using the volumes block) on Mac will only work if full path to host operating system is provided. Therefore, it is recommended to use the `BUILD_DIR` variable. The other common issue reported for MacOS is that passing environment variables with newline from MacOS to the container environment will endup converting the newlines to "\n" string which could be a problem. If your code relies on environment variables for file generation, you should take this into account and convert "\n" to new line (for example by using awk or sed).

## CloudWatch 
CloudWatch log querying can present a significant challenge, often proving to be both complex and time-consuming due to a variety of factors. The intricacies of working with large volumes of log data, coupled with the limitations of CloudWatch’s native query capabilities, can make the process of extracting meaningful insights both labor-intensive and inefficient. To streamline this task, it is highly recommended to leverage the CLW group of tools, which facilitates the seamless importation of logs into a JSON-based storage system. Once the logs are stored in this manner, they can then be efficiently aggregated and analyzed using the Izy-sync tools, thereby optimizing the querying process and improving overall data management efficiency. 

The tool offers automatic handling of iteration through the use of the next-token, eliminating the need for manual pagination. It also provides the ability to pause and later resume the filtering operation, ensuring flexibility and control over the process. Additionally, it allows for the storage of progress, enabling seamless monitoring of the operation’s advancement and facilitating better tracking and management throughout the process:

    export $CLW_LOG_QUERY=yourfile.sh
    izy.devops "aws/clw?filter-log-events" $CLW_LOG_QUERY
    izy.devops "aws/clw?fromJSONCache" queryObject.clwRawStorePath ~/clw-json/store
    
The CLW_LOG_QUERY file will specify the parameters to the CLI.

    AWS_CLI_PARAMS=$(echo --profile izyware --region eu-central-2)
    
    # Use a specific time to search from 
    FILTER_PARAM=$(echo --filter-pattern "index.html" --start-time `date -j -f "%b %d %T %Z %Y" "Jan 01 00:00:00 GMT 2020" "+%s"`000)
    
    # Search everything in the past 7 hours
    FILTER_PARAM=$(echo --filter-pattern "index.html" --start-time `date -j -v -3H "+%s"`000) 
    
    AWS_LOG_GROUP=/aws/path/to/group
    LIMIT=1000
    JSON_STORE_PATH=~/clw-json/store
    


## Docker Tools
You may use the dockertools/serviceprobe docker image to troubleshoot these issues. Refer to the Dockerfile for more information and examples about how to use the tool. Notice that if you are using dockercompose you can specifiy the following in the environment section:


    ENV CONTAINER_CONTEXT: Service Probe
    ENV SLEEP_SECONDS: 5
    ENV CMD_TO_RUN: /usr/bin/nc -vz localhost 3306
    
    
You can launch dockerized browser instances using the following options:

use [docker-firefox] container image:

    izy.devops "docker?firefox" .
    
Note that `Desktop/firefox` subfolder will contain the `profile/storage/default` subfolder which can end-up with a large number of small files. This can be challenging for automated backup process of SOURCEINFORMATIONBUCKETID. As a workaround, you can store this in a diskimage.


    # Either create an empty diskimage (If no source data is available)
    hdiutil create -type SPARSE -volname "firefox_data_dir_$SOURCEINFORMATIONBUCKETID" $HOME/izyware/izy-idman-tools/id/$SOURCEINFORMATIONBUCKETID/Desktop/firefox.sparseimage

    # OR create one from source data
    hdiutil create -srcfolder ~/izyware/izy-idman-tools/id/$SOURCEINFORMATIONBUCKETID/Desktop/firefox -format UDSP -volname "firefox_data_dir_$SOURCEINFORMATIONBUCKETID" $HOME/izyware/izy-idman-tools/id/$SOURCEINFORMATIONBUCKETID/Desktop/firefox.sparseimage
    
    # Finally mount it
    hdiutil mount $HOME/izyware/izy-idman-tools/id/$SOURCEINFORMATIONBUCKETID/Desktop/firefox.sparseimage
        
This will allow the docker environment to access the mounted folder inside at /Volumes/firefox_data_dir_$SOURCEINFORMATIONBUCKETID

        
The following are the recommended customization for maximum security and interoperability:
* Some users have reported issues for pages accessing the clipboard. Make sure to do `about:config > clipboard` and set all the flags to true.
* Some online services are sensitive to the user agent string and even when connecting from the same IP, when the user string is different they will detect it and may introduce issues. To override do `about:config > general.useragent.override`
* Use a socks server `about:settings > socks`
    * Also set `network.proxy.socks_remote_dns`, otherwise some DNS lookups may fail
* Timezone is still broken. Notice that setting `privacy.resistFingerprinting` will not address the timezone issue and it will break the useragent customization.

        
use [docker-chrome] container image:

    izy.devops "docker?chrome" .


If you need to shell into the container to test networking, etc.

    docker run -it --entrypoint sh --name=firefox -p 5800:5800 -v folder_mapping jlesage/firefox -c sh


## Route53
* Redirect apex domain to www using Route 53: You should create an S3 bucket, Properties > Static website hosting and setup Redirect requests. Once thats setup, you can add a record for A - IPv4 address. Select Yes for Alias, and enter the S3 bucket you created earlier.


# Terraform 

## Terraform Cloud Tools
To clone and copy entire workspaces—or selectively transfer components such as SSH keys, teams, and variables—please use the following command:

    izy.devops "terraform?cp" queryObject.srcWorkspaceId <sourceId> queryObject.destWorkspaceId <destinationId>
    izy.devops "terraform?cp" queryObject.workspaceFullname organization/workspace-name queryObject.destWorkspaceId <destinationId>
    
The destWorkspaceId parameter is optional. If it is not specified, a new workspace will be created automatically. When provided, the SSH keys, team configurations, and variables from the source workspace will be copied into the designated destination workspace.

This operation relies on the credentials file located at `~/.terraform.d/credentials.tfrc.json`. Please ensure that your API token is correctly configured in this file before proceeding.


Other common operations include:

    izy.devops "terraform?update" queryObject.key organization/workspace-name/key queryObject.value value
    izy.devops "terraform?run" queryObject.workspaceFullname organization/workspace-name queryObject.message message


## Infrastructure 
We recommend using the Terraform docker image. We provide template apps in the apps folder. As an example, to quickly setup and deploy a static website for a domain follow these steps:


Deep clone the app directory:

    rsync -rv apps/static-website/ myfolder
    cd myfolder;
    
Update the variables (domain, aws credentials, etc.) inside the 

    vi terraform_config.sh
    
Make sure that you dont use the naked (apex) domain name and use a prefix (www, etc.). DNS protocol does not support CNAME records or 301 redirects for the apex record. See the section regarding AWS Quirks below to learn how to redirect the apex to your subdomain (domain -> www.domain).

Shell into the image:

        docker run -v `pwd`:/izyhostdir -it --entrypoint sh hashicorp/terraform:latest 
        
Once inside the image, do:

        clear; cd /izyhostdir; source ./terraform_config.sh; terraform apply -auto-approve;
        
The output should print the list of environment variables that will be used below:

        export AWS_CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME=GRAB_FROM_TERRAFORM_OUTPUT;
        export AWS_CLOUDFRONT_DISTRIBUTION_ID=GRAB_FROM_TERRAFORM_OUTPUT;
        export AWS_S3_BUCKET_ID=GRAB_FROM_TERRAFORM_OUTPUT;
        
You can push your files to the s3 bucket:

        izyaws.sh <VaultId> s3 cp /izyhostdir/src s3://$AWS_S3_BUCKET_ID --recursive 
        
Make sure to invalidate the cloudfront distribution after the push
    
        izyaws.sh <VaultId> cloudfront create-invalidation --distribution-id $AWS_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
        
## Terraform Quirks
* aws_cloudfront_distribution
    * when this is being created for the firsttime, you might get a "Missing required argument" error, followed by `The argument "origin.0.domain_name" is required, but no definition was found.`. rerunning the plan will address this.
    * viewer_certificate block for cloudfront will only accept certificates that are in us-east-1, regardless of your region.


# Docker 
When running out of space, do

    deleteall.sh
    
If you have a stateful container (i.e. mysql), you should stop and delete its state by 

    killanddeletedata.sh grepStr (mysql)
    
To build runtimes

    docker build -f dockertools/nodejs/Dockerfile -t izy-nodejs:16.0  .;
    docker run -it --entrypoint sh izy-nodejs:16.0 -c bash;


# Links
[github]


# ChangeLog

## V7.5
* 75000013: terraform - update documentation and add run and update
* 75000012: terraform - implement support for user friendly names
* 75000011: install.sh - replace existing installation
    * fixes a bug where a pre-existing installation would prevent it from installing correctly
* 75000010: terraform - update documentation for cloud tools
* 75000009: rsync - add exclusion list. only copy if source is newer
* 75000008: implement rsync?consolidate
* 75000007: implement clw cli
* 75000006: add ability to pass additional parameters to rsync 
    * to move files use --remove-source-files
* 75000005: implement rsync service
* 75000004: enable interactive mode for shell spawns
    * linux systems shells would error out on the source token without this feature
* 75000003: improve publishport functionality
    * Add ExitOnForwardFailure to notify the service container to exit 
* 75000002: update script names
* 75000001: move firefox shared folder to diskimage

## V7.4
* 74000003: fix install script and use sudo npm link
    * customers reported EACCES: permission denied on Ubuntu
* 74000002: remove git dependency from install script
* 74000001: implement openvpn?connect tool

## V7.3
* 73000028: implement SSH_OPTIONS_CLI for controlling StrictHostKeyChecking
    * useful for headless and automation environments
* 73000027: add explicit ServerAliveInterval for client
* 73000026: implement portforwarding and remote ssh access and add support for non standard ssh service port 22
* 73000025: update help message
* 73000024: implement device switch firefox web extension
    * access from about:debugging > This Firefox > Load Temporary Add on .. > /browserdir
* 73000023: add containerized chrome to dockertools
* 73000022: implement help command. update README
* 73000021: implement install script
* 73000020: add containerized firefox to dockertools
* 73000019: add standard containerized izy-proxy runtimes to dockertools
* 73000018: implement socks proxy via ssh

## V7.1
* 7100005: implement nodesync functionality
* 7100004: add the ssh and rsync scripts
* 7100003: rename from izy-aws to izy-devops
* 7100002: clean environment variables for sts session before calling aws cli
    * if set incorrectly aws cli will fail
* 7100001: implement automatic sts session creation using the OTP feature

## V7.0
* 7000002: codebuild scripts bug fix and improvements
* 7000001: add support for OTP generation

## V6.9
* 6900005: add codebuild docker image
* 6900004: add dockertools scripts
* 6900003: add dockertools/serviceprobe
* 6900002: add apps/static-website sample app with terraform 
* 6900001: Codebuild - implement projectDetails
    * useful for exploring codebuild setup and viewing a build projects details in AWS CodeBuild
    * utilize callpretty for better output
    * add verbose logging

## V6.8
* 6800002: Codebuild migration
* 6800001: initial migration

[dante]: https://github.com/wernight/docker-dante
[docker-firefox]: https://github.com/jlesage/docker-firefox
[docker-chrome]: https://github.com/kasmtech/workspaces-images
[github]: https://github.com/izyware/devops