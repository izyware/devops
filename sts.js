/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.newSession = async queryObject => {
    let { serialNumber, tokenCode, accessKeyAndSecret } = queryObject;
    if (!serialNumber) serialNumber = 'file://~/.aws/serial-number&contentType=text/plain';
    if (!tokenCode) tokenCode = '//inline/otp?generate&secretPath=~/.aws/otpsecret';
    if (!accessKeyAndSecret) accessKeyAndSecret = 'file://~/.aws/accesskey-secret&contentType=text/plain';
    const awsCli = process.env.AWS_CLI_COMMAND || 'aws';
    return await modtask.newChainAsync([
      ['//inline/lib/izy-proxy-beta-features?loadValues', { serialNumber, tokenCode, accessKeyAndSecret }],
      chain => {
        let { serialNumber, tokenCode, accessKeyAndSecret } = chain.get('outcome').data;
        serialNumber = serialNumber.replace('\n', '');
        require('fs').writeFileSync(`${require('os').homedir()}/.aws/credentials`, accessKeyAndSecret);
        let cmd = `${awsCli} sts get-session-token --serial-number ${serialNumber} --token-code ${tokenCode}`;
        // delete environment variables in case they are invalid
        delete process.env.AWS_ACCESS_KEY_ID;
        delete process.env.AWS_SECRET_ACCESS_KEY;
        delete process.env.AWS_SESSION_TOKEN;
        chain(['//inline/lib/shell?exec', {
          cmd, format: 'json'
        }]);
      },
      chain => {
        const { Credentials } = chain.get('outcome').data;
        const map = {
          AWS_ACCESS_KEY_ID: Credentials.AccessKeyId,
          AWS_SECRET_ACCESS_KEY: Credentials.SecretAccessKey,
          AWS_SESSION_TOKEN: Credentials.SessionToken
        };
        // POSIX uses \n, Windows uses \r\n
        const { EOL } = require('os');
        let credentials = `[default]`;
        let envCmd = '';
        for(let p in map) {
          credentials += `${EOL}${p.toLowerCase().replace(/_/g, '_')}=${map[p]}`;
          envCmd += `export ${p}=${map[p]};${EOL}`;
        }
        require('fs').writeFileSync(`${require('os').homedir()}/.aws/credentials`, credentials);
        chain(['outcome', { success: true, data: envCmd }]);
      }
    ]);
  }

  return modtask;
})();
