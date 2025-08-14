import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

interface DocumentSection {
  type: 'heading' | 'paragraph' | 'list';
  content: string;
  level?: number;
}

export const parseMarkdownToSections = (markdown: string): DocumentSection[] => {
  const lines = markdown.split('\n');
  const sections: DocumentSection[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      continue;
    }
    
    // Handle headings
    if (trimmedLine.startsWith('#')) {
      const level = trimmedLine.match(/^#+/)?.[0].length || 1;
      const content = trimmedLine.replace(/^#+\s*/, '');
      sections.push({ type: 'heading', content, level });
    }
    // Handle list items
    else if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      const content = trimmedLine.replace(/^[-*]\s*/, '');
      sections.push({ type: 'list', content });
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^\d+\.\s*/, '');
      sections.push({ type: 'list', content });
    }
    // Handle regular paragraphs
    else {
      sections.push({ type: 'paragraph', content: trimmedLine });
    }
  }
  
  return sections;
};

export const createWordDocument = (sections: DocumentSection[], title: string): Document => {
  const docParagraphs = sections.map(section => {
    switch (section.type) {
      case 'heading':
        const headingLevel = Math.min(section.level || 1, 6) as 1 | 2 | 3 | 4 | 5 | 6;
        const headingLevelMap: Record<number, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        
        return new Paragraph({
          text: section.content,
          heading: headingLevelMap[headingLevel],
          spacing: {
            after: 200,
            before: 200,
          },
        });
        
      case 'list':
        return new Paragraph({
          children: [
            new TextRun({
              text: `• ${section.content}`,
            }),
          ],
          spacing: {
            after: 100,
          },
          indent: {
            left: 720, // 0.5 inch
          },
        });
        
      case 'paragraph':
      default:
        return new Paragraph({
          children: [
            new TextRun({
              text: section.content,
            }),
          ],
          spacing: {
            after: 120,
          },
        });
    }
  });

  return new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 32,
              }),
            ],
            spacing: {
              after: 400,
            },
          }),
          ...docParagraphs,
        ],
      },
    ],
  });
};

export const exportMarkdownToWord = async (markdown: string, filename: string = 'document.docx', title: string = 'Document') => {
  try {
    const sections = parseMarkdownToSections(markdown);
    const doc = createWordDocument(sections, title);
    
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Word:', error);
    return false;
  }
};