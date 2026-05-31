import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { Save, X, Eye, Edit, Tag, BookOpen } from 'lucide-react';

export default function MarkdownEditor({ existingArticle, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Frontend');
  const [difficulty, setDifficulty] = useState('Principiante');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [previewMode, setPreviewMode] = useState(false); // Mobile toggle or split-screen toggle

  // Seed default templates if creating new
  const defaultTemplate = `# Título de tu Artículo

Escribe una introducción para tu tema aquí.

## Subtítulo 1

Aquí puedes añadir texto descriptivo.

\`\`\`javascript
// Añade un bloque de código interactivo
const mensaje = "¡Hola fUSphere!";
console.log(mensaje);
\`\`\`

> [!NOTE]
> Este es un bloque de nota informativa. Puedes usar [!TIP], [!IMPORTANT], o [!WARNING] también.

## Subtítulo 2

- Lista de conceptos clave
- Concepto 2`;

  const defaultStarterCode = `// starter playground code
console.log("¡Probando el código de este artículo!");
`;

  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setDescription(existingArticle.description);
      setCategory(existingArticle.category);
      setDifficulty(existingArticle.difficulty);
      setAuthor(existingArticle.author);
      setTags(existingArticle.tags || []);
      setContent(existingArticle.content);
      setPlaygroundCode(existingArticle.playgroundCode || '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('Frontend');
      setDifficulty('Principiante');
      setAuthor('Estudiante Uniempresarial');
      setTags(['React', 'Web']);
      setContent(defaultTemplate);
      setPlaygroundCode(defaultStarterCode);
    }
  }, [existingArticle]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Por favor ingresa un título y contenido para el artículo.');
      return;
    }

    const savedArticle = {
      id: existingArticle ? existingArticle.id : `article-${Date.now()}`,
      title,
      description,
      category,
      difficulty,
      author: author || 'Estudiante Uniempresarial',
      tags,
      lastUpdated: new Date().toISOString().split('T')[0],
      content,
      playgroundCode: playgroundCode || `// Escribe tu código aquí\n`
    };

    onSave(savedArticle);
  };

  return (
    <div className="editor-layout animate-fade-in">
      <div className="editor-header">
        <div className="editor-title-input-row">
          <input 
            type="text" 
            placeholder="Título del Artículo..." 
            className="editor-meta-input editor-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setPreviewMode(!previewMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {previewMode ? <Edit size={16} /> : <Eye size={16} />}
            <span>{previewMode ? 'Ver Editor' : 'Pantalla Completa Vista Previa'}</span>
          </button>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            <X size={16} />
            <span>Cancelar</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSubmit}
          >
            <Save size={16} />
            <span>Guardar Artículo</span>
          </button>
        </div>
      </div>

      <div className="editor-meta-drawer">
        <div className="editor-meta-group">
          <span className="editor-meta-label">Categoría:</span>
          <select 
            className="editor-meta-input" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Estructuras de Datos">Estructuras de Datos</option>
            <option value="Algoritmos">Algoritmos</option>
            <option value="Ingeniería de Software">Ingeniería de Software</option>
          </select>
        </div>

        <div className="editor-meta-group">
          <span className="editor-meta-label">Dificultad:</span>
          <select 
            className="editor-meta-input" 
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>

        <div className="editor-meta-group">
          <span className="editor-meta-label">Autor:</span>
          <input 
            type="text" 
            placeholder="Nombre del autor..." 
            className="editor-meta-input" 
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            style={{ width: '180px' }}
          />
        </div>

        <div className="editor-meta-group" style={{ flex: 1, minWidth: '200px' }}>
          <span className="editor-meta-label">Etiquetas:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.map((tag, idx) => (
              <span key={idx} className="editor-tag-pill">
                #{tag}
                <X size={12} className="editor-tag-remove" onClick={() => handleRemoveTag(idx)} />
              </span>
            ))}
            <input 
              type="text" 
              placeholder="Escribe y presiona Enter..." 
              className="editor-meta-input" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              style={{ width: '150px', borderStyle: 'dashed' }}
            />
          </div>
        </div>
      </div>

      <div className="editor-meta-drawer" style={{ background: '#0e121d', borderTop: 'none', padding: '8px 24px' }}>
        <div className="editor-meta-group" style={{ width: '100%' }}>
          <span className="editor-meta-label">Resumen de una línea:</span>
          <input 
            type="text" 
            placeholder="Una descripción muy corta de lo que trata este artículo..." 
            className="editor-meta-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', border: 'none', background: 'transparent', borderBottom: '1px solid var(--card-border)', borderRadius: '0' }}
          />
        </div>
      </div>

      <div className="editor-panel-split">
        {(!previewMode) && (
          <div className="editor-pane editor-pane-left">
            <div className="editor-pane-header">
              <span>Editor de Markdown</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Puedes usar sintaxis estándar de Markdown</span>
            </div>
            <textarea 
              className="editor-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Título de tu Artículo..."
            />
            
            <div className="editor-pane-header" style={{ borderTop: '1px solid var(--card-border)' }}>
              <span>Starter Code (para el Live Playground del artículo)</span>
            </div>
            <textarea 
              className="editor-textarea"
              style={{ flex: 0.4, minHeight: '120px', background: '#090d16', color: '#06b6d4' }}
              value={playgroundCode}
              onChange={(e) => setPlaygroundCode(e.target.value)}
              placeholder="// Código inicial de JavaScript..."
            />
          </div>
        )}

        <div className="editor-pane" style={{ flex: previewMode ? 2 : 1 }}>
          <div className="editor-pane-header">
            <span>Previsualización del Artículo</span>
          </div>
          <div className="editor-preview-pane">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    </div>
  );
}
