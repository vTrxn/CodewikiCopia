import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ArticleViewer from './components/ArticleViewer';
import MarkdownEditor from './components/MarkdownEditor';
import CodePlayground from './components/CodePlayground';
import ChatbotPanel from './components/ChatbotPanel';
import initialData from './data/initialData.json';
import { MessageSquare } from 'lucide-react';
import './App.css';

export default function App() {
  const [articles, setArticles] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'viewer', 'editor', 'playground'
  const [activeArticle, setActiveArticle] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  // Keep search/filter states synced when returning to Dashboard
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [difficultyFilter, setDifficultyFilter] = useState([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  // 1. Initial State Initialization from LocalStorage or Seed JSON
  useEffect(() => {
    // Sync Articles
    const savedArticles = localStorage.getItem('wiki_articles');
    if (savedArticles) {
      try {
        setArticles(JSON.parse(savedArticles));
      } catch (e) {
        console.error('Error parsing wiki_articles from localStorage, resetting to initialData', e);
        setArticles(initialData);
        localStorage.setItem('wiki_articles', JSON.stringify(initialData));
      }
    } else {
      setArticles(initialData);
      localStorage.setItem('wiki_articles', JSON.stringify(initialData));
    }

    // Sync Bookmarks
    const savedBookmarks = localStorage.getItem('wiki_bookmarks');
    if (savedBookmarks) {
      try {
        setBookmarks(JSON.parse(savedBookmarks));
      } catch (e) {
        console.error('Error parsing wiki_bookmarks from localStorage', e);
        setBookmarks([]);
      }
    } else {
      setBookmarks([]);
    }
  }, []);

  // 2. Bookmark Toggle Handler
  const handleToggleBookmark = (id) => {
    let updatedBookmarks;
    if (bookmarks.includes(id)) {
      updatedBookmarks = bookmarks.filter(bId => bId !== id);
    } else {
      updatedBookmarks = [...bookmarks, id];
    }
    setBookmarks(updatedBookmarks);
    localStorage.setItem('wiki_bookmarks', JSON.stringify(updatedBookmarks));
  };

  // 3. Save/Update Article Handler
  const handleSaveArticle = (savedArticle) => {
    let updatedArticles;
    const exists = articles.some(art => art.id === savedArticle.id);

    if (exists) {
      // Edit existing
      updatedArticles = articles.map(art => 
        art.id === savedArticle.id ? savedArticle : art
      );
    } else {
      // Create new
      updatedArticles = [savedArticle, ...articles];
    }

    setArticles(updatedArticles);
    localStorage.setItem('wiki_articles', JSON.stringify(updatedArticles));
    
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
  };

  return (
    <>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'editor') {
            setEditingArticle(null); // Clear editing states on manual "Create" click
          }
          if (tab === 'dashboard') {
            setShowOnlyBookmarks(false); // Reset bookmarks view
          }
        }} 
        bookmarksCount={bookmarks.length}
        onLogoClick={handleLogoClick}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            onEditArticle={() => {
              setEditingArticle(activeArticle);
              setActiveTab('editor');
            }}
            onOpenInPlayground={handleOpenInPlayground}
          />
        )}

        {activeTab === 'editor' && (
          <MarkdownEditor 
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
            initialCode={playgroundCode}
          />
        )}
      </main>

      {/* Floating AI Coding Tutor Toggle */}
      <button 
        className="chatbot-trigger-btn animate-fade-in"
        onClick={() => setIsChatbotOpen(true)}
        title="Preguntar al Tutor AI"
      >
        <MessageSquare size={26} />
      </button>

      {/* Slide-out Tutor Panel Overlay */}
      <ChatbotPanel 
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        articles={articles}
        onOpenArticle={handleSelectArticle}
        onOpenInPlayground={handleOpenInPlayground}
      />
    </>
  );
}
