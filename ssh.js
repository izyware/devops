/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.shell = async () => modtask.runSHScript('shell.sh');
  modtask.runx = async () => modtask.runSHScript('runx.sh');
  modtask.socksproxy = async () => modtask.runSHScript('socksproxy.sh');
  modtask.localforward = async () => modtask.runSHScript('localforward.sh');
  modtask.publishport = async () => modtask.runSHScript('publishport.sh');

  modtask.runSHScript = fileName => {
    const path = `bash`;
    const args = process.argv.slice(4);
    args.unshift(`${__dirname}/ssh/${fileName}`);
    // Make sure interactive mode is selected or source command will fail on linux systems
    args.unshift('-i');
    require('child_process').spawn(path, args, { stdio: 'inherit' });
    return { success: true, data: '' };
  }

  return modtask;
})();
