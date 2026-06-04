import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ArticleViewer from './components/ArticleViewer';
import MarkdownEditor from './components/MarkdownEditor';
import CodePlayground from './components/CodePlayground';
import ChatbotPanel from './components/ChatbotPanel';
import ProjectAnalyzer from './components/ProjectAnalyzer';
import initialData from './data/initialData.json';
import { MessageSquare, Database, Download, Upload, RefreshCw, X } from 'lucide-react';
import './App.css';

export default function App() {
  const [articles, setArticles] = useState(() => {
    // Sync Repositories
    const savedRepos = localStorage.getItem('fusoft_repos');
    if (savedRepos) {
      try {
        const parsedSaved = JSON.parse(savedRepos);
        
        // Smart Sync:
        // 1. Keep all user-created or user-edited repos (where isUserOwned is true)
        const userRepos = parsedSaved.filter(art => art.isUserOwned);
        const userRepoIds = new Set(userRepos.map(art => art.id));
        
        // 2. Load latest official seeds from initialData
        // (if a user has modified a seed and it has isUserOwned, we respect their version)
        const activeSeeds = initialData.filter(seed => !userRepoIds.has(seed.id));
        
        const merged = [...userRepos, ...activeSeeds];
        localStorage.setItem('fusoft_repos', JSON.stringify(merged));
        return merged;
      } catch (e) {
        console.error('Error parsing fusoft_repos from localStorage, resetting to initialData', e);
        localStorage.setItem('fusoft_repos', JSON.stringify(initialData));
        return initialData;
      }
    } else {
      localStorage.setItem('fusoft_repos', JSON.stringify(initialData));
      return initialData;
    }
  });

  const [bookmarks, setBookmarks] = useState(() => {
    // Sync Bookmarks
    const savedBookmarks = localStorage.getItem('fusoft_bookmarks');
    if (savedBookmarks) {
      try {
        return JSON.parse(savedBookmarks);
      } catch (e) {
        console.error('Error parsing fusoft_bookmarks from localStorage', e);
        return [];
      }
    } else {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'viewer', 'editor', 'playground'
  const [previousTab, setPreviousTab] = useState('dashboard');
  const [activeArticle, setActiveArticle] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fusoft_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fusoft_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Keep search/filter states synced when returning to Dashboard
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [difficultyFilter, setDifficultyFilter] = useState([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  // 2. Bookmark Toggle Handler
  const handleToggleBookmark = (id) => {
    let updatedBookmarks;
    if (bookmarks.includes(id)) {
      updatedBookmarks = bookmarks.filter(bId => bId !== id);
    } else {
      updatedBookmarks = [...bookmarks, id];
    }
    setBookmarks(updatedBookmarks);
    localStorage.setItem('fusoft_bookmarks', JSON.stringify(updatedBookmarks));
  };

  // 3. Save/Update Article Handler
  const handleSaveArticle = (savedArticle) => {
    let updatedArticles;
    const exists = articles.some(art => art.id === savedArticle.id);

    if (exists) {
      // Security Check: Enforce that user cannot edit non-owned repos
      const existing = articles.find(art => art.id === savedArticle.id);
      if (existing && !existing.isUserOwned) {
        // Permitir guardar si el cambio es exclusivamente en el análisis de IA (aiAnalysis)
        const hasOtherChanges = 
          existing.title !== savedArticle.title ||
          existing.description !== savedArticle.description ||
          existing.category !== savedArticle.category ||
          existing.difficulty !== savedArticle.difficulty ||
          existing.content !== savedArticle.content ||
          existing.playgroundCode !== savedArticle.playgroundCode ||
          existing.author !== savedArticle.author;

        if (hasOtherChanges) {
          alert('No tienes permisos para modificar el contenido principal de este repositorio.');
          return;
        }
      }
      // Edit existing
      updatedArticles = articles.map(art => 
        art.id === savedArticle.id ? savedArticle : art
      );
    } else {
      // Create new
      updatedArticles = [savedArticle, ...articles];
    }

    setArticles(updatedArticles);
    localStorage.setItem('fusoft_repos', JSON.stringify(updatedArticles));
    
    // Auto redirect to viewing the newly created/saved article
    setActiveArticle(savedArticle);
    setEditingArticle(null);
    setActiveTab('viewer');
  };

  // 4. Open Article Helper
  const handleSelectArticle = (article) => {
    setActiveArticle(article);
    setActiveTab('viewer');
  };

  // 5. Code Playground Launcher Helper
  const handleOpenInPlayground = (codeSnippet) => {
    setPlaygroundCode(codeSnippet);
    setActiveTab('playground');
  };

  // 6. Navigation Helpers
  const handleLogoClick = () => {
    setActiveTab('dashboard');
    setActiveCategory('Todos');
    setDifficultyFilter([]);
    setShowOnlyBookmarks(false);
    setSearchQuery('');
  };

  // 7. Delete Article Helper
  const handleDeleteArticle = (id) => {
    const target = articles.find(art => art.id === id);
    if (target && !target.isUserOwned) {
      alert('No puedes eliminar repositorios que no sean de tu propiedad.');
      return;
    }
    const updatedArticles = articles.filter(art => art.id !== id);
    setArticles(updatedArticles);
    localStorage.setItem('fusoft_repos', JSON.stringify(updatedArticles));
    
    // Clean from bookmarks
    if (bookmarks.includes(id)) {
      const updatedBookmarks = bookmarks.filter(bId => bId !== id);
      setBookmarks(updatedBookmarks);
      localStorage.setItem('fusoft_bookmarks', JSON.stringify(updatedBookmarks));
    }

    alert('Repositorio eliminado exitosamente.');
    setActiveTab('dashboard');
  };

  // 8. Database Handlers
  const handleExportDatabase = () => {
    // Export full state including bookmarks
    const backupState = {
      articles,
      bookmarks
    };
    const blob = new Blob([JSON.stringify(backupState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fusoft-workspace-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDatabase = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        
        // Scenario 1: Full workspace state backup (articles + bookmarks)
        if (imported && typeof imported === 'object' && !Array.isArray(imported) && imported.articles) {
          const importedArticles = imported.articles;
          const importedBookmarks = imported.bookmarks || [];
          if (Array.isArray(importedArticles) && importedArticles.every(art => art.title && art.content)) {
            setArticles(importedArticles);
            localStorage.setItem('fusoft_repos', JSON.stringify(importedArticles));
            setBookmarks(importedBookmarks);
            localStorage.setItem('fusoft_bookmarks', JSON.stringify(importedBookmarks));
            
            alert(`¡Copia de seguridad importada con éxito! Se cargaron ${importedArticles.length} repositorios y ${importedBookmarks.length} marcadores.`);
            setIsDbModalOpen(false);
            setActiveTab('dashboard');
          } else {
            alert('Formato de copia de seguridad inválido. Estructura de repositorios incorrecta.');
          }
        }
        // Scenario 2: Simple array of articles (e.g. initialData format)
        else if (Array.isArray(imported) && imported.every(art => art.title && art.content)) {
          setArticles(imported);
          localStorage.setItem('fusoft_repos', JSON.stringify(imported));
          alert(`¡Catálogo de repositorios importado con éxito! Se cargaron ${imported.length} repositorios.`);
          setIsDbModalOpen(false);
          setActiveTab('dashboard');
        } else {
          alert('Formato de base de datos inválido. Debe ser una copia de seguridad o un catálogo válido.');
        }
      } catch {
        alert('Error al leer el archivo JSON. Verifica que esté bien formateado.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDatabase = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer la base de datos a sus valores iniciales? Se perderán todas tus modificaciones.')) {
      setArticles(initialData);
      localStorage.setItem('fusoft_repos', JSON.stringify(initialData));
      setBookmarks([]);
      localStorage.setItem('fusoft_bookmarks', JSON.stringify([]));
      alert('Catálogo de repositorios restablecido a los valores por defecto.');
      setIsDbModalOpen(false);
      setActiveTab('dashboard');
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([JSON.stringify(initialData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fusphere-template-db.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          if (activeTab === tab) {
            // Restore previous tab if clicking the same button
            setActiveTab(previousTab);
            if (previousTab === 'dashboard') {
              setShowOnlyBookmarks(false);
            }
          } else {
            // Store previous and set new
            setPreviousTab(activeTab);
            setActiveTab(tab);
            if (tab === 'editor') {
              setEditingArticle(null); // Clear editing states on manual "Create" click
            }
            if (tab === 'dashboard') {
              setShowOnlyBookmarks(false); // Reset bookmarks view
            }
          }
        }}
        bookmarksCount={bookmarks.length}
        isBookmarksActive={showOnlyBookmarks}
        onLogoClick={handleLogoClick}
        isDbModalOpen={isDbModalOpen}
        onToggleDbModal={() => setIsDbModalOpen(!isDbModalOpen)}
        onBookmarksClick={() => {
          if (activeTab === 'dashboard' && showOnlyBookmarks) {
             // Toggle off bookmarks
             setShowOnlyBookmarks(false);
          } else {
            if (activeTab !== 'dashboard') {
              setPreviousTab(activeTab);
            }
            setActiveTab('dashboard');
            setShowOnlyBookmarks(true);
          }
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            articles={articles}
            onSelectArticle={handleSelectArticle}
            onAddNewArticle={() => {
              setEditingArticle(null);
              setActiveTab('editor');
            }}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            difficultyFilter={difficultyFilter}
            setDifficultyFilter={setDifficultyFilter}
            showOnlyBookmarks={showOnlyBookmarks}
            setShowOnlyBookmarks={setShowOnlyBookmarks}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSidebarOpen={isSidebarOpen}
          />
        )}

        {activeTab === 'viewer' && activeArticle && (
          <ArticleViewer 
            articles={articles}
            activeArticle={activeArticle}
            onSelectArticle={handleSelectArticle}
            onBackToDashboard={() => setActiveTab('dashboard')}
            isBookmarked={bookmarks.includes(activeArticle.id)}
            onToggleBookmark={handleToggleBookmark}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            onEditArticle={() => {
              if (activeArticle && !activeArticle.isUserOwned) {
                alert('No puedes editar repositorios que no sean de tu propiedad.');
                return;
              }
              setEditingArticle(activeArticle);
              setActiveTab('editor');
            }}
            onOpenInPlayground={handleOpenInPlayground}
            onDeleteArticle={handleDeleteArticle}
            onSaveArticle={handleSaveArticle}
          />
        )}

        {activeTab === 'editor' && (
          <MarkdownEditor 
            key={editingArticle?.id || 'new'}
            existingArticle={editingArticle}
            onSave={handleSaveArticle}
            onCancel={() => {
              if (editingArticle) {
                setActiveTab('viewer');
              } else {
                setActiveTab('dashboard');
              }
              setEditingArticle(null);
            }}
          />
        )}

        {activeTab === 'playground' && (
          <CodePlayground 
            key={playgroundCode || 'default'}
            initialCode={playgroundCode}
            onBackToArticle={activeArticle ? () => setActiveTab('viewer') : null}
          />
        )}

        {activeTab === 'analyzer' && (
          <ProjectAnalyzer 
            onSaveArticle={handleSaveArticle}
            onOpenInPlayground={handleOpenInPlayground}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}
      </main>



      {/* Database Management Modal */}
      {isDbModalOpen && (
        <div className="db-modal-overlay animate-fade-in" onClick={() => setIsDbModalOpen(false)}>
          <div className="db-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="db-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="logo-icon" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)', padding: '6px', borderRadius: '8px' }}>
                  <Database size={20} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>Gestión de Base de Datos</h3>
              </div>
              <button onClick={() => setIsDbModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="db-modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
                fUSphere almacena los repositorios localmente en tu navegador. Desde aquí puedes descargar una copia de seguridad o importar un catálogo de prueba para restaurar el contenido de la plataforma.
              </p>

              <div className="db-action-cards">
                <div className="db-action-card" onClick={handleExportDatabase}>
                  <div className="db-action-icon-wrapper" style={{ color: 'var(--accent-secondary)' }}>
                    <Download size={22} />
                  </div>
                  <div>
                    <h4>Exportar Base de Datos</h4>
                    <p>Descarga todos los repositorios actuales en formato JSON (fusoft-repos.json) para conservarlos.</p>
                  </div>
                </div>

                <div className="db-action-card" style={{ position: 'relative' }}>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportDatabase}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <div className="db-action-icon-wrapper" style={{ color: '#10b981' }}>
                    <Upload size={22} />
                  </div>
                  <div>
                    <h4>Importar Base de Datos</h4>
                    <p>Sube un archivo JSON para reemplazar la base de datos actual con tus propios repositorios.</p>
                  </div>
                </div>

                <div className="db-action-card" onClick={handleDownloadTemplate}>
                  <div className="db-action-icon-wrapper" style={{ color: '#a5b4fc' }}>
                    <Download size={22} />
                  </div>
                  <div>
                    <h4>Descargar Base de Datos Base</h4>
                    <p>Descarga el catálogo de repositorios original (plantilla preestablecida) lista para tu GitHub.</p>
                  </div>
                </div>

                <div className="db-action-card" onClick={handleResetDatabase} style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <div className="db-action-icon-wrapper" style={{ color: '#ef4444' }}>
                    <RefreshCw size={22} />
                  </div>
                  <div>
                    <h4>Restablecer Fábrica</h4>
                    <p>Limpia todas tus ediciones locales y restaura los repositorios iniciales de fUSphere.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
