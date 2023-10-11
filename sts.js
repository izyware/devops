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
        console.log(cmd);
        chain(['//inline/lib/shell?exec', {
          cmd, format: 'json'
        }]);
      },
      chain => {
        const { Credentials } = chain.get('outcome').data;
        let credentials = `[default]`;
        credentials += `\r\naws_access_key_id = ${Credentials.AccessKeyId}`;
        credentials += `\r\naws_secret_access_key = ${Credentials.SecretAccessKey}`;
        credentials += `\r\naws_session_token = ${Credentials.SessionToken}`;
        require('fs').writeFileSync(`${require('os').homedir()}/.aws/credentials`, credentials);
        chain(['outcome', { success: true, data: `AWS session created and is valid until ${Credentials.Expiration}` }]);
      }
    ]);
  }

  return modtask;
})();
