let config = null;

const qInput = document.querySelector('#q');

function start() {
  chrome.storage.local.get('config', function (res) {
    if ('config' in res) {
      // sync
      config = res.config;

      if (location.search && URLSearchParams) {
        // parse url search string
        const q = new URLSearchParams(location.search).get('q');
        if (q) {
          try {
            handle(q.trim());
          } catch (error) {
            notify({
              type: 'error',
              message: error.message,
            });
          }
        }
      } else {
        // if not mobile, auto focus on input
        if (!/mobile/i.test(navigator.userAgent)) {
          qInput.focus();
        }
      }
    } else {
      notify({
        type: 'error',
        message: 'Config is Required',
      });
    }
  });
}

function handle(userInput) {
  // find a bangSuffix
  let pieces = userInput.split(/\s+/);
  let bangSuffix = '';
  let piecesIndex = -1;
  const bangPrefixPattern = new RegExp(
    `${config.RESERVED_BANG_PREFIX}|${config.bangPrefix}`
  );
  pieces.findIndex(function (item, index) {
    const result = bangPrefixPattern.exec(item);
    if (result && result.index === 0) {
      bangSuffix = item.substr(result[0].length).toLowerCase();
      piecesIndex = index;
      return true;
    }
  });

  // affirm that the bangSuffix is valid
  let rulesIndex = -1;
  let keywords = '';
  config.rules.findIndex(function (item, index) {
    if (item[0] === bangSuffix) {
      // the bangSuffix is valid
      rulesIndex = index;
      pieces.splice(piecesIndex, 1);
      keywords = pieces.join(' ');
      return true;
    }
  });

  // the bangSuffix is invalid
  if (rulesIndex < 0) {
    rulesIndex = config.index;
    keywords = userInput;
  }

  // notify
  notify({
    type: 'success',
    message: 'Redirecting',
  });

  // ready
  const activeRule = config.rules[rulesIndex];
  let activeRuleOptions = activeRule[activeRule.length - 1];
  if (typeof activeRuleOptions !== 'object') {
    activeRuleOptions = config.DEFAULT_ACTIVE_RULE_OPTIONS;
  }

  let newLink = activeRule[1];
  if ('search' in activeRuleOptions && !activeRuleOptions.search) {
    newLink += keywords;
  } else {
    newLink += encodeURIComponent(keywords);
  }

  // go
  location.replace(newLink);
}

document.querySelector('#q+button').addEventListener('click', function () {
  qInput.value = '';
});

document.querySelector('#open-options').addEventListener('click', function () {
  chrome.runtime.openOptionsPage();
});

document.querySelector('form').addEventListener('submit', function (event) {
  event.preventDefault();

  if (config) {
    try {
      handle(qInput.value.trim());
    } catch (error) {
      notify({
        type: 'error',
        message: error.message,
      });
    }
  } else {
    notify({
      type: 'error',
      message: 'Config is Required',
    });
  }
});

chrome.storage.onChanged.addListener(function (changes) {
  if (changes.config) {
    // sync
    if ('newValue' in changes.config) {
      config = changes.config.newValue;
    } else {
      config = null;
    }
  }
});

// start
start();
