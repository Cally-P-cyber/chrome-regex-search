/*** CONSTANTS ***/
var DEFAULT_INSTANT_RESULTS = true;
var ERROR_COLOR = '#ff8989';
var WHITE_COLOR = '#ffffff';
var ERROR_TEXT = "Content script was not loaded. Are you currently in the Chrome Web Store or in a chrome:// page? If you are, content scripts won't work here. If not, please wait for the page to finish loading or refresh the page.";
var SHOW_HISTORY_TITLE = "Show search history";
var HIDE_HISTORY_TITLE = "Hide search history";
var ENABLE_CASE_INSENSITIVE_TITLE = "Enable case insensitive search";
var DISABLE_CASE_INSENSITIVE_TITLE = "Disable case insensitive search";
var HISTORY_IS_EMPTY_TEXT = "Search history is empty.";
var CLEAR_ALL_HISTORY_TEXT = "Clear History";
var DEFAULT_CASE_INSENSITIVE = false;
var MAX_HISTORY_LENGTH = 30;
var DEFAULT_THEME = 'system';
/*** CONSTANTS ***/

/*** VARIABLES ***/
var sentInput = false;
var processingKey = false;
var searchHistory = null;
var maxHistoryLength = MAX_HISTORY_LENGTH;
/*** VARIABLES ***/

/*** FUNCTIONS ***/
/* Validate that a given pattern string is a valid regex */
function isValidRegex(pattern) {
  try{
    var regex = new RegExp(pattern);
    return true;
  } catch(e) {
    return false;
  }
}

// Check if content script is ready
async function isContentScriptReady() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
      throw new Error('No active tab found');
    }
    
    // Try to send a ping to the content script
    await chrome.tabs.sendMessage(tabs[0].id, { message: 'ping' });
    return true;
  } catch (error) {
    console.error('Content script not ready:', error);
    return false;
  }
}

// Show error message to user
function showError(message) {
  const error = document.getElementById('error');
  error.textContent = message;
  error.style.color = ERROR_COLOR;
  document.getElementById('numResults').textContent = '';
}
/* Send input to content script of tab to search for regex */
const passInputToContentScript = async (configurationChanged) => {
  const input = document.getElementById('inputRegex');
  const error = document.getElementById('error');
  
  // Clear previous error and highlights
  error.textContent = '';
  
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]?.id) {
      throw new Error('No active tab found');
    }
    
    // If input is empty, clear highlights and return
    if (input.value === '') {
      await chrome.tabs.sendMessage(tabs[0].id, { message: 'clearHighlight' })
        .catch(() => {}); // Ignore errors when clearing
      document.getElementById('numResults').textContent = '';
      return;
    }
    
    // Validate regex
    if (!isValidRegex(input.value)) {
      throw new Error('Invalid regular expression');
    }
    
    // Check if content script is ready
    const isReady = await isContentScriptReady();
    if (!isReady) {
      showError('Please refresh the page and try again.');
      return;
    }
    
    // Send search message to content script
    await chrome.tabs.sendMessage(tabs[0].id, {
      message: 'search',
      regexString: input.value,
      configurationChanged: configurationChanged
    });
    
    // Add to history if this is a new search
    if (!configurationChanged) {
      addToHistory(input.value);
    }
  } catch (error) {
    showError(error.message);
  }
};

/* Send message to content script of tab to select next result */
const selectNext = async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, { message: 'selectNextNode' })
        .catch(error => {
          if (error.message.includes('Could not establish connection')) {
            showError('Please refresh the page and try again.');
          } else {
            throw error;
          }
        });
    }
  } catch (error) {
    showError(error.message);
  }
};

/* Send message to content script of tab to select previous result */
const selectPrev = async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await chrome.tabs.sendMessage(tabs[0].id, { message: 'selectPrevNode' })
        .catch(error => {
          if (error.message.includes('Could not establish connection')) {
            showError('Please refresh the page and try again.');
          } else {
            throw error;
          }
        });
    }
  } catch (error) {
    showError(error.message);
  }
};

/* Send message to pass input string to content script of tab to find and highlight regex matches */
// Using the async/await version of passInputToContentScript defined above

function createHistoryLineElement(text) {
  var deleteEntryDiv = document.createElement('div');
  deleteEntryDiv.className = 'historyDeleteEntry'
  deleteEntryDiv.textContent = '\u2715';
  deleteEntryDiv.addEventListener('click', function() {
    for (var i = searchHistory.length - 1; i >= 0; i--) {
      if (searchHistory[i] == text) {
        searchHistory.splice(i, 1);
      }
    }
    chrome.storage.local.set({searchHistory: searchHistory});
    updateHistoryDiv();
  });
  var linkdiv = document.createElement('div');
  linkdiv.className = 'historyLink';
  linkdiv.textContent = text;
  linkdiv.addEventListener('click', function() {
    if (document.getElementById('inputRegex').value !== text) {
      document.getElementById('inputRegex').value = text;
      passInputToContentScript();
      document.getElementById('inputRegex').focus();
    }
  });
  var lineDiv = document.createElement('div');
  lineDiv.className= 'history-items-container';
  lineDiv.appendChild(deleteEntryDiv);
  lineDiv.appendChild(linkdiv);
  return lineDiv;
}

