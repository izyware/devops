/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.loadValues = queryObject => {
    const ret = {};
    const chains = [];
    for(let p in queryObject) {
      chains.push(['//inline/?localValue', { key: queryObject[p] }]);
      chains.push(_chain => {
        ret[p] = _chain.get('outcome').data;
        _chain(['continue']);
      });
    }
    chains.push(chain => chain(['outcome', { success: true, data: ret }]));
    modtask.doChain(chains);
  }

  modtask.localValue = (queryObject, cb) => {
    const { key } = queryObject;
    let map = { 
      'file://': 'readFile',
      '//': 'readIzyLaunchString'
    };
    let reader, path, qo = {}, decoder = 'decodeTextHtml';
    for(let token in map) {
      if (key.indexOf(token) == 0) {
        reader = map[token];
        path = key.substr(token.length);
        break;
      }
    };
    if (!reader || !path) return cb({ reason: `cannot handle ${key}` });
    if (path.indexOf('&') > 0) {
      let qoStr = path.substr(path.indexOf('&') + 1);
      path = path.split('&')[0];
      if (qoStr.indexOf('=') > 0) {
        qoStr = qoStr.split('=');
        for(let i=0; i < qoStr.length-1; ++i) {
          qo[qoStr[i]] = qoStr[i+1];
        }
      }
    }
    modtask.doChain([
      ['//inline/?' + reader, { path, qo }],
      chain => chain(['//inline/?' + decoder, { payloadString: chain.get('outcome').data }])
    ]);
  }

  modtask.readIzyLaunchString = async queryObject => {
    const { path, qo } = queryObject;
    return await modtask.newChainAsync([
      ['//' + path, qo]
    ]);
  }

  modtask.readFile = async queryObject => {
    const { path, qo } = queryObject;
    const homeDir = require('os').homedir();
    const filePath = path.replace('~', homeDir);
    return { success: true, data: require('fs').readFileSync(filePath).toString() };
  }

  modtask.decodeTextHtml = async queryObject => {
    return { success: true, data: queryObject.payloadString };
  }

  return modtask;
})();