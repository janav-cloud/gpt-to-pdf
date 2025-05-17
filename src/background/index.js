chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportToPDF') {
    chrome.storage.sync.get(['pdfSettings'], (result) => {
      const settings = result.pdfSettings || {
        includePrompts: true,
        includeAnswers: true,
        theme: 'light',
        font: 'Roboto'
      };
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        // Inject DOMPurify first
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            files: ['public/libs/DOMPurify.js']
          },
          () => {
            // Now run the scrape function
            chrome.scripting.executeScript(
              {
                target: { tabId: tabs[0].id },
                func: scrapeWithDOMPurify
              },
              (results) => {
                const result = results && results[0] && results[0].result ? results[0].result : {};
                const conversation = result.conversation || [];
                const chatTitle = result.chatTitle || 'ChatGPT Conversation';
                if (conversation.length > 0) {
                  sendResponse({ status: 'success', conversation, chatTitle, settings });
                } else {
                  sendResponse({ status: 'error', error: 'No conversation data found' });
                }
              }
            );
          }
        );
      });
    });
    return true;
  }
});

function scrapeWithDOMPurify() {
  let chatTitle = document.querySelector('h1, header h1, .text-2xl, .text-lg')?.textContent?.trim() || 'ChatGPT Conversation';

  const conversation = [];

  // 1. User prompts: exact selector you gave
  document.querySelectorAll('div[class*="max-w-"][class*="user-chat-width"] > .whitespace-pre-wrap')
    .forEach(node => {
      if (node.textContent.trim()) {
        conversation.push({
          type: 'prompt',
          text: node.textContent.trim()
        });
      }
    });

  // 2. Assistant answers: exact selector you gave
  document.querySelectorAll('.markdown.prose > p')
    .forEach(node => {
      if (node.textContent.trim()) {
        conversation.push({
          type: 'answer',
          text: node.textContent.trim()
        });
      }
    });

  return { conversation, chatTitle };
}