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
      
# Working with SSH and RSYNC to access containers
You can access the ssh scripts by the ssh prefix:

    izy.devops "ssh?shell" MACHINE_ID
    izy.devops "ssh?runx" . "xeyes"
    izy.devops "ssh?socksproxy" MACHINE_ID
    
    izy.devops "rsync?download" . "~/Downloads/" ~/izyware/izy-idman-tools/id/x/Desktop/Downloads/
    izy.devops "rsync?upload" . "~/Downloads/" ~/izyware/izy-idman-tools/id/x/Desktop/Downloads/
    izy.devops "rsync?nodesync" ~/plat/p/servers/_machine_ "~/codepath" appname


## pem file permissions
You may get the following error when trying to SSH into the EC2 instance:

    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Permissions 0644 for 'private.pem' are too open.

To fix this chmod to

    chmod 400 private.pem
    

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


## Docker Tools
You may use the dockertools/serviceprobe docker image to troubleshoot these issues. Refer to the Dockerfile for more information and examples about how to use the tool. Notice that if you are using dockercompose you can specifiy the following in the environment section:


    ENV CONTAINER_CONTEXT: Service Probe
    ENV SLEEP_SECONDS: 5
    ENV CMD_TO_RUN: /usr/bin/nc -vz localhost 3306
    
    
You can launch dockerized browser instances using the following (this will use [docker-firefox] container image):

    izy.devops "docker?firefox" .

If you need to shell into the container to test networking, etc.

    docker run -it --entrypoint sh --name=firefox -p 5800:5800 -v folder_mapping jlesage/firefox -c sh


## Route53
* Redirect apex domain to www using Route 53: You should create an S3 bucket, Properties > Static website hosting and setup Redirect requests. Once thats setup, you can add a record for A - IPv4 address. Select Yes for Alias, and enter the S3 bucket you created earlier.


# Terraform 
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

## V7.3
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

[docker-firefox]: https://github.com/jlesage/docker-firefox
[github]: https://github.com/izyware/devops