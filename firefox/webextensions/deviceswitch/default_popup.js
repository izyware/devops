function updateTabUI() {
  browser.cookies.getAll({}).then((cookies) => {
    //set the header of the panel
    let headerElement = document.getElementById('header-title');
    headerElement.innerHTML = '';
    let text = document.createTextNode('Total Cookies ' + cookies.length);
    headerElement.appendChild(text);

    let cookieList = document.getElementById('cookie-list');
    cookieList.innerHTML = '';

    if (cookies.length > 0) {
      //add an <li> item with the name and value of the cookie to the list
      for (let cookie of cookies) {
        let li = document.createElement("li");
        let content = document.createTextNode(cookie.name + ": "+ cookie.value);
        li.appendChild(content);
        cookieList.appendChild(li);
      }
    } else {
      let p = document.createElement("p");
      let content = document.createTextNode("No cookies in this tab.");
      let parent = cookieList.parentNode;

      p.appendChild(content);
      parent.appendChild(p);
    }
  });
}

updateTabUI();

const datastreamMonitor = {
  log: function(obj) {
    if (typeof(obj) == 'object' && obj.msg) {
      console.log(obj.msg);
    } else {
      console.log(obj);
    }
  }
}

async function importData(jsonStr) {
  datastreamMonitor.log({ msg: { action: 'importData', jsonStr }});
  try {
    switchBrowserContext({
      raw_tokendataid: jsonStr,
      bucketId: -1
    });
  } catch(e) {
    datastreamMonitor.log({ msg: { errorObject: e }});
  }
  updateTabUI();
}

async function switchBrowserContext({ raw_tokendataid, bucketId }) {
  var cookiesArrayJSONStr = '';
  var browserContext = {};
  var browserContextStr = raw_tokendataid.replace(/^\s/g, '').replace(/\s+$/g, '').replace(/\r|\n/g, '');
  if (browserContextStr.indexOf('[') == 0 || true) { // Legacy
      cookiesArrayJSONStr = browserContextStr;
  } else {
      browserContext = JSON.parse(browserContextStr);
      cookiesArrayJSONStr = JSON.stringify(browserContext.cookies);
  }
  await closeTabs();
  await clearCookies();
  await importCookies({ cookiesArrayJSONStr });
}

async function importCookies(queryObject) {
  datastreamMonitor.log({ msg: { action: 'importCookies' }});
  if (typeof(queryObject.cookiesArrayJSONStr) != 'string') throw {
      reason: 'queryObject.cookiesArrayJSONStr must be a string'
  };
  var cookielist = [];
  try {
      cookielist = JSON.parse(queryObject.cookiesArrayJSONStr);
  } catch (e) {
      throw {
          reason: e.message
      };
  }
  datastreamMonitor.log({ msg: { action: 'importCookies', length: cookielist.length }});
  var i;
  for (i = 0; i < cookielist.length; ++i) {
      cookie = cookielist[i];
      if (cookie.domain == '' || cookie.domain == 'izyware.com' || cookie.domain == '.izyware.com') {
          console.log('Skipping', cookie);
          continue;
      }

      var p = {};
      var domain = cookie.domain;
      // as of chrome 77.0.3865.90: we dont need .domain.com in the URL. the domain however, will be used to determine hostonly. see below
      if (domain.indexOf('.') == 0) {
          domain = domain.substr(1);
      }

      p = {
          // This is mandatory
          'url': 'http' + (cookie.secure ? 's' : '') + '://' + domain + cookie.path,
          'name': cookie.name,
          'value': cookie.value,
          'secure': cookie.secure,
          'httpOnly': cookie.httpOnly,
          // ommited for FireFox          
          // 'sameSite': cookie.sameSite,
          'expirationDate': cookie.expirationDate,
          // ommited for FireFox
          // 'storeId': cookie.storeId
      };

      if (!cookie.hostOnly) {
          // The domain of the cookie. If omitted, the cookie becomes a host-only cookie.
          // See https://developer.chrome.com/extensions/cookies#method-set
          p['domain'] = cookie.domain;
      }
      p['path'] = cookie.path;

      console.log('setting', p);
      await browser.cookies.set(p);
  }
  let cks = await browser.cookies.getAll({});

  datastreamMonitor.log({ msg: { action: 'importCookies', length: cks.length }});
}

async function clearCookies() {
  datastreamMonitor.log({ msg: { action: 'clearCookies' }});
  let cks = await browser.cookies.getAll({});
  datastreamMonitor.log({ msg: { action: 'clearCookies', total: cks.length }});
  for (i = 0; i < cks.length; ++i) {
    if (cks[i].domain == 'izyware.com') continue;
    await browser.cookies.remove({
      url: 'http' + (cks[i].secure ? 's' : '') + '://' + cks[i].domain + cks[i].path,
      name: cks[i].name
    });
  }
}

async function closeTabs() {
  datastreamMonitor.log({ msg: { action: 'closeTabs' }});
  let tabs = await browser.tabs.query({});
  for (var i = 0; i < tabs.length; ++i) {
    var tab = tabs[i];
    if (tab.url.indexOf('https://izyware.com') == 0) continue;
    if (tab.url.indexOf('about:') == 0) continue;
    datastreamMonitor.log({ msg: { 
      action: 'closeTab',
      url: tab.url,
      id: tab.id
    }});
    await browser.tabs.remove(tab.id);
  }
}

async function onclick(action) {
  datastreamMonitor.log({ msg: { action }});
  importData(document.querySelector('#statedata').value);
}

document.querySelector('#action1').addEventListener('click', () => onclick('import'))