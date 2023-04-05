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


You can then set

    export AWS_ACCESS_KEY_ID=
    export AWS_SECRET_ACCESS_KEY=
    export AWS_SESSION_TOKEN=

After you are done, be sure to unset the variables by

     unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN

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
You may get the following error when trying to SSH into the EC2 instance:

    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Permissions 0644 for 'private.pem' are too open.

To fix this chmod to

    chmod 400 private.pem
