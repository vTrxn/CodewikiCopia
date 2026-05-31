import React from 'react';
import { BookOpen, Code, FileCode, PlusCircle, Bookmark } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, bookmarksCount, onLogoClick }) {
  return (
    <nav className="navbar">
      <div className="logo-container" onClick={onLogoClick}>
        <div className="logo-icon">
          <BookOpen size={24} />
        </div>
        <span className="logo-text">fUSphere</span>
      </div>

      <div className="nav-links">
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BookOpen size={18} />
          <span>Inicio</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          <PlusCircle size={18} />
          <span>Crear Artículo</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
        >
          <Code size={18} />
          <span>Playground</span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {bookmarksCount > 0 && (
          <div 
            className="nav-item active" 
            style={{ cursor: 'pointer', borderRadius: '30px', padding: '6px 14px' }}
            onClick={() => setActiveTab('dashboard')} // Triggers display of bookmarks
          >
            <Bookmark size={16} fill="currentColor" />
            <span>Marcadores ({bookmarksCount})</span>
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <span>Uniempresarial</span>
        </div>
      </div>
    </nav>
  );
}
