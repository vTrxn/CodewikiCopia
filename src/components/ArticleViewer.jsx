import React from 'react';
import CategorySidebar from './CategorySidebar';
import MarkdownRenderer from './MarkdownRenderer';
import { Calendar, User, Bookmark, Edit3, Clock, Tag } from 'lucide-react';

export default function ArticleViewer({ 
  articles, 
  activeArticle, 
  onSelectArticle, 
  onBackToDashboard, 
  isBookmarked, 
  onToggleBookmark,
  onEditArticle,
  onOpenInPlayground
}) {
  if (!activeArticle) return null;

  // Extract headings for table of contents
  const getHeadings = (content) => {
    if (!content) return [];
    const lines = content.split('\n');
    const headings = [];
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        headings.push({ level: 1, text: line.slice(2).trim() });
      } else if (line.startsWith('## ')) {
        headings.push({ level: 2, text: line.slice(3).trim() });
      }
    });
    return headings;
  };

  const headings = getHeadings(activeArticle.content);

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="viewer-layout">
      <CategorySidebar 
        articles={articles}
        activeArticleId={activeArticle.id}
        onSelectArticle={onSelectArticle}
        onBackToDashboard={onBackToDashboard}
      />

      <div className="viewer-content-container animate-fade-in">
        <div className="viewer-article-body">
          <div className="viewer-header-meta">
            <span className={`difficulty-badge ${activeArticle.difficulty}`}>
              {activeArticle.difficulty}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} />
              <span>{activeArticle.author}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} />
              <span>{activeArticle.lastUpdated}</span>
            </div>
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                onClick={() => onToggleBookmark(activeArticle.id)}
              >
                <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} style={{ color: isBookmarked ? 'var(--accent-secondary)' : 'inherit' }} />
                <span>{isBookmarked ? 'Guardado' : 'Guardar'}</span>
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                onClick={onEditArticle}
              >
                <Edit3 size={14} />
                <span>Editar</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer 
            content={activeArticle.content} 
            onOpenInPlayground={onOpenInPlayground} 
          />

          <div style={{ marginTop: '40px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Tag size={14} style={{ color: 'var(--text-muted)' }} />
              {activeArticle.tags.map(tag => (
                <span 
                  key={tag} 
                  style={{ background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {headings.length > 0 && (
          <div className="outline-column animate-fade-in">
            <span className="outline-title">En esta página</span>
            <ul className="outline-list">
              {headings.map((h, idx) => {
                const cleanId = h.text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                return (
                  <li 
                    key={idx} 
                    className={`outline-item ${h.level === 1 ? 'h1' : 'h2'}`}
                    onClick={() => scrollToHeading(cleanId)}
                  >
                    {h.text}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
