/* izy-loadobject nodejs-require */
module.exports = (function() {
  const OTPAuth = require('otpauth');
  const modtask = () => {};
  modtask.generate = async queryObject => {
    let { secretPath, secretStrBase32 } = queryObject;
    secretStrBase32
    if (secretPath) {
      secretStrBase32 = modtask.loadSecretFromPath({ path: secretPath });
    } 

    secretStrBase32 = secretStrBase32.replace(/\s/g, '');
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secretStrBase32),
    });
    // Generate a token (returns the current token as a string).
    let token = totp.generate();
    return { success: true, data: token };
  }

  modtask.loadSecretFromPath = queryObject => {
    const homeDir = require('os').homedir();
    const secretFilesPath = queryObject.path.replace('~', homeDir);
    return require('fs').readFileSync(secretFilesPath).toString();
  }


  return modtask;
})();