let COMMAND_PREFIX = "gptCommand";
let SUBMIT_KEY = "commentCommand";


// utils
const getTextContent = el => el.value || el.textContent;

// utils
const getTextValueKey = el => {
  return el.value ? "value" : "textContent";
};

function processCommand(
  inputElement,
  command,
  options,
  calledByAIButton = false
) {
  // Show loader
  const loader = document.createElement("div");
loader.classList.add("chatgpt-loader");
inputElement.parentNode.appendChild(loader);

  const query = COMMAND_PREFIX + ": " + command.trim();

  if (!options.apiKey || options.apiKey.trim() === "") {
    loader.remove();
    showErrorNotification(
      "Error: API key is missing. Please enter your API key in the extension settings."
    );
    return;
  }

  // Call ChatGPT API and update the input value
  fetchChatGPT(query, options, inputElement, calledByAIButton)
    .then(response => {
      if (options.copyToClipboard) {
        loader.remove();
        copyTextToClipboard(response);
      }
      const valueKey = getTextValueKey(inputElement);
      const value = inputElement[valueKey];
      // showBelow helps to force text in the input field. Useful in case of facebook
      if (options.showBelow) {
        loader.remove();
        // Create a span element to display the response
      const responseSpan = document.createElement("span");
      responseSpan.textContent = response;

      // Insert the response span element next to the input element
      inputElement.parentNode.insertBefore(responseSpan, inputElement.nextSibling);
      } else if (options.replaceInput) {
        if (value.includes(SUBMIT_KEY)) {
          let [beforeSubmitKey, afterSubmitKey] = value.split(SUBMIT_KEY);
          let [beforeCommandPrefix, afterCommandPrefix] =
            value.split(COMMAND_PREFIX);
          // Insert the response in between the two parts
          loader.remove();
          inputElement[
            valueKey
          ] = `${beforeCommandPrefix}${response}${afterSubmitKey}`;
        } else {
          loader.remove();
          inputElement[valueKey] = response;
        }
      } else {
        if (value.includes(SUBMIT_KEY)) {

          let [beforeSubmitKey, afterSubmitKey] = value.split(SUBMIT_KEY);
          loader.remove();
          // Insert the response in between the two parts
          inputElement[
            valueKey
          ] = `${beforeSubmitKey}${SUBMIT_KEY} ${response}${afterSubmitKey}`;
        } else {
          loader.remove();
          inputElement[valueKey] += ` ${response}`;
        }
      }
     
    })
    .catch(error => {
      loader.remove();
      console.error("Error fetching GPT response:", error);
      showErrorNotification("Error: API key is invalid.");
    });
}

// New function to handle attaching the event listener and creating the AI button
function attachKeyListener(element) {
  element.addEventListener("keydown", handleKeyDown);
  createAIButton(element);
}

// New function to replace the existing event listener
function handleKeyDown(event) {
  if (event.key !== "Enter") return;
  const inputElement = event.target;

  if (
    inputElement.contentEditable === "true" ||
    inputElement.getAttribute("role") === "textbox" ||
    inputElement.tagName === "INPUT" ||
    inputElement.tagName === "TEXTAREA"
  ) {
    const valueKey = getTextValueKey(inputElement);
    const text = inputElement[valueKey];
    let command;
    // Retrieve user preferences from local storage
    chrome.storage.local.get(['showBelow','apiKey', 'replaceInput', 'tokenLimit', 'briefing','pdfbriefing','urlbriefing','url','language', 'model', 'copyToClipboard','gptCommand', 'commentCommand', 'useSurroundingText'], (options) => {
      COMMAND_PREFIX = options.gptCommand;
  SUBMIT_KEY = options.commentCommand;
  if (text.includes(COMMAND_PREFIX)) {
    const pattern = new RegExp(
      `(${COMMAND_PREFIX}[^${SUBMIT_KEY}]+)(?=${SUBMIT_KEY})`
    );
    const match = text.match(pattern);
    if (match) {
      event.preventDefault();
      command = match[1].trim();
    }
  }
  processCommand(inputElement, command, options, false);
}
);

       
  }
}

