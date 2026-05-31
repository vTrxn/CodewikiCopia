import React, { useState } from 'react';
import ArticleCard from './ArticleCard';
import { Search, PlusCircle, Bookmark, Compass, RefreshCw } from 'lucide-react';

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
  setShowOnlyBookmarks
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique categories
  const categoriesList = ['Todos', 'Frontend', 'Backend', 'Estructuras de Datos', 'Algoritmos', 'Ingeniería de Software'];

  // Handle difficulties toggles
  const handleDifficultyToggle = (diff) => {
    if (difficultyFilter.includes(diff)) {
      setDifficultyFilter(difficultyFilter.filter(d => d !== diff));
    } else {
      setDifficultyFilter([...difficultyFilter, diff]);
    }
  };

  // Filter logic
  const filteredArticles = articles.filter(art => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = query === '' || 
      art.title.toLowerCase().includes(query) || 
      art.description.toLowerCase().includes(query) || 
      art.author.toLowerCase().includes(query) || 
      art.tags.some(t => t.toLowerCase().includes(query)) ||
      art.category.toLowerCase().includes(query);

    // 2. Category
    const matchesCategory = activeCategory === 'Todos' || art.category === activeCategory;

    // 3. Difficulty
    const matchesDifficulty = difficultyFilter.length === 0 || difficultyFilter.includes(art.difficulty);

    // 4. Bookmarks Only
    const matchesBookmarks = !showOnlyBookmarks || bookmarks.includes(art.id);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesBookmarks;
  });

  return (
    <div className="dashboard-container">
      {/* Background radial highlight */}
      <div className="bg-gradient-glow"></div>

      <header className="hero-section">
        <h1 className="hero-title animate-fade-in">Wiki de Programación Uniempresarial</h1>
        <p className="hero-subtitle animate-fade-in" style={{ animationDelay: '0.1s' }}>
          La plataforma colaborativa de desarrollo de software. Aprende, comparte artículos de código, realiza pruebas en el playground interactivo y estudia con nuestro tutor inteligente.
        </p>
        
        <div className="search-bar-wrapper animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="search-input-container">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por tema, etiqueta, categoría, autor..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginRight: '10px' }}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Categories Horizontal Scroller / Pills */}
      <section className="category-pills animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {categoriesList.map((cat) => (
          <button
            key={cat}
            className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat);
              setShowOnlyBookmarks(false); // Reset bookmarks toggle
            }}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Filters Toolbar */}
      <section className="difficulty-filters animate-fade-in" style={{ animationDelay: '0.25s' }}>
        <span className="difficulty-label">Filtrar Dificultad:</span>
        {['Principiante', 'Intermedio', 'Avanzado'].map((diff) => (
          <span 
            key={diff}
            className={`difficulty-checkbox-btn ${diff} ${difficultyFilter.includes(diff) ? 'active' : ''}`}
            onClick={() => handleDifficultyToggle(diff)}
          >
            {diff}
          </span>
        ))}

        <div style={{ width: '1px', height: '20px', background: 'var(--card-border)', margin: '0 8px' }}></div>

        <button 
          className={`btn ${showOnlyBookmarks ? 'btn-accent' : 'btn-secondary'}`}
          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          onClick={() => {
            setShowOnlyBookmarks(!showOnlyBookmarks);
            setActiveCategory('Todos'); // Reset categories
          }}
        >
          <Bookmark size={14} fill={showOnlyBookmarks ? 'currentColor' : 'none'} />
          <span>{showOnlyBookmarks ? 'Viendo Guardados' : 'Ver Guardados'}</span>
        </button>

        <button 
          className="btn btn-primary"
          style={{ padding: '6px 12px', fontSize: '0.85rem', marginLeft: 'auto' }}
          onClick={onAddNewArticle}
        >
          <PlusCircle size={14} />
          <span>Crear Nuevo Artículo</span>
        </button>
      </section>

      {/* Articles Rendering */}
      {filteredArticles.length === 0 ? (
        <div 
          className="glass-panel animate-fade-in" 
          style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          <Compass size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            No se encontraron artículos
          </h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 20px' }}>
            Prueba ajustando los filtros de búsqueda, categorías, dificultad o crea uno nuevo para poblar la plataforma.
          </p>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('Todos');
              setDifficultyFilter([]);
              setShowOnlyBookmarks(false);
            }}
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
            <span>Restablecer Filtros</span>
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
  );
}
