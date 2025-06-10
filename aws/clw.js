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
        const JSON_STORE_PATH = evalExpression('echo $AWS_LOG_JSON_STORE_PATH');
        const themePath = evalExpression('echo $AWS_LOG_THEME');
        const clwRawStorePath=`${JSON_STORE_PATH}/${sessionToken}`;
        execSync(`mkdir -p ${clwRawStorePath}`);
        const cursorFile=`${clwRawStorePath}/cursor.txt`;
        const fileExt = 'clw-response.json';
        let nextToken;
        const COMMON_PARAMS=evalExpression('echo logs filter-log-events  --output json --limit $AWS_LOG_LIMIT --log-group-name $AWS_LOG_GROUP $AWS_OPTIONS_CLI');
        const FILTER_PARAM = evalExpression('echo $AWS_LOG_FILTER_PARAM');
        console.log(`[start] ${clwRawStorePath}`);
        while(true) {
            nextToken=null;
            if (fs.existsSync(cursorFile)) {
                nextToken = fromAWSQueryResult({ clwRawStorePath, fileExt }).data.nextToken;
            }
            if (!nextToken && fs.existsSync(cursorFile)) {
                break;
            }
            let cmd = `aws ${COMMON_PARAMS} ${FILTER_PARAM} `;
            if (nextToken) cmd += `--next-token ${nextToken}`;
            cmd += ` > ${cursorFile}`;
            execSync(`${cmd}`); 
            modtask.fromJSONCache({ clwRawStorePath, fileExt });
        }
        if (themePath) {
          modtask.fromJSONCache({ clwRawStorePath, finalOutputTheme: themePath });
        }
        console.log('Done');
    }
  
    modtask.fromJSONCache = function({ clwRawStorePath, fileExt, finalOutputTheme }) {
        if (!fileExt) fileExt = 'json';
        if (!finalOutputTheme) finalOutputTheme = 'storeStats';
  
        clwRawStorePath = clwRawStorePath.replace('~', process.env.HOME);
        finalOutputTheme = finalOutputTheme.replace('~', process.env.HOME);
  
        if (fs.existsSync(finalOutputTheme)) {
          finalOutputTheme = require(finalOutputTheme);
        }
  
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
        if (typeof(finalOutputTheme) === 'function') {
          finalOutputTheme({ allEvents });
        } else {
          switch(finalOutputTheme) {
              case 'full':
                  allEvents.forEach(event => console.log(event.message, '\n'));
                  break;
              case 'storeStats':
              default:
                  let msg = 'empty';
                  if (allEvents.length > 1) msg = `events: ${allEvents.length}, range: ${allEvents[0].tsPretty}, ${allEvents[allEvents.length-1].tsPretty}`;
                  console.log(`[${formatDate(new Date())}] filtering: ${msg}`);
                  break;
          }
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
            const clwQueryResponsePath = `${clwRawStorePath}/${rnd}.${fileExt}`;
            fs.writeFileSync(clwQueryResponsePath, jsonStr);
        }
        return { success: true, data: { nextToken: json.nextToken } };
    }
  
    return modtask;
  })();
  