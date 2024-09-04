/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.connect = async () => modtask.runSHScript('connect.sh');

  modtask.runSHScript = fileName => {
    const path = `${__dirname}/openvpn/${fileName}`;
    const args = process.argv.slice(4);
    require('child_process').spawn(path, args, { stdio: 'inherit' });
    return { success: true, data: '' };
  }

  return modtask;
})();