// Attach event listener to existing input and textarea elements
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "pageUpdated") {
    document
      .querySelectorAll(
        'input, textarea, [contenteditable="true"], [role="textbox"]'
      )
      .forEach(attachKeyListener);
    sendResponse({ status: "success" });
  }
});

// Create a MutationObserver to monitor DOM changes
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach(node => {
        if (
          node instanceof HTMLInputElement ||
          node instanceof HTMLTextAreaElement
        ) {
          attachKeyListener(node);
        } else if (node.querySelectorAll) {
          const inputs = node.querySelectorAll(
            'input,textarea,[contenteditable="true"],[aria-label="Message Body"],[role="textbox"]'
          );
          inputs.forEach(attachKeyListener);
        }
      });
    }
  });
});

// Start observing DOM changes
observer.observe(document.body, {
  childList: true,
  subtree: true
});

async function fetchChatGPT(query, options, inputElement, isCalledByAIButton) {
  const API_KEY = options.apiKey;
  const output_length = parseInt(options.tokenLimit, 10);
  const briefing = options.briefing;
  const urlbriefing=options.urlbriefing
  const pdfbriefing=options.pdfbriefing
  const language = options.language;
  const model = options.model; // Added this line

  let messages = [
    {
      role: "user",
      content: query
    }
  ];
  let postFields = {
    model: model,
    messages: messages,
    max_tokens: output_length,
    n: 1,
    stop: null,
    temperature: 0.5
  };

  let API_URL = "https://api.openai.com/v1/chat/completions";
  if (model === "text-curie-001" || model === "text-davinci-003") {
    API_URL = "https://api.openai.com/v1/completions";
    postFields = {
      model: model,
      prompt: messages[1],
      max_tokens: output_length,
      n: 1,
      stop: null,
      temperature: 0.5
    }; //Might need to parseInt() output_length
  } else {
    postFields = {
      model: model,
      messages: messages,
      max_tokens: output_length,
      n: 1,
      stop: null,
      temperature: 0.5
    };
    API_URL = "https://api.openai.com/v1/chat/completions";
  }

  if (briefing) {
    messages.unshift({
      role: "user",
      content: `Remember this content in case the user asks a question about it. When user asks question about this reply like it is a prompt: ${briefing} `
    });
  }

  if (pdfbriefing){
    // feed in batches
    // Remove leading/trailing white space
    str = pdfbriefing.trim();
    // Split the string by space
    const words = str.split(" ");
    // Return the count of words
    let start = 0; // Start index for the current chunk
    
    chunkSize=Math.floor(options.tokenLimit/10)
    while (start < words.length) {
      const chunk = words.slice(start, start + chunkSize); // Get a chunk of words
      const joinedString = chunk.join(" "); // Join the words with a space

     
      messages.push({
        role: 'user',
        content: `Remember this content from a pdf: ${joinedString} `,
      });
      
      start +=Math.floor(words.length/10)
     
    }
    
  }
  

  if (urlbriefing){
    // feed in batches
    // Remove leading/trailing white space
    str = urlbriefing.trim();
    // Split the string by space
    const words = str.split(" ");
    // Return the count of words
    let start = 0; // Start index for the current chunk
    chunkSize=Math.floor(options.tokenLimit/10)
    // get like max 10 parts of the content. It should be enough
    while (start < words.length) {
      const chunk = words.slice(start, start + chunkSize); // Get a chunk of words
      const joinedString = chunk.join(" "); // Join the words with a space

     
      messages.push({
        role: 'user',
        content: `Remember this content. It is from this site: ${options.url}. Part of its content is : ${joinedString} `,
      });
      
      start += Math.floor(words.length/10)
    }

  }

    
    // Check if the 'useSurroundingText' option is enabled
  if (options.useSurroundingText && !isCalledByAIButton) {
    const valueKey = getTextValueKey(inputElement);
    const fullText = inputElement[valueKey];
    const textBeforeCommand = fullText.split(options.gptCommand)[0].trim();
    const textAfterComment = fullText.split(options.commentCommand)[1].trim();

    // Add the surrounding text as context
    messages.unshift({
      role: "system",
      content: `${textBeforeCommand} ${textAfterComment}`
    });
  }

  let requestBody = postFields;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  if (model === "text-curie-001" || model === "text-davinci-003") {
    if (data.choices && data.choices.length > 0 && data.choices[0].text) {
      let content = data.choices[0].text.trim();
      if (language && language !== "en") {
        messages = [
          {
            role: "user",
            content: `Translate to ${language}: ${content}`
          }
        ];

        let requestBody2 = {
          model: model,
          prompt: messages[1],
          max_tokens: output_length,
          n: 1,
          stop: null,
          temperature: 0.5
        };

        const response2 = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`
          },
          body: JSON.stringify(requestBody2)
        });

        const data2 = await response2.json();
        if (
          data2.choices &&
          data2.choices.length > 0 &&
          data2.choices[0].text
        ) {
          content = data2.choices[0].text.trim();
        } else {
          console.error("No response from language translation API");
        }
      }
      return content;
    } else {
      throw new Error("No response from ChatGPT");
    }
  } else {
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      let content = data.choices[0].message.content.trim();
      if (language && language !== "en") {
        let messages = [
          {
            role: "user",
            content: `Translate to ${language}: ${content}`
          }
        ];

        let requestBody2 = {
          model: model,
          messages: messages,
          max_tokens: output_length,
          n: 1,
          stop: null,
          temperature: 0.5
        };

        const response2 = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`
          },
          body: JSON.stringify(requestBody2)
        });

        const data2 = await response2.json();
        if (
          data2.choices &&
          data2.choices.length > 0 &&
          data2.choices[0].message
        ) {
          content = data2.choices[0].message.content.trim();
        } else {
          console.error("No response from language translation API");
        }
      }
      return content;
    } else {
      throw new Error("No response from ChatGPT");
    }
  }
}

