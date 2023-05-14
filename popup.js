console.log("hello!!!!!")
document.addEventListener('DOMContentLoaded', () => {

     
 // Retrieve user preferences from local storage and set the initial state of the form inputs
chrome.storage.local.get({
  bannersClosed: 'false',
  apiKey: '',
  showBelow: false,
  replaceInput: false,
  tokenLimit: 100,
  briefing: '',
  pdfbriefing:'',
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
  document.getElementById("showBelow").checked = result.showBelow;
  document.getElementById('replaceInput').checked = result.replaceInput;
  document.getElementById('tokenLimit').value = result.tokenLimit;
  document.getElementById('briefing').value = result.briefing;
  document.getElementById('pdfbriefing').files[0] = result.pdfbriefing;
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
    const showBelow = document.getElementById("showBelow").checked;
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
  const pdf = document.getElementById('pdfbriefing').files[0];
  console.log("hello")
  if (typeof pdf !== 'undefined') {
 loadPDF(pdf).then(text=>{pdfText=text;
  setChromeStorage(pdfText)
}).catch(error => {
  console.error(error);
});}else{
  setChromeStorage()
}

    // Save user preferences in local storage(
  function setChromeStorage(pdfbriefing=""){
    chrome.storage.local.set({
      apiKey,
      showBelow,
      replaceInput,
      tokenLimit,
      briefing,
      pdfbriefing,
      language,
        model,
        copyToClipboard,
        hideAiButtons,
    gptCommand: commandPrefix,
    commentCommand: submitKey,
    aiButtonName,
    useSurroundingText,
    });}

  });
    
    document.getElementById('suggestFeatureBtn').addEventListener('click', () => {
    window.open(`mailto:hi@mantasdigital.com?subject=Feature request for ChatGPT Browser Integration`);
  });

  document.getElementById("suggestFeatureBtn").addEventListener("click", () => {
    window.open(
      `mailto:hi@mantasdigital.com?subject=Feature request for ChatGPT Browser Integration`
    );
  });

  document.getElementById("requestHelpBtn").addEventListener("click", () => {
    window.open(
      `mailto:hi@mantasdigital.com?subject=Need help with ChatGPT Browser Integration`
    );
  });
});

document.getElementById('resetDefaults').addEventListener('click', (event) => {
    chrome.storage.local.set({
        apiKey: '',
        showBelow: false,
  replaceInput: false,
  tokenLimit: 100,
  briefing: '',
  pdfbriefing:'',
  language: 'en',
    model: 'gpt-4',
      copyToClipboard: false,
      hideAiButtons: false,
      gptCommand: "gpt:",
      commentCommand: "//",
      aiButtonName: "AI",
      useSurroundingText: "true"
    },
    () => {
      location.reload();
    }
  );
});

document.getElementById("closeBanner").addEventListener("click", () => {
  const banners = document.querySelector(".banner");
  banners.style.display = "none";
  chrome.storage.local.set({ bannersClosed: true });
});

function loadPDF(pdfFile) {
  return new Promise((resolve, reject) => {
    if (!pdfFile) {
      reject(new Error('No PDF file provided.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
      const pdfData = new Uint8Array(event.target.result);
      resolve(renderPDF(pdfData));
    };

    reader.onerror = function(event) {
      reject(event.target.error);
    };

    reader.readAsArrayBuffer(pdfFile);
  });
}

function renderPDF(data) {
  return new Promise((resolve, reject) => {
    const loadingTask = pdfjsLib.getDocument(data);

    loadingTask.promise.then((pdf) => {
      const numPages = pdf.numPages;
      let pagesText = "";

      // Iterate over each page
      const textPromises = Array.from({ length: numPages }, (_, i) =>
        pdf.getPage(i + 1).then((page) => {
          // Extract text content from the page
          return page.getTextContent().then((textContent) => {
            // Concatenate the text content of each item
            let pageText = "";
            for (const item of textContent.items) {
              pageText += item.str + " ";
            }
            pagesText += pageText + "\n\n";
          });
        })
      );

      // Wait for all text promises to resolve
      Promise.all(textPromises)
        .then(() => {
          resolve(pagesText); // Resolve with the concatenated text from all pages
        })
        .catch((error) => {
          reject(error);
        });
    }).catch((error) => {
      reject(error);
    });
  });
}
