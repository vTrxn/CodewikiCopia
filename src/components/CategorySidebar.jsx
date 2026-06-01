import { useState } from 'react';
import { ChevronRight, Folder, ArrowLeft, X } from 'lucide-react';

export default function CategorySidebar({ articles, activeArticleId, onSelectArticle, onBackToDashboard, isOpen, onClose }) {
  // Group articles by category
  const categories = {};
  articles.forEach(art => {
    if (!categories[art.category]) {
      categories[art.category] = [];
    }
    categories[art.category].push(art);
  });

  // Keep track of expanded categories
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const activeArt = articles.find(art => art.id === activeArticleId);
    const activeCat = activeArt ? activeArt.category : '';
    const state = {};
    Object.keys(categories).forEach(cat => {
      state[cat] = cat === activeCat;
    });
    // If no category is expanded, expand the first one by default
    const hasExpanded = Object.values(state).some(val => val === true);
    if (!hasExpanded && Object.keys(categories).length > 0) {
      state[Object.keys(categories)[0]] = true;
    }
    return state;
  });

  // Adjust state when activeArticleId prop changes (React state-from-prop pattern)
  const [prevActiveId, setPrevActiveId] = useState(activeArticleId);
  if (activeArticleId !== prevActiveId) {
    setPrevActiveId(activeArticleId);
    const activeArt = articles.find(art => art.id === activeArticleId);
    if (activeArt) {
      setExpandedCategories(prev => ({
        ...prev,
        [activeArt.category]: true
      }));
    }
  }

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  return (
    <div className={`sidebar-nav ${isOpen ? 'open' : ''}`}>
      {/* Mobile Drawer Header */}
      <div className="sidebar-mobile-header" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <span className="sidebar-title" style={{ margin: 0 }}>Menú del Curso</span>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={20} />
        </button>
      </div>

      <button 
        className="btn btn-secondary animate-fade-in" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center', width: '100%' }}
        onClick={onBackToDashboard}
      >
        <ArrowLeft size={16} />
        <span>Volver al Inicio</span>
      </button>

      <span className="sidebar-title animate-fade-in">Estructura del Curso</span>
      
      {Object.keys(categories).map((catName) => {
        const isExpanded = !!expandedCategories[catName];
        return (
          <div key={catName} className="sidebar-group animate-fade-in">
            <h4 
              className="sidebar-group-title" 
              onClick={() => toggleCategory(catName)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Folder size={14} style={{ color: isExpanded ? 'var(--accent-secondary)' : 'var(--text-muted)', transition: 'color var(--transition-fast)' }} />
                <span>{catName}</span>
              </div>
              <ChevronRight 
                size={14} 
                style={{ 
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
                  transition: 'transform var(--transition-normal)',
                  color: 'var(--text-muted)'
                }} 
              />
            </h4>
            
            <div 
              style={{ 
                maxHeight: isExpanded ? '500px' : '0px', 
                overflow: 'hidden', 
                transition: 'max-height var(--transition-normal) ease-in-out' 
              }}
            >
              <ul className="sidebar-list" style={{ marginTop: '8px', paddingLeft: '8px' }}>
                {categories[catName].map((art) => (
                  <li 
                    key={art.id} 
                    className={`sidebar-item ${activeArticleId === art.id ? 'active' : ''}`}
                    onClick={() => {
                      onSelectArticle(art);
                      if (onClose) onClose(); // Auto-close drawer on selection for mobile view
                    }}
                    title={art.title}
                  >
                    {art.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </div>
  );
}
