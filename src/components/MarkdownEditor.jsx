import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import { Save, X, Eye, Edit } from 'lucide-react';

export default function MarkdownEditor({ existingArticle, onSave, onCancel }) {
  // Seed default templates if creating new
  const defaultTemplate = `# README del Repositorio
  
Escribe una introducción para tu repositorio aquí.

## Estructura

Describir la estructura del código.

\`\`\`javascript
// Añade un bloque de código interactivo
const mensaje = "¡Hola fUSphere!";
console.log(mensaje);
\`\`\`

> [!NOTE]
> Este es un bloque de nota informativa. Puedes usar [!TIP], [!IMPORTANT], o [!WARNING] también.

## Uso

- Instrucciones de uso`;

  const defaultStarterCode = `// starter playground code
console.log("¡Probando el código de este repositorio!");
`;

  const [title, setTitle] = useState(existingArticle ? existingArticle.title : '');
  const [description, setDescription] = useState(existingArticle ? existingArticle.description : '');
  const [category, setCategory] = useState(existingArticle ? existingArticle.category : 'Frontend');
  const [difficulty, setDifficulty] = useState(existingArticle ? existingArticle.difficulty : 'Principiante');
  const [author, setAuthor] = useState(existingArticle ? existingArticle.author : 'Estudiante Uniempresarial');
  const [tags, setTags] = useState(existingArticle ? (existingArticle.tags || []) : ['React', 'Web']);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState(existingArticle ? existingArticle.content : defaultTemplate);
  const [playgroundCode, setPlaygroundCode] = useState(existingArticle ? (existingArticle.playgroundCode || '') : defaultStarterCode);
  const [previewMode, setPreviewMode] = useState(false); // Mobile toggle or split-screen toggle
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Por favor ingresa un título y contenido para el artículo.');
      return;
    }

    setIsSubmitting(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('fusoft_groq_api_key') || '';

    let generatedAnalysis = null;

    if (apiKey) {
      try {
        const userPrompt = `Analiza el siguiente repositorio de código y genera una estructura explicativa dividida EXACTAMENTE en las siguientes 8 secciones:
1. ## Application Core and UI
2. ## Application State and Configuration Management
3. ## User Interface Components and Interaction
4. ## Core Application Utilities and Helpers
5. ## API and AI Service Integration
6. ## Desktop Client and Backend Services
7. ## Localization and Persona Management
8. ## Web Audio and Public Assets

Aquí está la información del repositorio (Título, Descripción y README completo):
Título: ${title}
Descripción: ${description}
Contenido README:
${content}

Instrucciones IMPORTANTES para tu formato:
- Retorna únicamente las 8 secciones especificadas en formato Markdown bien estructurado.
- Explica de forma clara y técnica qué hace el repositorio en cada sección y dónde se ubican los archivos correspondientes (por ejemplo, src/App.jsx, config, routes, etc.).
- Incluye ejemplos de código didácticos en cada sección envueltos en bloques de código de triple acento grave (por ejemplo, \`\`\`javascript ... \`\`\`) para poder ejecutarlos en el playground.
- Sé didáctico y profesional en español.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'Eres un analizador de código experto para la plataforma académica fUSphere de Uniempresarial. Retornas segmentaciones de repositorios formateadas en Markdown técnico y estructurado.'
              },
              {
                role: 'user',
                content: userPrompt
              }
            ],
            temperature: 0.3,
            max_tokens: 2048
          })
        });

        if (response.ok) {
          const data = await response.json();
          generatedAnalysis = data.choices[0].message.content;
        }
      } catch (err) {
        console.error('Error pre-analizando con Groq:', err);
      }
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
      playgroundCode: playgroundCode || `// Escribe tu código aquí\n`,
      aiAnalysis: generatedAnalysis,
      isUserOwned: true
    };

    setIsSubmitting(false);
    onSave(savedArticle);
  };

  return (
    <div className="editor-layout animate-fade-in">
      <div className="editor-header">
        <div className="editor-title-input-row">
          <input 
            type="text" 
            placeholder="Título del Repositorio..." 
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
            <span>Guardar Repositorio</span>
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
            placeholder="Una descripción muy corta de lo que trata este repositorio..." 
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
              placeholder="# README del Repositorio (# Título)..."
            />
            
            <div className="editor-pane-header" style={{ borderTop: '1px solid var(--card-border)' }}>
              <span>Starter Code (para el Live Playground del repositorio)</span>
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
            <span>Previsualización del Repositorio</span>
          </div>
          <div className="editor-preview-pane">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
      {isSubmitting && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <div className="chatbot-status-dot" style={{ width: '24px', height: '24px', background: 'var(--accent-secondary)', animation: 'pulse 1s infinite' }}></div>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>Tutor fUSphere AI</h3>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Orquestando repositorio a través de Groq y particionando módulos...</span>
        </div>
      )}
    </div>
  );
}
