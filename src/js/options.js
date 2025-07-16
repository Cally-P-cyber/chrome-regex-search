/*** CONSTANTS ***/
var DEFAULT_MAX_RESULTS = 500;
var DEFAULT_HIGHLIGHT_COLOR = '#ffff00';
var DEFAULT_SELECTED_COLOR = '#ff9900';
var DEFAULT_TEXT_COLOR = '#000000';
var DEFAULT_MAX_HISTORY_LENGTH = 30;
var WHITE_COLOR = '#ffffff';
var ERROR_COLOR = '#ff8989';
var GOOD_COLOR = '#89ff89';
var DEFAULT_INSTANT_RESULTS = true;
var DEFAULT_THEME = 'system';
/*** CONSTANTS ***/

/*** FUNCTIONS ***/
/* Mark status text */
function markStatus(text, time){
  var time = typeof time !== 'undefined' ? time : 1250;
  var status = document.getElementById('status');
  status.textContent = text;
  setTimeout(function() {
    status.textContent = '';
  }, time); 
}

/* Validate input for max results */
function validateMaxResults() {
  var inputVal = document.getElementById('maxResults').value;
  if (inputVal.match(/^\d+$/) && Number.isInteger(parseInt(inputVal))) {
    var num = parseInt(inputVal);
    if (num < Number.MAX_SAFE_INTEGER) {
      if (document.getElementById('maxResults') === document.activeElement) {
        document.getElementById('maxResults').style.backgroundColor = GOOD_COLOR;
        setTimeout(function() {
          document.getElementById('maxResults').style.backgroundColor = WHITE_COLOR;
        }, 1250);
      }
      return parseInt(inputVal);
    } else {
      markStatus(inputVal + " is too large.", 2000);
      document.getElementById('maxResults').style.backgroundColor = ERROR_COLOR;
    }
  } else {
    markStatus("'" + inputVal + "' is not an integer. Please try another value.", 2000);
    document.getElementById('maxResults').style.backgroundColor = ERROR_COLOR;
  }
  return false;
}

/* Save theme preference */
function saveThemePreference() {
  const themeSelect = document.getElementById('theme-select');
  const theme = themeSelect.value;
  chrome.storage.local.set({ theme: theme }, function() {
    // Update the theme in the popup as well
    chrome.runtime.sendMessage({ action: 'updateTheme', theme: theme });
    markStatus('Theme preference saved.', 1500);
  });
}

/* Apply theme to options page */
function applyTheme(theme) {
  const body = document.body;
  // Remove all theme classes
  body.classList.remove('light-theme', 'dark-theme');
  
  if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    body.classList.add('dark-theme');
  } else {
    body.classList.add('light-theme');
  }
}

/* Save options to storage */
async function saveOptions() {
  // Save theme preference
  saveThemePreference();
  
  const maxResults = validateMaxResults();
  if (maxResults) {
    const options = {
      highlightColor: document.getElementById('highlightColor').value,
      selectedColor: document.getElementById('selectedColor').value,
      textColor: document.getElementById('textColor').value,
      maxResults: maxResults,
      instantResults: document.getElementById('instantResults').checked,
      maxHistoryLength: document.getElementById('maxHistoryLength').value
    };
    await chrome.storage.local.set(options);
    markStatus('New settings saved');
  }
}

/* Load options from storage */
function loadOptions() {
  // Load theme preference
  chrome.storage.local.get({
    theme: DEFAULT_THEME,
    maxResults: DEFAULT_MAX_RESULTS,
    highlightColor: DEFAULT_HIGHLIGHT_COLOR,
    selectedColor: DEFAULT_SELECTED_COLOR,
    textColor: DEFAULT_TEXT_COLOR,
    maxHistoryLength: DEFAULT_MAX_HISTORY_LENGTH,
    instantResults: DEFAULT_INSTANT_RESULTS
  }, function(items) {
    // Set theme
    const themeSelect = document.getElementById('theme-select');
    themeSelect.value = items.theme || DEFAULT_THEME;
    applyTheme(items.theme);
    
    // Set other options
    document.getElementById('maxResults').value = items.maxResults;
    document.getElementById('highlightColor').value = items.highlightColor;
    document.getElementById('selectedColor').value = items.selectedColor;
    document.getElementById('textColor').value = items.textColor;
    document.getElementById('maxHistoryLength').value = items.maxHistoryLength;
    document.getElementById('instantResults').checked = items.instantResults;
    
    document.getElementById('exampleHighlighted').style.backgroundColor = items.highlightColor;
    document.getElementById('exampleSelected').style.backgroundColor = items.selectedColor;
    document.getElementById('exampleHighlighted').style.color = items.textColor;
    document.getElementById('exampleSelected').style.color = items.textColor;
  });
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    chrome.storage.local.get(['theme'], function(result) {
      if (result.theme === 'system') {
        applyTheme('system');
      }
    });
  });
}

/* Restore default configuration */
function restoreDefaults() {
  chrome.storage.local.clear(function() {
    markStatus('Defaults restored');
  });
  loadOptions();
}
/*** FUNCTIONS ***/

/*** LISTENERS ***/
document.addEventListener('DOMContentLoaded', function() {
  // Add theme change listener
  document.getElementById('theme-select').addEventListener('change', saveThemePreference);
  
  loadOptions();

  document.getElementById('highlightColor').addEventListener('change', function() {
    document.getElementById('exampleHighlighted').style.backgroundColor = document.getElementById('highlightColor').value;
    saveOptions();
  });
  
  document.getElementById('selectedColor').addEventListener('change', function() {
    document.getElementById('exampleSelected').style.backgroundColor = document.getElementById('selectedColor').value;
    saveOptions();
  });
  
  document.getElementById('textColor').addEventListener('change', function() {
    document.getElementById('exampleHighlighted').style.color = document.getElementById('textColor').value;
    document.getElementById('exampleSelected').style.color = document.getElementById('textColor').value;
    saveOptions();
  });
  
  document.getElementById('maxResults').addEventListener('change', function() {
    saveOptions();
  });

  document.getElementById('instantResults').addEventListener('change', function() {
    saveOptions();
  });

  document.getElementById('maxHistoryLength').addEventListener('change', function() {
    saveOptions();
  });
  
  document.getElementById('buttonSave').addEventListener('click', function() {
    saveOptions();
  });
  
  document.getElementById('buttonReset').addEventListener('click', function() {
    restoreDefaults();
  });
});
/*** LISTENERS ***/
