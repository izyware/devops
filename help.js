/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => console.log(require('fs').readFileSync(`${__dirname}/README.md`).toString());
  return modtask;
})();