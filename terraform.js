/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};

  modtask.update = async queryObject => {
    let { key, value } = queryObject;
    const split = key.split('/');
    workspaceFullname = key.substr(0, key.length - split[split.length - 1].length - 1);
    key = split[split.length - 1];
    let workspace = await modtask.getWorkspace(workspaceFullname);
    let varObjects = (await modtask.apiCall(`/workspaces/${workspace.id}/vars`)).filter(v => v.attributes.key === key);
    if (varObjects.length === 0) {
      throw { reason: `Variable ${key} not found in workspace ${workspaceFullname}` };
    }
    let varObject = varObjects[0];
    if (!value) {
      return { success: true, data: varObject };
    } else {
      varObject.attributes.value = value;
    }
    delete varObject.links;
    ['relationships', 'links'].forEach(attr => delete varObject[attr]);
    ['created-at', 'version-id'].forEach(attr => delete varObject.attributes[attr]);
    varObject = { data: varObject };
    let result = await modtask.apiCall(`/vars/${varObject.data.id}`, varObject, 'PATCH');
    return { success: true, data: result }; 
  }

  modtask.run = async queryObject => {
    let { workspaceFullname, message, runId, apply } = queryObject;
    if (!message) message = '';
    let currentRun = null;
    if (runId) {
      currentRun = { id: runId };
    } else {
      let workspace = await modtask.getWorkspace(workspaceFullname);
      currentRun = await modtask.apiCall(`/runs`, {
        "data": {
          "attributes": {
            "message": message,
            "is-destroy": false
          },
          "type": "runs",
          "relationships": {
            "workspace": {
              "data": {
                "id": workspace.id,
                "type": "workspaces"
              }
            }
          }
        }
      });
    }
    do {
      currentRun = await modtask.apiCall(`/runs/${currentRun.id}`);
      const { status } = currentRun.attributes;
      console.log(`Run ${currentRun.id} status: ${status}`);
      if (status == 'planned' && apply) {
        const applyStatus = await modtask.apiCall(`/runs/${currentRun.id}/actions/apply`, { comment: '' }, 'POST');
        console.log('requested apply', applyStatus);
        apply = false;
      }
    } while(['planned_and_finished', 'applied', 'errored', 'discarded'].indexOf(currentRun.attributes.status) === -1);
    return { success: true, data: 'done' };
  }

  modtask.cp = async queryObject => {
    let { workspaceFullname, srcWorkspaceId, destWorkspaceId } = queryObject;

    let org_name = null;
    let srcWorkspace = null;
    if (workspaceFullname) {
      srcWorkspace = await modtask.getWorkspace(workspaceFullname);
    } else {
      srcWorkspace = await modtask.apiCall(`/workspaces/${srcWorkspaceId}`);
    }
    srcWorkspaceId = srcWorkspace.id;
    org_name = srcWorkspace.relationships.organization.data.id;
    srcWorkspace.vars = (await modtask.apiCall(`/workspaces/${srcWorkspaceId}/vars`)).map(v => {
      return {
        type: 'vars',
        attributes: v.attributes
      }
    });
    srcWorkspace.teams = (await modtask.apiCall(`/team-workspaces`)).map(t => {
      if (t.relationships.workspace.data.id !== srcWorkspaceId) return null;;
      delete t.relationships.team.links;
      return {
        type: 'team-workspaces',
        attributes: {
          access: t.attributes.access
        },
        relationships: {
          team: {
            data: t.relationships.team.data
          },
          workspace: {
            data: {
              id: 'replace-with-destWorkspaceId',
              type: 'workspaces'
            }
          }
        }
      }
    }).filter(t => t !== null);
    let newWorkspace = {};
    if (!destWorkspaceId) {
      const disallowedAttributes = [
        'operations'
      ];
      newWorkspace = {
        type: 'workspaces',
        attributes: srcWorkspace.attributes
      };
      disallowedAttributes.forEach(attr => delete newWorkspace.attributes[attr]);
      newWorkspace.attributes.name = `${srcWorkspace.attributes.name}-copy`;
      let newResult = await modtask.apiCall(`/organizations/${org_name}/workspaces`, {
        data: newWorkspace
      }, 'POST');
      newWorkspace = newResult;
    } else {
      newWorkspace = { id: destWorkspaceId };
    }

    newWorkspace.teams = [];
    for(let i = 0; i < srcWorkspace.teams.length; i++) {
      srcWorkspace.teams[i].relationships.workspace.data.id = newWorkspace.id;
      newWorkspace.teams.push(await modtask.apiCall(`/team-workspaces`, {
        data: srcWorkspace.teams[i]
      }, 'POST'));
    }

    newWorkspace.vars = [];
    for(let i = 0; i < srcWorkspace.vars.length; i++) newWorkspace.vars.push(await modtask.apiCall(`/workspaces/${newWorkspace.id}/vars`, {
      data: srcWorkspace.vars[i]
    }, 'POST'));

    newWorkspace.sshKeys = [];
    if (srcWorkspace.relationships['ssh-key']) newWorkspace.sshKeys.push(await modtask.apiCall(
      `/workspaces/${newWorkspace.id}/relationships/ssh-key`, {
      data: srcWorkspace.relationships['ssh-key'].data
    }, 'PATCH'));

    return { success: true, data: newWorkspace };
  }

  const fs = require('fs');
  const encoding = 'utf8';
  const pageSize = 100;

  modtask.loadTerraformApiConfig = () => {
    const credentials = JSON.parse(fs.readFileSync(`${process.env.HOME}/.terraform.d/credentials.tfrc.json`, encoding)).credentials;
    const domain = Object.keys(credentials)[0];
    const token = credentials[domain].token;
    return { domain, token };
  }

  modtask.apiCall = async (path, body, method) => {
    const { domain, token } = modtask.loadTerraformApiConfig();
    if (!method) method = body ? 'POST' : 'GET';
    const prefix = `https://${domain}/api/v2`;
    let outcome = await modtask.newChainAsync([
      ['net.httprequest', {
        method,
        url: `${prefix}${path}`,
        responseType: 'json',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.api+json'
        },
        body: typeof(body) === 'object' ? JSON.stringify(body) : body
      }]
    ]);
    if ([200, 201, 202].indexOf(outcome.status) === -1) {
      throw { reason: outcome.responseText };
    }
    let { data, links } = outcome.response;
    if(links && links.next) {
      const nextData = await modtask.apiCall(links.next.split(prefix)[1], body, method);
      data = data.concat(nextData);
    }
    return data;
  }

  modtask.getWorkspace = async (workspaceFullname) => {
    let org_name = workspaceFullname.split('/')[0];
    let workspaceName = workspaceFullname.split('/')[1];
    let matches = await modtask.apiCall(`/organizations/${org_name}/workspaces?page%5Bsize%5D=${pageSize}&search%5Bwildcard-name%5D=${workspaceName}`);
    if (matches.length != 1) {
      throw { reason: `Workspace ${workspaceName} not found in organization ${org_name} or it is not unique` };
    }
    return matches[0];
  }

  return modtask;
})();
