import ArticleCard from './ArticleCard';
import { PlusCircle, Compass, RefreshCw, ChevronRight } from 'lucide-react';

export default function Dashboard({ 
  articles, 
  onSelectArticle, 
  onAddNewArticle, 
  bookmarks, 
  onToggleBookmark,
  activeCategory,
  setActiveCategory,
  difficultyFilter,
  setDifficultyFilter,
  showOnlyBookmarks,
  setShowOnlyBookmarks,
  searchQuery,
  setSearchQuery,
  isSidebarOpen
}) {

  // Filter logic
  const filteredArticles = articles.filter(art => {
    const query = searchQuery ? searchQuery.toLowerCase().trim() : '';
    const matchesSearch = query === '' || 
      art.title.toLowerCase().includes(query) || 
      art.description.toLowerCase().includes(query) || 
      art.author.toLowerCase().includes(query) || 
      art.tags.some(t => t.toLowerCase().includes(query)) ||
      art.category.toLowerCase().includes(query);

    const matchesCategory = activeCategory === 'Todos' || art.category === activeCategory;
    const matchesDifficulty = difficultyFilter.length === 0 || difficultyFilter.includes(art.difficulty);
    const matchesBookmarks = !showOnlyBookmarks || bookmarks.includes(art.id);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesBookmarks;
  });

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
      {/* Left Sidebar Menu (Overlay Drawer) */}
      <div style={{ 
        width: '280px', 
        borderRight: '1px solid var(--card-border)',
        background: 'var(--bg-primary)',
        overflowY: 'auto',
        transition: 'left 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: isSidebarOpen ? '0' : '-280px',
        zIndex: 50,
        boxShadow: isSidebarOpen ? '4px 0 15px rgba(0,0,0,0.1)' : 'none'
      }}>
        <div style={{ padding: '24px 16px' }}>
           <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.5px' }}>
              Explorar CodeWiki
           </h4>
           <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0, padding: 0 }}>
              <li 
                onClick={() => { setActiveCategory('Todos'); setShowOnlyBookmarks(false); }}
                style={{ padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', background: activeCategory === 'Todos' && !showOnlyBookmarks ? 'var(--accent-primary-glow)' : 'transparent', color: activeCategory === 'Todos' && !showOnlyBookmarks ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: activeCategory === 'Todos' && !showOnlyBookmarks ? 500 : 400, fontSize: '0.95rem' }}
              >
                Todos los repositorios
              </li>
              <li 
                onClick={() => { setShowOnlyBookmarks(true); setActiveCategory('Todos'); }}
                style={{ padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', background: showOnlyBookmarks ? 'var(--accent-primary-glow)' : 'transparent', color: showOnlyBookmarks ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: showOnlyBookmarks ? 500 : 400, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Marcadores</span>
                {bookmarks.length > 0 && <span style={{ background: 'var(--card-border)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{bookmarks.length}</span>}
              </li>
           </ul>
           
           <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '32px', marginBottom: '16px', letterSpacing: '0.5px' }}>
              Categorías
           </h4>
           <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', margin: 0, padding: 0 }}>
              {['Frontend', 'Backend', 'Estructuras de Datos', 'Algoritmos', 'Ingeniería de Software'].map(cat => (
                <li 
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setShowOnlyBookmarks(false); }}
                  style={{ padding: '10px 16px', borderRadius: '4px', cursor: 'pointer', background: activeCategory === cat && !showOnlyBookmarks ? 'var(--accent-primary-glow)' : 'transparent', color: activeCategory === cat && !showOnlyBookmarks ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: activeCategory === cat && !showOnlyBookmarks ? 500 : 400, fontSize: '0.95rem' }}
                >
                  {cat}
                </li>
              ))}
           </ul>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '40px', background: 'var(--bg-secondary)', paddingLeft: '40px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          {/* Breadcrumb / Title */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
              <span>CodeWiki</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {showOnlyBookmarks ? 'Marcadores' : activeCategory}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {showOnlyBookmarks ? 'Tus Marcadores' : (activeCategory === 'Todos' ? 'Bienvenido a CodeWiki' : activeCategory)}
            </h1>
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Dificultad:</span>
              {['Principiante', 'Intermedio', 'Avanzado'].map((diff) => (
                <span 
                  key={diff}
                  onClick={() => {
                    if (difficultyFilter.includes(diff)) {
                      setDifficultyFilter(difficultyFilter.filter(d => d !== diff));
                    } else {
                      setDifficultyFilter([...difficultyFilter, diff]);
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: difficultyFilter.includes(diff) ? 'var(--accent-primary)' : 'var(--card-border)',
                    background: difficultyFilter.includes(diff) ? 'var(--accent-primary-glow)' : 'var(--bg-primary)',
                    color: difficultyFilter.includes(diff) ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    transition: 'all 0.2s',
                    fontWeight: difficultyFilter.includes(diff) ? 500 : 400
                  }}
                >
                  {diff}
                </span>
              ))}
            </div>

            <button 
              onClick={onAddNewArticle}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px',
                background: 'var(--accent-primary)', color: '#fff', borderRadius: '24px',
                border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)'
              }}
            >
              <PlusCircle size={18} />
              Nuevo Repositorio
            </button>
          </div>

          {/* Article List */}
          {filteredArticles.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
              <Compass size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', margin: '0 auto' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 500 }}>
                No se encontraron resultados
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
                No hay repositorios que coincidan con los filtros actuales o la búsqueda.
              </p>
              <button 
                onClick={() => {
                  if(setSearchQuery) setSearchQuery('');
                  setActiveCategory('Todos');
                  setDifficultyFilter([]);
                  setShowOnlyBookmarks(false);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                  background: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-primary)',
                  borderRadius: '4px', cursor: 'pointer', fontWeight: 500
                }}
              >
                <RefreshCw size={16} />
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="articles-grid">
              {filteredArticles.map((art) => (
                <ArticleCard 
                  key={art.id} 
                  article={art} 
                  onClick={() => onSelectArticle(art)}
                  isBookmarked={bookmarks.includes(art.id)}
                  onToggleBookmark={onToggleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
