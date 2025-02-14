/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  const { execSync } = require('child_process');
  const fs = require('fs');
  const encoding = 'utf8';

  modtask['filter-log-events'] = async queryObject => {
      let i = 4;
      const configPath = process.argv[i++];
      const evalExpression = expression => execSync(`source ${configPath};${expression}`).toString().trim();
      const sessionToken = `${(new Date()).getTime()}${Math.random().toString(30).split('.')[1]}`;
      const JSON_STORE_PATH = evalExpression('echo $JSON_STORE_PATH');
      const clwRawStorePath=`${JSON_STORE_PATH}/${sessionToken}`;
      execSync(`mkdir -p ${clwRawStorePath}`);
      const cursorFile=`${clwRawStorePath}/cursor.txt`;
      const fileExt = 'clw-response.json';
      let nextToken;
      const COMMON_PARAMS=evalExpression('echo logs filter-log-events  --output json --limit $LIMIT --log-group-name $AWS_LOG_GROUP --log-stream-names $AWS_LOG_STREAM  $AWS_CLI_PARAMS');
      const FILTER_PARAM = evalExpression('echo $FILTER_PARAM');
      console.log(`[start] ${clwRawStorePath}`);
      while(true) {
          nextToken=null;
          if (fs.existsSync(cursorFile)) {
              nextToken = fromAWSQueryResult({ clwRawStorePath, fileExt }).data.nextToken;
          }
          if (!nextToken && fs.existsSync(cursorFile)) {
              console.log('Done');
              break;
          }
          let cmd = `aws ${COMMON_PARAMS} ${FILTER_PARAM} `;
          if (nextToken) cmd += `--next-token ${nextToken}`;
          cmd += ` > ${cursorFile}`;
          execSync(`${cmd}`); 
          fromJSONCache({ clwRawStorePath, fileExt });
      }
  }

  function fromJSONCache({ clwRawStorePath, fileExt, finalOutputTheme }) {
      clwRawStorePath = clwRawStorePath.replace('~', process.env.HOME);
      let files = [];
      if (fs.statSync(clwRawStorePath).isDirectory()) {
          files = fs.readdirSync(clwRawStorePath).filter(f => f.endsWith('.' + fileExt)).map(f => `${clwRawStorePath}/${f}`);
      } else {
          files = [clwRawStorePath];
      }
      let allEvents = [];
      files.forEach(file => {
          const rawSource = fs.readFileSync(file).toString();
          const content = JSON.parse(rawSource);
          allEvents = [...allEvents, ...content.events];
      });
      const formatDate = dt => dt.toISOString().replace('T', ' ').split('.')[0];
      allEvents.sort((a, b) => a.timestamp > b.timestamp);    
      allEvents.forEach(event => {
          const { timestamp, message } = event;
          event.tsPretty = formatDate(new Date(timestamp));
      });
      switch(finalOutputTheme) {
          case 'full':
              allEvents.forEach(event => console.log(event.message, '\n'));
              break;
          default:
              let msg = 'empty';
              if (allEvents.length > 1) msg = `${allEvents.length} ${allEvents[0].tsPretty}, ${allEvents[allEvents.length-1].tsPretty}`;
              console.log(formatDate(new Date()), msg);
              break;
      }
  }    

  function fromAWSQueryResult({ clwRawStorePath, fileExt }) {   
      clwRawStorePath = clwRawStorePath.replace('~', process.env.HOME);
      const responseFilePath = `${clwRawStorePath}/cursor.txt`;
      const tokenAnchor = 'nextToken:';
      let jsonStr = fs.readFileSync(responseFilePath).toString(encoding);
      if (jsonStr.indexOf(tokenAnchor) == 0 || jsonStr.length < tokenAnchor.length) {
          console.log('nothing needed for ', responseFilePath);
          return;
      }
      let json = JSON.parse(jsonStr);
      const rnd = Date.now();
      if (json.events.length) {
          const clwQueryResponsePath = `${clwRawStorePath}/${json.events[0].logStreamName}-${rnd}.${fileExt}`;
          fs.writeFileSync(clwQueryResponsePath, jsonStr);
      }
      return { success: true, data: { nextToken: json.nextToken } };
  }

  return modtask;
})();
