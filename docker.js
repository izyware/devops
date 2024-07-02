/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.firefox = async () => modtask.runSHScript('firefox.sh');
  modtask.chrome = async () => modtask.runSHScript('chrome.sh');

  modtask.runSHScript = fileName => {
    const path = `${__dirname}/dockertools/${fileName}`;
    const args = process.argv.slice(4);
    require('child_process').spawn(path, args, { stdio: 'inherit' });
    return { success: true, data: '' };
  }

  return modtask;
})();
