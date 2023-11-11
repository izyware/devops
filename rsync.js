/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.upload = async () => modtask.runSHScript('upload.sh');
  modtask.download = async () => modtask.runSHScript('download.sh');
  modtask.nodesync = async () => modtask.runSHScript('nodesync.sh');

  modtask.runSHScript = fileName => {
    const path = `${__dirname}/rsync/${fileName}`;
    const args = process.argv.slice(4);
    require('child_process').spawn(path, args, { stdio: 'inherit' });
    return { success: true, data: '' };
  }

  return modtask;
})();
