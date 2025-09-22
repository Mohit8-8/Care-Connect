// Response formatting utilities for medical information
export function formatMedicalResponse(response) {
  // Split into lines for processing
  let lines = response.split('\n').filter(line => line.trim());

  // If response contains lists or multiple items, format them as bullet points
  if (response.includes('medication') || response.includes('treatment') ||
      response.includes('symptom') || response.includes('option') ||
      response.toLowerCase().includes('include') || response.includes(':')) {

    let formattedLines = [];
    let currentSection = '';

    for (let line of lines) {
      line = line.trim();

      // Skip empty lines
      if (!line) continue;

      // Check if this line starts a new section
      if (line.includes('medication') || line.includes('treatment') ||
          line.includes('symptom') || line.includes('option') ||
          line.toLowerCase().includes('common') || line.toLowerCase().includes('recommended')) {
        currentSection = line;
        formattedLines.push(`\n**${currentSection}**`);
      }
      // Check if line contains list items (indicated by - or numbers)
      else if (line.startsWith('-') || line.startsWith('•') ||
               /^\d+\./.test(line) || line.includes(': ')) {
        // Clean up the bullet point
        let cleanLine = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
        formattedLines.push(`• ${cleanLine}`);
      }
      // Regular text
      else if (currentSection && line) {
        formattedLines.push(line);
      }
      // Standalone text
      else {
        formattedLines.push(line);
      }
    }

    return formattedLines.join('\n');
  }

  return response;
}