// New function to create the AI button
function createAIButton(inputElement) {
    chrome.storage.local.get(['hideAiButtons'], ({ hideAiButtons }) => {
  
    if (hideAiButtons)
        {
            // Remove any existing AI buttons
  const existingAIButtons = document.querySelectorAll('.chatgpt-ai-button');
  existingAIButtons.forEach((button) => button.remove());
        }
  });
  const aiButton = document.createElement("button");
  aiButton.innerHTML = "AI";
  aiButton.style.position = "absolute";
  aiButton.style.right = "0px";
  aiButton.style.bottom = "0px";
  aiButton.classList.add("chatgpt-ai-button"); // Add a class to the AI button
  aiButton.addEventListener("click", event => {
    event.preventDefault();
    const valueKey = getTextValueKey(inputElement);
    const text = inputElement[valueKey];

    // Retrieve user preferences from local storage
      chrome.storage.local.get(['showBelow','apiKey', 'replaceInput', 'tokenLimit', 'briefing', 'pdfbriefing','urlbriefing','url','language', 'model', 'copyToClipboard','gptCommand','commentCommand','aiButtonName', 'useSurroundingText',], (options) => {
        COMMAND_PREFIX = options.gptCommand;
        SUBMIT_KEY = options.commentCommand;
        // Wrap the callback with an anonymous function
        (function (inputElement, text, options) {
          processCommand(inputElement, text, options, true);
        })(inputElement, text, options);
      }
    );
  });
  chrome.storage.local.get(["aiButtonName"], ({ aiButtonName }) => {
    aiButton.innerHTML = aiButtonName || "AI";
  });
  if (inputElement.parentNode) {
    inputElement.parentNode.insertBefore(aiButton, inputElement.nextSibling);
  } else {
    // If parentNode is not available, try again after 500ms
    setTimeout(() => createAIButton(inputElement), 500);
  }
}

function copyTextToClipboard(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

function showErrorNotification(message) {
  const notification = document.createElement("gpt-alert");
  notification.innerText = message;
  notification.style.position = "fixed";
  notification.style.top = "0";
  notification.style.right = "0";
  notification.style.backgroundColor = "red";
  notification.style.color = "white";
  notification.style.padding = "10px";
  notification.style.zIndex = "9999";
  document.body.appendChild(notification);

  setTimeout(() => {
    document.body.removeChild(notification);
  }, 5000);
}


