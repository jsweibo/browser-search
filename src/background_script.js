function start() {
  chrome.storage.local.get('config', function (res) {
    if ('config' in res) {
      // remove old context menus
      chrome.contextMenus.removeAll(function () {
        initContextMenus(res.config);
      });
    } else {
      // writing settings will invoke chrome.storage.onChanged
      chrome.storage.local.set({
        config: DEFAULT_SETTINGS,
      });
    }
  });
}

function initContextMenus(settings) {
  settings.rules.forEach(function (item) {
    let ruleOptions = item[item.length - 1];
    if (typeof ruleOptions !== 'object') {
      ruleOptions = settings.DEFAULT_ACTIVE_RULE_OPTIONS;
    }

    if ('contextMenu' in ruleOptions && ruleOptions.contextMenu) {
      chrome.contextMenus.create({
        id: `${settings.RESERVED_BANG_PREFIX}${item[0]}`,
        title: `${item[0]} for "%s"`,
        contexts: ['selection'],
      });
    }
  });
}

chrome.webRequest.onBeforeRequest.addListener(
  function (requestDetails) {
    const target = new URL(requestDetails.url);
    let redirectUrl = chrome.runtime.getURL(
      'search/index.html' + target.search
    );

    // for Edg
    chrome.tabs.update(requestDetails.tabId, {
      url: redirectUrl,
    });

    // for Chromium
    return {
      redirectUrl,
    };
  },
  { urls: ['https://jsweibo.github.io/search/*'] },
  ['blocking']
);

chrome.browserAction.onClicked.addListener(function () {
  chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener(function (info) {
  let targetUrl =
    'search/index.html?q=' +
    encodeURIComponent(`${info.menuItemId} ${info.selectionText}`);

  // go
  chrome.tabs.create({
    url: targetUrl,
  });
});

chrome.storage.onChanged.addListener(function () {
  // restart
  start();
});

// start
start();
