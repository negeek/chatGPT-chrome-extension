document.addEventListener('DOMContentLoaded', () => {

     
 // Retrieve user preferences from local storage and set the initial state of the form inputs
chrome.storage.local.get({
  bannersClosed: 'false',
  apiKey: '',
  replaceInput: false,
  tokenLimit: 100,
  briefing: '',
  language: 'en',
    model: 'gpt-4',
    copyToClipboard: false,
    hideAiButtons: false,
  gptCommand: 'gpt:',
  commentCommand: '//',
  aiButtonName: 'AI',
  useSurroundingText: 'true',
}, (result) => {
    if (result.bannersClosed) {
        const banner = document.querySelector('.banner');
        banner.style.display = 'none';
      }
    
            console.log(result.gptCommand);
  document.getElementById('apiKey').value = result.apiKey;
  document.getElementById('replaceInput').checked = result.replaceInput;
  document.getElementById('tokenLimit').value = result.tokenLimit;
  document.getElementById('briefing').value = result.briefing;
  document.getElementById('language').value = result.language;
  document.getElementById('model').value = result.model;
    document.getElementById('copyToClipboard').checked = result.copyToClipboard;
    document.getElementById('hideAiButtons').checked = result.hideAiButtons;
  document.getElementById('gptCommand').value = result.gptCommand;
  document.getElementById('commentCommand').value = result.commentCommand;
  document.getElementById('aiButtonName').value = result.aiButtonName;
  document.getElementById('useSurroundingText').checked = result.useSurroundingText;
    
            console.log(result.gptCommand);
});
    
    document.getElementById('gptForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Add this line to prevent the default behavior

    // Get user preferences from the form inputs
    const apiKey = document.getElementById('apiKey').value;
    const replaceInput = document.getElementById('replaceInput').checked;
    const tokenLimit = document.getElementById('tokenLimit').value;
    const briefing = document.getElementById('briefing').value;
    const language = document.getElementById('language').value;
  const model = document.getElementById('model').value;
        const copyToClipboard = document.getElementById('copyToClipboard').checked;
        const hideAiButtons = document.getElementById('hideAiButtons').checked;
  const commandPrefix = document.getElementById('gptCommand').value;
  const submitKey = document.getElementById('commentCommand').value;
  const aiButtonName = document.getElementById('aiButtonName').value;
  const useSurroundingText = document.getElementById('useSurroundingText').checked;

    // Save user preferences in local storage
    chrome.storage.local.set({
      apiKey,
      replaceInput,
      tokenLimit,
      briefing,
      language,
        model,
        copyToClipboard,
        hideAiButtons,
    gptCommand: commandPrefix,
    commentCommand: submitKey,
    aiButtonName,
    useSurroundingText,
    });

  });
    
    document.getElementById('suggestFeatureBtn').addEventListener('click', () => {
    window.open(`mailto:hi@mantasdigital.com?subject=Feature request for ChatGPT Browser Integration`);
  });

  document.getElementById('requestHelpBtn').addEventListener('click', () => {
    window.open(`mailto:hi@mantasdigital.com?subject=Need help with ChatGPT Browser Integration`);
  });
});

document.getElementById('resetDefaults').addEventListener('click', (event) => {
    chrome.storage.local.set({
        apiKey: '',
  replaceInput: false,
  tokenLimit: 100,
  briefing: '',
  language: 'en',
    model: 'gpt-4',
      copyToClipboard: false,
        hideAiButtons: false,
      gptCommand: 'gpt:',
      commentCommand: '//',
      aiButtonName: 'AI',
      useSurroundingText: 'true',
    }, () => {
    location.reload();
  });
  });

document.getElementById('closeBanner').addEventListener('click', () => {
  const banners = document.querySelector('.banner');
  banners.style.display = 'none';
  chrome.storage.local.set({ bannersClosed: true });
});