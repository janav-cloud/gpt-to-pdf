// Trigger PDF Generation
document.getElementById('exportBtn').addEventListener('click', () => {
  const btn = document.getElementById('exportBtn');
  btn.textContent = 'Exporting...';
  btn.disabled = true;

  chrome.runtime.sendMessage({ action: 'exportToPDF' }, (response) => {
    btn.textContent = 'Export to PDF';
    btn.disabled = false;

    if (response.status === 'success') {
      try {
        generatePDF(response.conversation, response.settings);
        alert('PDF exported successfully!');
      } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error exporting PDF: ' + error.message);
      }
    } else {
      alert('Error exporting PDF: ' + response.error);
    }
  });
});

// Generate PDF
function generatePDF(conversation, settings) {
  console.log('Starting PDF generation with settings:', settings);
  const doc = new jspdf.jsPDF();
  let yOffset = 20;

  // Theme
  const themes = {
    light: { bg: [255, 255, 255], text: [0, 0, 0], header: [0, 0, 0] },
    dark: { bg: [30, 30, 30], text: [255, 255, 255], header: [200, 200, 200] },
    professional: { bg: [240, 240, 240], text: [0, 0, 0], header: [0, 51, 102] }
  };
  const theme = themes[settings.theme] || themes.light;
  console.log('Applied theme:', theme);

  // Fonts
  const validFonts = ['Times', 'Helvetica', 'Courier'];
  const font = validFonts.includes(settings.font) ? settings.font : 'Times';
  doc.setFont(font);
  console.log('Set font:', font);

  // Add title
  doc.setFontSize(16);
  doc.setTextColor(theme.header[0], theme.header[1], theme.header[2]);
  doc.text('GPT Conversation Export', 20, yOffset);
  yOffset += 15;
  console.log('Added title');

  // Add content
  doc.setFontSize(12);
  doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
  conversation.forEach((item, index) => {
    if (yOffset > 250) { // Add page if near bottom
      doc.addPage();
      yOffset = 20;
      console.log('Added new page at item', index);
    }
    if (settings.includePrompts && item.type === 'prompt') {
      doc.setFontSize(12);
      doc.setFont(font, 'bold');
      // Truncate long text to prevent rendering issues
      const promptText = item.text.length > 1000 ? item.text.substring(0, 1000) + '...' : item.text;
      doc.text(`Prompt: ${promptText}`, 20, yOffset, { maxWidth: 170 });
      yOffset += doc.getTextDimensions(`Prompt: ${promptText}`, { maxWidth: 170 }).h + 10;
      console.log('Added prompt:', promptText.substring(0, 50) + '...');
    }
    if (settings.includeAnswers && item.type === 'answer') {
      doc.setFontSize(12);
      doc.setFont(font, 'normal');
      // Truncate long text to prevent rendering issues
      const answerText = item.text.length > 1000 ? item.text.substring(0, 1000) + '...' : item.text;
      doc.text(`Answer: ${answerText}`, 20, yOffset, { maxWidth: 170 });
      yOffset += doc.getTextDimensions(`Answer: ${answerText}`, { maxWidth: 170 }).h + 10;
      console.log('Added answer:', answerText.substring(0, 50) + '...');
    }
  });

  // Save PDF
  console.log('Saving PDF');
  doc.save('gpt_conversation.pdf');
  console.log('PDF save called');
}