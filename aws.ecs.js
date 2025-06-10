/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.executeCommand = async () => modtask.runSHScript('ecs-execute-command.sh');
  modtask.info = async () => modtask.runSHScript('info.sh');

  modtask.runSHScript = fileName => {
    const path = `bash`;
    const args = process.argv.slice(4);
    args.unshift(`${__dirname}/aws/${fileName}`);
    // Make sure interactive mode is selected or source command will fail on linux systems
    args.unshift('-i');
    require('child_process').spawn(path, args, { stdio: 'inherit' });
    return { success: true, data: '' };
  }

  return modtask;
})();
