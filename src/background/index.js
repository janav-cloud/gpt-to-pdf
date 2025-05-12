// jsPDF script
try {
  importScripts('../../public/libs/jspdf.umd.min.js');
  console.log('jsPDF importScripts executed');
  if (!self.jspdf || !self.jspdf.jsPDF) {
    console.error('jsPDF not loaded correctly: self.jspdf is', self.jspdf);
  } else {
    console.log('jsPDF loaded successfully');
  }
} catch (e) {
  console.error('Failed to load jsPDF:', e);
}

// Scraper Settings
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportToPDF') {
    chrome.storage.sync.get(['pdfSettings'], (result) => {
      const settings = result.pdfSettings || {
        includePrompts: true,
        includeAnswers: true,
        theme: 'light',
        font: 'Times'
      };
      console.log('Retrieved settings:', settings);

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0].url.startsWith('http') && !tabs[0].url.startsWith('https')) {
          console.error('Invalid page URL:', tabs[0].url);
          sendResponse({ status: 'error', error: 'Cannot export from this page' });
          return;
        }

        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: scrapeConversation
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.error('executeScript error:', chrome.runtime.lastError);
            sendResponse({ status: 'error', error: chrome.runtime.lastError.message });
            return;
          }

          const conversation = results[0]?.result || [];
          console.log('Scraped conversation:', conversation);
          if (conversation.length > 0) {
            sendResponse({ status: 'success', conversation, settings });
          } else {
            sendResponse({ status: 'error', error: 'No conversation data found' });
          }
        });
      });
    });
    return true;
  }
});

// Scraper Injection
function scrapeConversation() {
  const conversation = [];
  const messages = document.querySelectorAll('div[class*="chat-message"], div[class*="message"], .prose, .whitespace-pre-wrap');
  messages.forEach((msg, index) => {
    const text = msg.textContent.trim();
    if (text) {
      const isPrompt = msg.classList.contains('user-message') || index % 2 === 0; // Fallback to index-based logic
      conversation.push({
        type: isPrompt ? 'prompt' : 'answer',
        text: text
      });
    }
  });
  console.log('Scraped:', conversation);
  return conversation;
}