/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.service = async () => modtask.runSHScript('service.sh');
  modtask.upload = async () => modtask.runSHScript('upload.sh');
  modtask.download = async () => modtask.runSHScript('download.sh');
  modtask.nodesync = async () => modtask.runSHScript('nodesync.sh');
  modtask.consolidate = async () => modtask.runSHScript('consolidate.sh');

  modtask.runSHScript = fileName => {
    const path = `bash`;
    const args = process.argv.slice(4);
    args.unshift(`${__dirname}/rsync/${fileName}`);
    // Make sure interactive mode is selected or source command will fail on linux systems
    args.unshift('-i');
    require('child_process').spawn(path, args, { stdio: 'inherit' });
    return { success: true, data: '' };
  }

  return modtask;
})();
