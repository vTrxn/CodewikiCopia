import { Calendar, User, Bookmark } from 'lucide-react';

export default function ArticleCard({ article, onClick, isBookmarked, onToggleBookmark }) {
  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    onToggleBookmark(article.id);
  };

  return (
    <div className="article-card animate-fade-in" onClick={onClick}>
      <div className="article-meta-row">
        <span className="category-tag">{article.category}</span>
        <span className={`difficulty-badge ${article.difficulty}`}>
          {article.difficulty}
        </span>
      </div>

      <h3 className="card-title">{article.title}</h3>
      <p className="card-desc">{article.description}</p>

      <div className="card-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={12} />
          <span>{article.author}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleBookmarkClick}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isBookmarked ? 'var(--accent-secondary)' : 'var(--text-muted)' }}
          >
            <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            <span>{article.lastUpdated}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
