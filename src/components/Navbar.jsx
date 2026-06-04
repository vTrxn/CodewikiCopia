import { useState } from 'react';
import { BookOpen, Code, PlusCircle, Bookmark, Database, Menu, Search, X, Sun, Moon, LogOut, Settings, User, UploadCloud } from 'lucide-react';

export default function Navbar({
  activeTab, 
  setActiveTab, 
  bookmarksCount, 
  isBookmarksActive,
  onLogoClick, 
  isDbModalOpen,
  onToggleDbModal, 
  onBookmarksClick,
  searchQuery,
  setSearchQuery,
  onToggleSidebar,
  theme,
  onToggleTheme
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

        <div className="logo-container" onClick={onLogoClick} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <img 
            src="/fUSoft_isotipo.png" 
            alt="fUSoft Isotipo" 
            style={{ 
              height: '32px', 
              width: 'auto', 
              objectFit: 'contain',
              filter: theme === 'dark' ? 'brightness(1.5) drop-shadow(0 0 4px rgba(255,255,255,0.2))' : 'none',
              transition: 'all 0.3s ease'
            }} 
          />
          <span style={{ 
            fontFamily: 'var(--font-heading)', 
            fontWeight: 800, 
            fontSize: '1.4rem', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            transition: 'color var(--transition-fast)'
          }}>
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
            placeholder="Buscar en fUSphere" 
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
            className={`nav-item ${isBookmarksActive ? 'active' : ''}`}
            onClick={onBookmarksClick}
            title="Marcadores"
          >
            <Bookmark size={22} fill={isBookmarksActive ? "currentColor" : "none"} />
          </button>
        )}
        
        <button
          className={`nav-item ${activeTab === 'analyzer' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyzer')}
          title="Analizador de Proyectos"
        >
          <UploadCloud size={22} />
        </button>

        <button
          className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
          title="Crear Repositorio"
        >
          <PlusCircle size={22} />
        </button>

        <button
          className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
          onClick={() => setActiveTab('playground')}
          title="Playground"
        >
          <Code size={22} />
        </button>

        <button
          className={`nav-item ${isDbModalOpen ? 'active' : ''}`}
          onClick={onToggleDbModal}
          title="Base de Datos"
        >
          <Database size={22} />
        </button>

        <button
          className="nav-item"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
          {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        <div style={{ position: 'relative', marginLeft: '8px' }}>
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{ 
              width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '500', fontSize: '0.9rem', cursor: 'pointer' 
            }}
          >
            U
          </div>
          
          {isUserMenuOpen && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '200px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Usuario Local</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>usuario@uniempresarial.edu.co</div>
                </div>
                <div style={{ padding: '8px' }}>
                  <button className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <User size={16} />
                    <span>Mi Perfil</span>
                  </button>
                  <button className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                    <Settings size={16} />
                    <span>Configuración</span>
                  </button>
                  <div style={{ height: '1px', background: 'var(--card-border)', margin: '4px 0' }} />
                  <button className="dropdown-item" onClick={() => setIsUserMenuOpen(false)} style={{ color: 'var(--accent-secondary)' }}>
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
