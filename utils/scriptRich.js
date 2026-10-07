/*
  Rich text utility functions.
  
  Examples:
  isRichScript("<p>Hello</p>") -> true
  isRichScript("Hello world") -> false
  plainTextToHtml("Hello\n\nWorld") -> "<p>Hello</p><p>World</p>"
  scriptToHtml("Hello") -> "<p>Hello</p>"
  scriptToHtml("<p>Hello</p>") -> "<p>Hello</p>"
  scriptToPlainText("<p>Hello<br>World</p>") -> "Hello\nWorld"
*/

export function isRichScript(s) {
  if (!s) return false;
  const trimmed = String(s).trimStart();
  return trimmed.startsWith('<p>') || trimmed.startsWith('<p ');
}

export function plainTextToHtml(text) {
  if (!text) return '';
  const escapeHtml = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const paragraphs = String(text).split(/\n{2,}/);
  return paragraphs.map(p => {
    const escaped = escapeHtml(p);
    return '<p>' + escaped.replace(/\n/g, '<br>') + '</p>';
  }).join('');
}

export function scriptToHtml(stored) {
  if (isRichScript(stored)) return stored || '';
  return plainTextToHtml(stored);
}

export function scriptToPlainText(stored) {
  if (!stored) return '';
  if (!isRichScript(stored)) return String(stored);
  
  let text = String(stored);
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  text = text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, match => entities[match]);
  return text.trim();
}

export function normalizeEditorHtml(html) {
  if (!scriptToPlainText(html).trim()) return '';
  return html;
}

export function sanitizeScriptHtml(html) {
  if (!html) return '';
  const allowedTags = ['p', 'br', 'strong', 'b', 'u', 'mark'];
  
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const cleanNode = (node) => {
      if (node.nodeType === 3) {
        // Text node: encode entities if re-serializing manually, but textContent handles it.
        // Actually, just return textContent.
        const text = node.textContent;
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      if (node.nodeType !== 1) return ''; // Skip comments etc.
      
      const tag = node.tagName.toLowerCase();
      if (['script', 'style', 'iframe', 'object', 'embed'].includes(tag)) return '';
      
      let childrenStr = '';
      for (const child of Array.from(node.childNodes)) {
        childrenStr += cleanNode(child);
      }
      
      if (!allowedTags.includes(tag)) {
        return childrenStr; // Keep text, strip tag
      }
      
      const outTag = tag === 'b' ? 'strong' : tag;
      if (outTag === 'br') return '<br>';
      return `<${outTag}>${childrenStr}</${outTag}>`;
    };
    
    let res = '';
    for (const child of Array.from(doc.body.childNodes)) {
      res += cleanNode(child);
    }
    return res;
  }
  
  // Fallback (e.g. server-side/build time)
  return plainTextToHtml(scriptToPlainText(html));
}
