chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'pageUpdated') {
    sendResponse({ message: 'Page update detected' });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Send a message to the content script to re-attach event listeners and create the AI button
    chrome.tabs.sendMessage(tabId, { message: 'pageUpdated' });
  }
});

