/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  modtask.check = async queryObject => {
    const run = require('izy-proxy/asyncio')(modtask).run;
    var cfg = queryObject;
    const { izyUser } = queryObject;

    cfg.buildId = (await run('//inline/aws.chain?runAWSCommand', {
      cmd: 'aws codebuild list-builds-for-project --sort-order DESCENDING --max-items 1 --project-name ' + cfg.projectName,
      izyUser
    })).data.ids[0];

    const { builds } = (await run('//inline/aws.chain?runAWSCommand', {
      cmd: 'aws codebuild batch-get-builds --ids ' + cfg.buildId,
      izyUser
    })).data;

    if (!builds.length) return { reason: 'no builds were found' };
    const build = builds[0];
    cfg.sourceVersion = build.sourceVersion;
    cfg.buildStatus = build.buildStatus;
    cfg.startTime = build.startTime;
    cfg.endTime = build.endTime;
    cfg.logs = build.logs;
    if (cfg.showLogs) {
      const params = [];
      params.push('--log-group-name ' + cfg.logs.groupName);
      params.push('--log-stream-name ' + cfg.logs.streamName);
      const { events } = (await run('//inline/aws.chain?runAWSCommand', {
        cmd: 'aws logs get-log-events ' + params.join(' '),
        izyUser
      })).data;
      // Also
      // nextForwardToken
      // nextBackwardToken
      cfg.logs = [];
      for(var i=0 ; i < events.length; ++i) {
        console.log(events[i].message);
        // cfg.logs.push(events[i].message); // timestamp, ingestionTime
      }
    }
    return { success: true, data: cfg };
  }

  return modtask;
})();