function updateHistoryDiv() {
  var historyDiv = document.getElementById('history');
  if (historyDiv) {
    historyDiv.innerHTML = '';
    if (searchHistory.length == 0) {
      var div = document.createElement('div');
      div.className = 'historyIsEmptyMessage';
      div.textContent = HISTORY_IS_EMPTY_TEXT;
      historyDiv.appendChild(div);
    } else {
      for (var i = searchHistory.length - 1; i >= 0; i--) {
        historyDiv.appendChild(createHistoryLineElement(searchHistory[i]));
      }
      var clearButton = document.createElement('a');
      clearButton.href = '#';
      clearButton.type = 'button';
      clearButton.textContent = CLEAR_ALL_HISTORY_TEXT;
      clearButton.className = 'clearHistoryButton';
      clearButton.addEventListener('click', clearSearchHistory);
      historyDiv.appendChild(clearButton);
    }
  }
}

function addToHistory(regex) {
  if (regex && searchHistory !== null) {
    if (searchHistory.length == 0 || searchHistory[searchHistory.length - 1] != regex) {
      searchHistory.push(regex);
    }
    for (var i = searchHistory.length - 2; i >= 0; i--) {
      if (searchHistory[i] == regex) {
        searchHistory.splice(i, 1);
      }
    }
    if (searchHistory.length > maxHistoryLength) {
      searchHistory.splice(0, searchHistory.length - maxHistoryLength);
    }
    chrome.storage.local.set({searchHistory: searchHistory});
    updateHistoryDiv();
  }
}

function setHistoryVisibility(makeVisible) {
  document.getElementById('history').style.display = makeVisible ? 'block' : 'none';
  document.getElementById('show-history').title = makeVisible ? HIDE_HISTORY_TITLE : SHOW_HISTORY_TITLE;
  if(makeVisible) {
    document.getElementById('show-history').className = 'find-button selected';
  } else {
    document.getElementById('show-history').className = 'find-button';
  }
}

function setCaseInsensitiveElement() {
  var caseInsensitive = chrome.storage.local.get({'caseInsensitive':DEFAULT_CASE_INSENSITIVE},
  function (result) {
    document.getElementById('insensitive').title = result.caseInsensitive ? DISABLE_CASE_INSENSITIVE_TITLE : ENABLE_CASE_INSENSITIVE_TITLE;
    if(result.caseInsensitive) {
      document.getElementById('insensitive').className = 'find-button selected';
    } else {
      document.getElementById('insensitive').className = 'find-button';
    }
  });
}
function toggleCaseInsensitive() {
  var caseInsensitive = document.getElementById('insensitive').className == 'find-button selected';
  document.getElementById('insensitive').title = caseInsensitive ? ENABLE_CASE_INSENSITIVE_TITLE : DISABLE_CASE_INSENSITIVE_TITLE;
  if(caseInsensitive) {
    document.getElementById('insensitive').className = 'find-button';
  } else {
    document.getElementById('insensitive').className = 'find-button selected';
  }
  sentInput = false;
  chrome.storage.local.set({caseInsensitive: !caseInsensitive});
  passInputToContentScript(true);
}

function clearSearchHistory() {
  searchHistory = [];
  chrome.storage.local.set({searchHistory: searchHistory});
  updateHistoryDiv();
}

// Apply theme based on preference
function applyTheme(theme) {
  const body = document.body;
  const icon = document.querySelector('#toggle-darkmode i');
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
    body.classList.add('dark-mode');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    document.querySelector('#toggle-darkmode').title = 'Switch to Light Mode';
  } else {
    body.classList.remove('dark-mode');
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    document.querySelector('#toggle-darkmode').title = 'Switch to Dark Mode';
  }
}

// Toggle between light and dark mode
function toggleDarkMode() {
  // Get current theme
  chrome.storage.local.get(['theme'], function(result) {
    let currentTheme = result.theme || DEFAULT_THEME;
    let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Save the new theme preference
    chrome.storage.local.set({ theme: newTheme }, function() {
      applyTheme(newTheme);
      // Notify options page about the theme change
      chrome.runtime.sendMessage({ action: 'updateTheme', theme: newTheme });
    });
  });
}

// Initialize theme from saved preference
function initDarkMode() {
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    chrome.storage.local.get(['theme'], function(result) {
      const theme = result.theme || DEFAULT_THEME;
      if (theme === 'system') {
        applyTheme('system');
      }
    });
  });
  
  // Set up the toggle button
  document.getElementById('toggle-darkmode').addEventListener('click', function(e) {
    e.preventDefault();
    toggleDarkMode();
  });
}


/*** LISTENERS ***/
document.getElementById('next').addEventListener('click', function() {
  selectNext();
});

document.getElementById('prev').addEventListener('click', function() {
  selectPrev();
});

