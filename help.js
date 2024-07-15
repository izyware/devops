/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {
    console.log(require('fs').readFileSync(`${__dirname}/README.md`).toString());
    console.log(`Installed at: ${__dirname}`);
  };
  return modtask;
})();