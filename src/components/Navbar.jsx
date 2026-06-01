import { BookOpen, Code, PlusCircle, Bookmark, Database, Menu, Search, X } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  bookmarksCount, 
  onLogoClick, 
  onOpenDbModal, 
  onBookmarksClick,
  searchQuery,
  setSearchQuery,
  onToggleSidebar 
}) {
  return (
    <nav className="navbar" style={{
      display: 'flex',
      alignItems: 'center',
      padding: '8px 16px',
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--card-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '64px',
      gap: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
        <button 
          onClick={onToggleSidebar}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%' }} 
          className="hover-bg"
        >
          <Menu size={24} />
        </button>
        <div className="logo-container" onClick={onLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <div style={{ color: 'var(--accent-primary)', display: 'flex' }}>
            <BookOpen size={28} />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
            fUSphere
          </span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div className="search-input-container" style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px',
          padding: '0 16px',
          width: '100%',
          maxWidth: '720px',
          height: '48px',
          transition: 'background 0.2s, box-shadow 0.2s',
          border: '1px solid transparent'
        }}>
          <Search size={20} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
          <input 
            type="text" 
            placeholder="Buscar en CodeWiki" 
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', justifyContent: 'flex-end' }}>
        {bookmarksCount > 0 && (
          <button
            className={`nav-item ${activeTab === 'dashboard' && bookmarksCount > 0 ? 'active' : ''}`}
            onClick={onBookmarksClick}
            title="Marcadores"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
          >
            <Bookmark size={22} fill="var(--accent-secondary)" color="var(--accent-secondary)" />
          </button>
        )}
        
        <button
          className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
          title="Crear Repositorio"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
        >
          <PlusCircle size={22} />
        </button>

        <button
          className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
          title="Playground"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
        >
          <Code size={22} />
        </button>

        <button
          className="nav-item"
          onClick={onOpenDbModal}
          title="Base de Datos"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}
        >
          <Database size={22} />
        </button>

        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', marginLeft: '8px', fontSize: '0.9rem' }}>
          U
        </div>
      </div>
    </nav>
  );
}