document.getElementById('clear').addEventListener('click', function() {
  sentInput = false;
  document.getElementById('inputRegex').value = '';
  passInputToContentScript();
  document.getElementById('inputRegex').focus();
});

document.getElementById('show-history').addEventListener('click', function() {
  var makeVisible = document.getElementById('history').style.display == 'none';
  setHistoryVisibility(makeVisible);
  chrome.storage.local.set({isSearchHistoryVisible: makeVisible});
});

document.getElementById('insensitive').addEventListener('click', function() {
  toggleCaseInsensitive();
});

// Add dark mode toggle event listener
document.getElementById('toggle-darkmode').addEventListener('click', function(e) {
  e.preventDefault();
  toggleDarkMode();
});

// Load theme preference and initialize
chrome.storage.local.get(['theme'], function(result) {
  const theme = result.theme || DEFAULT_THEME;
  applyTheme(theme);
});

// Initialize dark mode when popup loads
initDarkMode();

// Handle all incoming messages
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle theme updates from options page
  if (request.action === 'updateTheme') {
    applyTheme(request.theme);
    return true;
  }
  
  // Handle search info updates
  if (request.message === 'returnSearchInfo') {
    processingKey = false;
    if (request.numResults > 0) {
      document.getElementById('numResults').textContent = 
        String(request.currentSelection + 1) + ' of ' + String(request.numResults);
    } else {
      document.getElementById('numResults').textContent = 
        String(request.currentSelection) + ' of ' + String(request.numResults);
    }
    if (!sentInput) {
      document.getElementById('inputRegex').value = request.regexString;
    }
    if (request.numResults > 0 && request.cause === 'selectNode') {
      addToHistory(request.regexString);
    }
    return true;
  }
  
  // Handle regex string updates
  if (request.regexString && request.regexString !== document.getElementById('inputRegex').value) {
    document.getElementById('inputRegex').value = request.regexString;
    passInputToContentScript();
    return true;
  }
  
  return false;
});

document.getElementById('copy-to-clipboard').addEventListener('click', function() {
  const copyToClipboardMessage = document.getElementById('clipboardNotification')
  copyToClipboardMessage.style.display = "block"
  setTimeout(()=> {
    copyToClipboardMessage.style.display = "none"
  },1500)
  chrome.tabs.query({
    'active': true,
    'currentWindow': true
  }, function(tabs) {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        'message': 'copyToClipboard'
      });
    }
  });
});

/* Key listener for selectNext and selectPrev
 * Thanks a lot to Cristy from StackOverflow for this AWESOME solution
 * http://stackoverflow.com/questions/5203407/javascript-multiple-keys-pressed-at-once */
var map = [];
onkeydown = onkeyup = function(e) {
    map[e.keyCode] = e.type == 'keydown';
    if (document.getElementById('inputRegex') === document.activeElement) { //input element is in focus
      if (!map[16] && map[13]) { //ENTER
        if (sentInput) {
          selectNext();
        } else {
          passInputToContentScript();
        }
      } else if (map[16] && map[13]) { //SHIFT + ENTER
        selectPrev();
      }
    }
}
/*** LISTENERS ***/

/*** INIT ***/
/* Retrieve from storage whether we should use instant results or not */
chrome.storage.local.get({
    'instantResults' : DEFAULT_INSTANT_RESULTS,
    'maxHistoryLength' : MAX_HISTORY_LENGTH,
    'searchHistory' : null,
    'isSearchHistoryVisible' : false},
  function(result) {
    if(result.instantResults) {
      document.getElementById('inputRegex').addEventListener('input', function() {
        passInputToContentScript();
      });
    } else {
      document.getElementById('inputRegex').addEventListener('change', function() {
        passInputToContentScript();
      });
    }
    console.log(result);
    if(result.maxHistoryLength) {
      maxHistoryLength = result.maxHistoryLength;
    }
    if(result.searchHistory) {
      searchHistory = result.searchHistory.slice(0);
    } else {
      searchHistory = [];
    }
    setHistoryVisibility(result.isSearchHistoryVisible);
    updateHistoryDiv();
  }
);

/* Get search info if there is any */
chrome.tabs.query({
  'active': true,
  'currentWindow': true
},
function(tabs) {
  if ('undefined' != typeof tabs[0].id && tabs[0].id) {
    chrome.tabs.sendMessage(tabs[0].id, {
      'message' : 'getSearchInfo'
    }, function(response){
      if (response) {
        // Content script is active
        console.log(response);
      } else {
        console.log(response);
        document.getElementById('error').textContent = ERROR_TEXT;
      }
    });
  }
});

/* Focus onto input form */
document.getElementById('inputRegex').focus();
window.setTimeout( 
  function(){document.getElementById('inputRegex').select();}, 0);
//Thanks to http://stackoverflow.com/questions/480735#comment40578284_14573552

var makeVisible = document.getElementById('history').style.display == 'none';
setHistoryVisibility(makeVisible);
chrome.storage.local.set({isSearchHistoryVisible: makeVisible});

setCaseInsensitiveElement();
/*** INIT ***/

