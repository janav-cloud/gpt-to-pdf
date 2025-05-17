document.addEventListener('DOMContentLoaded', () => {
  // Only allow built-in PDFMake fonts
  const fontSelect = document.getElementById('font');
  fontSelect.innerHTML = `
    <option value="Roboto">Roboto</option>
    <option value="Courier">Courier</option>
  `;

  // Load saved settings
  chrome.storage.sync.get(['pdfSettings'], (result) => {
    const settings = result.pdfSettings || {
      includePrompts: true,
      includeAnswers: true,
      theme: 'light',
      font: 'Roboto'
    };
    document.getElementById('includePrompts').checked = settings.includePrompts;
    document.getElementById('includeAnswers').checked = settings.includeAnswers;
    document.getElementById('theme').value = settings.theme;
    document.getElementById('font').value = settings.font;
  });

  // Save settings
  document.getElementById('saveBtn').addEventListener('click', () => {
    const settings = {
      includePrompts: document.getElementById('includePrompts').checked,
      includeAnswers: document.getElementById('includeAnswers').checked,
      theme: document.getElementById('theme').value,
      font: document.getElementById('font').value
    };
    chrome.storage.sync.set({ pdfSettings: settings }, () => {
      alert('Settings saved!');
    });
  });
});