import React, { useState } from 'react';
import { Copy, Check, Play, BookOpen, AlertCircle, Sparkles, AlertTriangle, Info } from 'lucide-react';

export default function MarkdownRenderer({ content, onOpenInPlayground }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyCode = (code, blockId) => {
    navigator.clipboard.writeText(code);
    setCopiedId(blockId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseMarkdown = (text) => {
    if (!text) return [];

    const lines = text.split('\n');
    const elements = [];
    let currentCodeBlock = null;
    let currentTable = null;
    let currentAlert = null;
    let currentList = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle Code Blocks
      if (line.trim().startsWith('```')) {
        if (currentCodeBlock) {
          // End of code block
          elements.push({
            type: 'code-block',
            lang: currentCodeBlock.lang,
            code: currentCodeBlock.lines.join('\n'),
            id: `code-${i}`
          });
          currentCodeBlock = null;
        } else {
          // Start of code block
          const lang = line.trim().slice(3) || 'javascript';
          currentCodeBlock = { lang, lines: [] };
        }
        continue;
      }

      if (currentCodeBlock) {
        currentCodeBlock.lines.push(line);
        continue;
      }

      // Handle Tables
      if (line.trim().startsWith('|')) {
        if (!currentTable) {
          currentTable = { headers: [], rows: [], hasDivider: false };
        }

        const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (line.includes('---')) {
          currentTable.hasDivider = true;
        } else if (!currentTable.hasDivider && currentTable.headers.length === 0) {
          currentTable.headers = cols;
        } else {
          currentTable.rows.push(cols);
        }
        continue;
      } else {
        if (currentTable) {
          elements.push({
            type: 'table',
            headers: currentTable.headers,
            rows: currentTable.rows,
            id: `table-${i}`
          });
          currentTable = null;
        }
      }

      // Handle List Items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim())) {
        if (!currentList) {
          currentList = { ordered: /^\d+\.\s/.test(line.trim()), items: [] };
        }
        const cleanItem = line.trim().replace(/^(-\s|\*\s|\d+\.\s)/, '');
        currentList.items.push(cleanItem);
        continue;
      } else {
        if (currentList) {
          elements.push({
            type: 'list',
            ordered: currentList.ordered,
            items: currentList.items,
            id: `list-${i}`
          });
          currentList = null;
        }
      }

      // Handle Alerts (> [!NOTE], > [!TIP], etc)
      if (line.trim().startsWith('>')) {
        const alertMatch = line.trim().match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING)\]/i);
        if (alertMatch) {
          currentAlert = { type: alertMatch[1].toLowerCase(), lines: [] };
          continue;
        } else if (currentAlert) {
          const content = line.trim().replace(/^>\s*/, '');
          currentAlert.lines.push(content);
          continue;
        }
      } else {
        if (currentAlert) {
          elements.push({
            type: 'alert',
            alertType: currentAlert.type,
            content: currentAlert.lines.join(' '),
            id: `alert-${i}`
          });
          currentAlert = null;
        }
      }

      // Skip Empty Lines
      if (line.trim() === '') {
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push({ type: 'h1', text: line.slice(2).trim(), id: `h1-${i}` });
      } else if (line.startsWith('## ')) {
        elements.push({ type: 'h2', text: line.slice(3).trim(), id: `h2-${i}` });
      } else if (line.startsWith('### ')) {
        elements.push({ type: 'h3', text: line.slice(4).trim(), id: `h3-${i}` });
      } else {
        // Standard Paragraph
        elements.push({ type: 'p', text: line.trim(), id: `p-${i}` });
      }
    }

    // Flush any open blocks
    if (currentCodeBlock) {
      elements.push({
        type: 'code-block',
        lang: currentCodeBlock.lang,
        code: currentCodeBlock.lines.join('\n'),
        id: 'code-flush'
      });
    }
    if (currentTable) {
      elements.push({
        type: 'table',
        headers: currentTable.headers,
        rows: currentTable.rows,
        id: 'table-flush'
      });
    }
    if (currentList) {
      elements.push({
        type: 'list',
        ordered: currentList.ordered,
        items: currentList.items,
        id: 'list-flush'
      });
    }
    if (currentAlert) {
      elements.push({
        type: 'alert',
        alertType: currentAlert.type,
        content: currentAlert.lines.join(' '),
        id: 'alert-flush'
      });
    }

    return elements;
  };

  const renderInlineStyles = (text) => {
    if (!text) return '';
    
    // Replace inline code blocks
    let formatted = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
    // Replace bold text
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Replace italic text
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // Replace links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="wiki-link">$1</a>');

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const parsedElements = parseMarkdown(content);

  return (
    <div className="markdown-body">
      {parsedElements.map((el) => {
        switch (el.type) {
          case 'h1':
            return <h1 key={el.id} id={el.text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{el.text}</h1>;
          case 'h2':
            return <h2 key={el.id} id={el.text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{el.text}</h2>;
          case 'h3':
            return <h3 key={el.id} id={el.text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}>{el.text}</h3>;
          
          case 'p':
            return <p key={el.id}>{renderInlineStyles(el.text)}</p>;
          
          case 'list':
            const ListTag = el.ordered ? 'ol' : 'ul';
            return (
              <ListTag key={el.id}>
                {el.items.map((item, idx) => (
                  <li key={idx}>{renderInlineStyles(item)}</li>
                ))}
              </ListTag>
            );
          
          case 'alert':
            const alertIcons = {
              note: <Info size={16} />,
              tip: <Sparkles size={16} />,
              important: <AlertCircle size={16} />,
              warning: <AlertTriangle size={16} />
            };
            const alertLabels = {
              note: 'Nota',
              tip: 'Consejo',
              important: 'Importante',
              warning: 'Advertencia'
            };
            return (
              <div key={el.id} className={`markdown-alert markdown-alert-${el.alertType}`}>
                <div className="markdown-alert-title">
                  {alertIcons[el.alertType]}
                  <span>{alertLabels[el.alertType]}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{renderInlineStyles(el.content)}</p>
              </div>
            );

          case 'table':
            return (
              <table key={el.id}>
                <thead>
                  <tr>
                    {el.headers.map((h, idx) => <th key={idx}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {el.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((col, cIdx) => <td key={cIdx}>{renderInlineStyles(col)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            );

          case 'code-block':
            return (
              <div key={el.id} className="code-block-container animate-fade-in">
                <div className="code-block-header">
                  <span className="code-block-lang">{el.lang}</span>
                  <div className="code-block-actions">
                    {onOpenInPlayground && (
                      <button 
                        className="code-block-btn" 
                        title="Abrir en el Playground"
                        onClick={() => onOpenInPlayground(el.code)}
                      >
                        <Play size={14} style={{ color: 'var(--accent-secondary)' }} />
                      </button>
                    )}
                    <button 
                      className={`code-block-btn ${copiedId === el.id ? 'tooltip-success' : ''}`}
                      title="Copiar código"
                      onClick={() => handleCopyCode(el.code, el.id)}
                    >
                      {copiedId === el.id ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <pre>
                  <code>{el.code}</code>
                </pre>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
