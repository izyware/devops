/* izy-loadobject nodejs-require */
module.exports = (function() {
  const modtask = () => {};
  const fs = require('fs');
  const encoding = 'utf8';

  modtask.loadTerraformApiConfig = () => {
    const credentials = JSON.parse(fs.readFileSync(`${process.env.HOME}/.terraform.d/credentials.tfrc.json`, encoding)).credentials;
    const domain = Object.keys(credentials)[0];
    const token = credentials[domain].token;
    return { domain, token };
  }

  modtask.apiCall = async (path, body, method) => {
    const { domain, token } = modtask.loadTerraformApiConfig();
    if (!method) method = 'GET';
    let outcome = await modtask.newChainAsync([
      ['net.httprequest', {
        method,
        url: `https://${domain}/api/v2${path}`,
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
    return outcome.response.data;
  }

  modtask.cp = async queryObject => {
    const { srcWorkspaceId, destWorkspaceId } = queryObject;
    let srcWorkspace = await modtask.apiCall(`/workspaces/${srcWorkspaceId}`);
    const org_name = srcWorkspace.relationships.organization.data.id;
    srcWorkspace.sshKeys = (await modtask.apiCall(`/organizations/${org_name}/workspaces`)).map(v => {
      if (!v.relationships['ssh-key']) return null;
      if (v.id !== srcWorkspaceId) return null;
      return v.relationships['ssh-key'].data;
    }).filter(t => t !== null);
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

    newWorkspace.sshKeys = [];
    for(let i = 0; i < srcWorkspace.sshKeys.length; i++) newWorkspace.sshKeys.push(await modtask.apiCall(
      `/workspaces/${newWorkspace.id}/relationships/ssh-key`, {
      data: srcWorkspace.sshKeys[i]
    }, 'PATCH'));

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

    return { success: true, data: newWorkspace };
  }

  return modtask;
})();
