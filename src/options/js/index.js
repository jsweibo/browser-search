const importSettings = document.querySelector('#import-settings');
const settingsFileInput = document.querySelector('#settings-file');
const settingsURLInput = document.querySelector('#settings-url');

const configForm = document.querySelector('#config');
const bangPrefixInput = document.querySelector('#bangPrefix');
const rulesInput = document.querySelector('#rules');
const indexSelect = document.querySelector('#index');

const SETTINGS_PREFIX = 'browser-search.settings';
let downloadUrl = '';
let downloadItemId = -1;
let needSave = false;

function start() {
  chrome.storage.local.get('config', function (res) {
    if ('config' in res) {
      writeSettings(res.config);
    }
  });
}

function writeSelectOption(rules) {
  // strcat html
  let output = '';
  rules.forEach(function (item, index) {
    const target = new URL(item[1]);
    output += `<option value="${index}">${
      target.origin + target.pathname
    }</option>`;
  });
  indexSelect.innerHTML = output;
}

function writeSettings(settings) {
  bangPrefixInput.value = settings.bangPrefix;
  rulesInput.value = JSON.stringify(settings.rules, null, 2);
  writeSelectOption(settings.rules);
  indexSelect.value = settings.index;
}

function readFile(file) {
  const fileReader = new FileReader();
  fileReader.addEventListener('load', function () {
    if (this.readyState === FileReader.DONE) {
      try {
        writeSettings(JSON.parse(this.result));
        settingsFileInput.value = '';
        settingsURLInput.value = '';
        notify({
          type: 'success',
          message: 'Loaded',
        });
      } catch (error) {
        notify({
          type: 'error',
          message: error.message,
        });
      }
    }
  });
  fileReader.readAsText(file);
}

function readURL(url) {
  fetch(url)
    .then(function (response) {
      return response.json();
    })
    .then(function (settings) {
      writeSettings(settings);
      settingsFileInput.value = '';
      settingsURLInput.value = '';
      notify({
        type: 'success',
        message: 'Loaded',
      });
    })
    .catch(function (error) {
      notify({
        type: 'error',
        message: error.message,
      });
    });
}

function downloadSettings() {
  chrome.storage.local.get(null, function (res) {
    downloadUrl = URL.createObjectURL(
      new Blob([JSON.stringify(res.config, null, 2)], {
        type: 'application/json',
      })
    );
    chrome.downloads.download(
      {
        url: downloadUrl,
        filename: `${SETTINGS_PREFIX}.${new Date()
          .toJSON()
          .replaceAll(':', '-')}`,
        saveAs: true,
      },
      function (id) {
        downloadItemId = id;
      }
    );
  });
}

document
  .querySelector('#export-settings')
  .addEventListener('click', function () {
    downloadSettings();
  });

document
  .querySelector('#settings-url+button')
  .addEventListener('click', function () {
    settingsURLInput.value = '';
  });

importSettings.addEventListener('change', function () {
  needSave = true;
});

importSettings.addEventListener('submit', function (event) {
  event.preventDefault();
  if (settingsFileInput.value) {
    if (settingsFileInput.files[0].type === 'application/json') {
      readFile(settingsFileInput.files[0]);
    } else {
      notify({
        type: 'error',
        message: 'Choose a JSON File',
      });
    }
  } else if (settingsURLInput.value) {
    readURL(settingsURLInput.value);
  } else {
    notify({
      type: 'error',
      message: 'Nothing Selected',
    });
  }
});

document.addEventListener('dragover', function (event) {
  event.preventDefault();
});

document.addEventListener('drop', function (event) {
  event.preventDefault();
  if (event.dataTransfer.files.length < 1) {
    notify({
      type: 'error',
      message: 'Drop a File',
    });
  } else if (event.dataTransfer.files.length > 1) {
    notify({
      type: 'error',
      message: 'Only One File',
    });
  } else {
    if (event.dataTransfer.files[0].type === 'application/json') {
      readFile(event.dataTransfer.files[0]);
    } else {
      notify({
        type: 'error',
        message: 'Drop a JSON File',
      });
    }
  }
});

rulesInput.addEventListener('change', function () {
  try {
    // check rules
    const rules = JSON.parse(rulesInput.value);
    if (!Array.isArray(rules)) {
      notify({
        type: 'error',
        message: 'Invalid Rules',
      });
      return false;
    }
    writeSelectOption(rules);
    indexSelect.value = '';
  } catch (error) {
    writeSelectOption([]);
    indexSelect.value = '';
    notify({
      type: 'error',
      message: error.message,
    });
  }
});

document
  .querySelector('#reset-rules')
  .addEventListener('click', function (event) {
    event.preventDefault();
    needSave = true;
    writeSettings(DEFAULT_SETTINGS);
  });

configForm.addEventListener('change', function () {
  needSave = true;
});

configForm.addEventListener('submit', function (event) {
  event.preventDefault();

  let savedConfig = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  if (bangPrefixInput.value) {
    // check bangPrefix syntax
    if (bangPrefixInput.value.trim()) {
      savedConfig.bangPrefix = bangPrefixInput.value.trim();
    } else {
      notify({
        type: 'error',
        message: 'Invalid Bang Prefix',
      });
      return false;
    }
  }

  if (rulesInput.value) {
    // check rules syntax
    try {
      const rules = JSON.parse(rulesInput.value);
      if (!Array.isArray(rules)) {
        notify({
          type: 'error',
          message: 'Invalid Rules',
        });
        return false;
      }
      rulesInput.value = JSON.stringify(rules, null, 2);
    } catch (error) {
      notify({
        type: 'error',
        message: error.message,
      });
      return false;
    }
    // pass check
    savedConfig.rules = JSON.parse(rulesInput.value);
  }

  if (indexSelect.value) {
    // check index
    try {
      const index = Number.parseInt(indexSelect.value, 10);
      if (index < 0) {
        notify({
          type: 'error',
          message: 'Invalid Index',
        });
        return false;
      }
      if (index > savedConfig.rules.length - 1) {
        notify({
          type: 'error',
          message: 'Invalid Index',
        });
        return false;
      }
      indexSelect.value = index;
    } catch (error) {
      notify({
        type: 'error',
        message: error.message,
      });
      return false;
    }
    // pass check
    savedConfig.index = Number.parseInt(indexSelect.value, 10);
  }

  // save options
  chrome.storage.local.set(
    {
      config: savedConfig,
    },
    function () {
      notify({
        type: 'success',
        message: 'Saved',
      });
      needSave = false;
    }
  );
});

window.addEventListener('beforeunload', function (event) {
  if (needSave) {
    event.preventDefault();
    event.returnValue = '';
  }
});

chrome.downloads.onChanged.addListener(function (downloadDelta) {
  if (downloadDelta.id === downloadItemId) {
    if (downloadDelta.state) {
      if (
        downloadDelta.state.current === 'complete' ||
        downloadDelta.state.current === 'interrupted'
      ) {
        URL.revokeObjectURL(downloadUrl);
        downloadUrl = '';
        downloadItemId = -1;
      }
    }
  }
});

// start
start();
