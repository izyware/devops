/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
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
    if (!method) method = 'GET';
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
    if ([200, 201].indexOf(outcome.status) === -1) {
      throw { reason: outcome.responseText };
    }
    let { data, links } = outcome.response;
    if(links && links.next) {
      const nextData = await modtask.apiCall(links.next.split(prefix)[1], body, method);
      data = data.concat(nextData);
    }
    return data;
  }

  modtask.cp = async queryObject => {
    let { workspaceFullname, srcWorkspaceId, destWorkspaceId } = queryObject;

    let org_name = null;
    let srcWorkspace = null;
    if (workspaceFullname) {
      org_name = workspaceFullname.split('/')[0];
      srcWorkspaceName = workspaceFullname.split('/')[1];
      let matches = await modtask.apiCall(`/organizations/${org_name}/workspaces?page%5Bsize%5D=${pageSize}&search%5Bwildcard-name%5D=${srcWorkspaceName}`);
      if (matches.length != 1) {
        throw { reason: `Workspace ${srcWorkspaceName} not found in organization ${org_name} or it is not unique` };
      }
      srcWorkspace = matches[0];
      srcWorkspaceId = srcWorkspace.id;
    } else {
      srcWorkspace = await modtask.apiCall(`/workspaces/${srcWorkspaceId}`);
      org_name = srcWorkspace.relationships.organization.data.id;
    }
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

  return modtask;
})();
