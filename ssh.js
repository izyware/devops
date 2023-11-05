/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.shell = async () => modtask.runSHScript('shell.sh');
  modtask.runx = async () => modtask.runSHScript('runx.sh');

  modtask.runSHScript = fileName => {
    const path = `${__dirname}/ssh/${fileName}`;
    const args = process.argv.slice(4);
    require('child_process').spawn(path, args, { stdio: 'inherit' });
    return { success: true, data: '' };
  }

  return modtask;
})();
