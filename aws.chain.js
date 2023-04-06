/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = function(chainItem, next, $chain) {
    var i = 0;
    var params = {};
    params.action = chainItem[i++];
    switch (params.action) {
      case 'run':
        return true;
    }
    return false;
  }
  const run = require('izy-proxy/asyncio')(modtask).run;

  var generateFinalCmd = function(cmd, izyUser) {
    const awsDockerCommand = `docker run -e LANG=C.UTF-8 --rm -v $HOME/izyware/izy-idman-tools/id/${izyUser}:/root -v $(pwd):/izyhostdir amazon/aws-cli `;
    cmd = cmd.replace(`aws `, awsDockerCommand);
    return cmd;
  }

  modtask.runAWSCommand = async queryObject => {
    let { cmd, izyUser, format} = queryObject;
    if (!izyUser) return { reason: 'specify izyUser for AWS command. i.e. 86 '};
    if (!format) format = 'json';
    cmd = generateFinalCmd(cmd, izyUser);
    return await run('//inline/lib/shell?exec', {
      cmd,
      format
    });
  }
  return modtask;
})();
