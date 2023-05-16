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

chrome.runtime.onInstalled.addListener(function() {
  // Create the context menu item
  chrome.contextMenus.create({
    id: "customContextMenu",
    title: "Add to Briefing",
    contexts: ["selection"]
  });
});

// Add a listener for the context menu item
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "customContextMenu" && info.selectionText) {
    chrome.storage.local.get(null, function(items) {
      // Modify the value of briefing
      items.briefing = items.briefing+ " ."+info.selectionText;
    
      // Save the updated values back to storage
      chrome.storage.local.set(items);
    })
  }
});


