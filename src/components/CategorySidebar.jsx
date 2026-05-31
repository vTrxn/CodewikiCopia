import React from 'react';
import { ChevronRight, Folder, Home, ArrowLeft } from 'lucide-react';

export default function CategorySidebar({ articles, activeArticleId, onSelectArticle, onBackToDashboard }) {
  // Group articles by category
  const categories = {};
  articles.forEach(art => {
    if (!categories[art.category]) {
      categories[art.category] = [];
    }
    categories[art.category].push(art);
  });

  return (
    <div className="sidebar-nav">
      <button 
        className="btn btn-secondary" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}
        onClick={onBackToDashboard}
      >
        <ArrowLeft size={16} />
        <span>Volver al Inicio</span>
      </button>

      <span className="sidebar-title">Estructura del Curso</span>
      
      {Object.keys(categories).map((catName) => (
        <div key={catName} className="sidebar-group animate-fade-in">
          <h4 className="sidebar-group-title">
            <Folder size={14} style={{ color: 'var(--accent-secondary)' }} />
            <span>{catName}</span>
          </h4>
          <ul className="sidebar-list">
            {categories[catName].map((art) => (
              <li 
                key={art.id} 
                className={`sidebar-item ${activeArticleId === art.id ? 'active' : ''}`}
                onClick={() => onSelectArticle(art)}
                title={art.title}
              >
                {art.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
