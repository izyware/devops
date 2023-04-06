var modtask = function() {};
modtask.exec = (queryObject, cb) => {
  let { cmd, dontWaitForCompletion, format, allowNonZeroExitCode, verbose, asUser, callBackId } = queryObject;
  if (!format) format = 'string';
  var exec = require('child_process').exec;
  if (verbose) console.log('[shell?exec] ' + cmd);
  if (asUser) {
    var cmdShell = '/tmp/vatar-cmd.sh';
    require('fs').writeFileSync(cmdShell, cmd);
    require('fs').chmodSync(cmdShell, 0o777);
    cmd = 'uid=$(id -u "' + asUser + '");sudo launchctl asuser $uid ' + cmdShell;
  }
  const child = exec(cmd, { maxBuffer: 1024 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (dontWaitForCompletion) {
        if (callBackId) {
          cb = global.__callbacks[callBackId];
        } else {
          cb = function() {}
        }
      }
      var outcome = { exitCode: 0 };
      if (error) {
        outcome = { signal: error.signal, exitCode: error.code };
        var data = String(stdout) + String(stderr);
        if (allowNonZeroExitCode) {
          outcome.success = true;
          outcome.data = data;
        } else {
          outcome.reason = 'failing with non zero exit code ' + outcome.exitCode + '. ' + data;
        }
      } else {
        if (stderr) {
          if (verbose) console.log(String(stderr));
          return cb({ reason: String(stderr) });
        }
        try {
          var data = String(stdout);
          switch(format) {
            case 'json':
              data = JSON.parse(data);
              break;
          }
          outcome.data = data;
          outcome.success = true;
        } catch(e) {
          outcome.success = false;
          outcome.reason = String(e);
        }
      }
      if (verbose) {
        if (!outcome.success)
          console.log(outcome.reason);
        else
          console.log(outcome.data);
      }
      return cb(outcome);
  });

  if (dontWaitForCompletion) {
    return cb({
      success: true,
      data: {
        pid: child.pid
      }
    });
  }
}

modtask.spawn = (queryObject, cb) => {
  let { cmd, args, verbose } = queryObject;

  if (!args) args = [];
  var spawn = require('child_process').spawn;
  var subprocess = spawn(cmd, args, { detached: true, shell: false, stdio: 'ignore' });

  if (verbose) console.log('[spawn] ', cmd, args);

  function success() {
    subprocess.unref();
    return cb({ success: true });
  }
  
  if (false) {
    /* only works with node >= 15 */
    subprocess.on('spawn', () => {
      success();
    });
  } else {
    if(subprocess.pid) {
      return success();
    }  
  }

  subprocess.on('error', (err) => {
    cb({ exitCode: err.errno, reason: err.errno + ': ' + String(err) });
  });
}

modtask.kill = function(queryObject, cb) {
  var verbose = queryObject.verbose || {};
  var grepStr = queryObject.grepStr;
  var sudopassword = queryObject.sudopassword;
  if (!grepStr) return cb({ reason: 'grepStr must be specified' });
  const grepPipeCmd = 'grep "' + grepStr + '"';
  cmd = 'ps aux | ' + grepPipeCmd;
  modtask.doChain([
    ['continue'],
    function(chain) {
      chain(['//inline/?exec', {
        asUser: queryObject.asUser,
        cmd: cmd,
        verbose: verbose.shell
      }]);
    },
    function(chain) {
      data = chain.get('outcome').data;
      if (data.indexOf('\n') == -1) return cb({ success: true });
      var kills = [];
      data.split('\n').forEach(line => {
        if (line.indexOf(grepPipeCmd) > 0 || line.indexOf(' grep ') > 0) return;
        line = line.replace(/\s+/g, ' ');
        var pid = line.split(' ')[1];
        if (pid) {
          var killCmd = 'kill -9 ' + pid;
          if (sudopassword) killCmd = `echo ${sudopassword} | sudo -S ${killCmd}`;
          kills.push(killCmd);
        }
      });
      if (!kills.length) return chain(['outcome', { success: true }]);
      cmd = kills.join(';');
      chain(['//inline/?exec', {
        asUser: queryObject.asUser,
        allowNonZeroExitCode: true,
        cmd: cmd,
        verbose: verbose.shell
      }]);
    }
  ])
}

