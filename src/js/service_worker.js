// Simple message handler for the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle search info updates
  if (request.message === 'returnSearchInfo') {
    chrome.action.setBadgeText({
      text: String(request.numResults),
      tabId: sender.tab.id
    });
  }
  
  // Handle content script ready check
  if (request.message === 'contentScriptReady') {
    sendResponse({ status: 'ready' });
    return true; // Keep the message channel open for async response
  }
  
  // Handle ping from popup
  if (request.message === 'ping') {
    sendResponse({ status: 'pong' });
    return true; // Keep the message channel open for async response
  }
  
  return true; // Keep the message channel open for async response
});
