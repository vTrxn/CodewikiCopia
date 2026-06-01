import { useState } from 'react';
import ChatbotPanel from './ChatbotPanel';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  User, 
  Bookmark, 
  Edit3, 
  Tag, 
  Trash2, 
  Menu, 
  GitBranch, 
  Sparkles, 
  AlertCircle,
  ArrowLeft,
  X
} from 'lucide-react';

export default function ArticleViewer({ 
  activeArticle, 
  onBackToDashboard, 
  isBookmarked, 
  onToggleBookmark,
  isSidebarOpen,
  setIsSidebarOpen,
  onEditArticle,
  onOpenInPlayground,
  onDeleteArticle,
  onSaveArticle
}) {
  const [activeViewTab, setActiveViewTab] = useState('readme'); // 'readme' or 'ai-analysis'
  const [copiedCommit, setCopiedCommit] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!activeArticle) return null;

  // Deriving fallback values for repository metadata
  const repoPath = activeArticle.repoPath || `uniempresarial/${activeArticle.id}`;
  const commitHash = activeArticle.commitHash || "89b8f26";

  const formatDate = (dateStr) => {
    if (!dateStr) return "May 31, 2026";
    if (dateStr.includes(',')) return dateStr;
    const date = new Date(dateStr + "T00:00:00");
    const options = { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' };
    try {
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateStr;
    }
  };

  const formattedDate = formatDate(activeArticle.lastUpdated);

  // Copy commit hash handler
  const handleCopyCommit = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedCommit(true);
    setTimeout(() => setCopiedCommit(false), 2000);
  };

  // Extract headings for table of contents (README and AI Tabs)
  const getHeadings = (content) => {
    if (!content) return [];
    const lines = content.split('\n');
    const headings = [];
    lines.forEach(line => {
      if (line.startsWith('# ')) {
        headings.push({ level: 1, text: line.slice(2).trim() });
      } else if (line.startsWith('## ')) {
        headings.push({ level: 2, text: line.slice(3).trim() });
      } else if (line.startsWith('### ')) {
        headings.push({ level: 3, text: line.slice(4).trim() });
      }
    });
    return headings;
  };

  const scrollToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Heuristic Local AI NLP Analyzer (Segmenting Repo into 8 standard sections)
  const getAISegmentedAnalysis = (repo) => {
    const tags = repo.tags || [];
    const title = repo.title || "";
    
    // Section 1: Application Core and UI
    let coreUI = `## Application Core and UI\n\nEl núcleo de **${title}** está diseñado como una solución modular de alto rendimiento. `;
    if (tags.includes("React") || tags.includes("Frontend")) {
      coreUI += `Utiliza **Vite** y **React 19** como motor de renderizado de interfaz, estructurado bajo componentes declarativos puros en la capa de presentación.\n\n**Estructura detectada:**\n- \`src/App.jsx\`: Punto de control y enrutamiento.\n- \`src/main.jsx\`: Montaje e inyección de dependencias en el DOM.\n- \`src/components/\`: Biblioteca de componentes de presentación aislados.\n\n\`\`\`javascript\n// Punto de entrada principal para UI reactiva\nimport { createRoot } from 'react-dom/client';\nimport App from './App';\ncreateRoot(document.getElementById('root')).render(<App />);\n\`\`\``;
    } else if (tags.includes("NodeJS") || tags.includes("Express") || tags.includes("Backend")) {
      coreUI += `Implementa una arquitectura de servicios sobre **Node.js** con el micro-framework **Express**. Su núcleo gestiona enrutamientos desacoplados, control de errores global y serialización JSON.\n\n**Estructura detectada:**\n- \`src/server.js\`: Configuración, inicio de Express y escucha de puertos.\n- \`src/routes/\`: Enrutadores independientes por dominio del negocio.\n- \`src/controllers/\`: Controladores para procesar requests y orquestar respuestas.\n\n\`\`\`javascript\n// Núcleo del servidor express corporativo\nconst express = require('express');\nconst app = express();\napp.use(express.json());\napp.listen(3000, () => console.log('fUSoft Server Active on port 3000'));\n\`\`\``;
    } else {
      coreUI += `Está construido bajo patrones de programación modular robusta, separando los puntos de control del sistema de las interfaces físicas de usuario.\n\n**Estructura detectada:**\n- \`index.js\`: Hilo de control y flujo de la aplicación.\n- \`src/core/\`: Módulos de lógica central de negocio.\n\n\`\`\`javascript\n// Inicializador de modulo modular\nconsole.log("Core initialized successfully.");\n\`\`\``;
    }

    // Section 2: Application State and Configuration Management
    let stateMgmt = `## Application State and Configuration Management\n\nLa consistencia de los datos y el control de configuraciones del repositorio se gestionan de forma centralizada:\n\n`;
    if (tags.includes("React") || tags.includes("Frontend")) {
      stateMgmt += `- **Estado Global**: Manejado a través de la Context API de React con sincronización persistente en \`localStorage\` para preservar el estado ante recargas de página.\n- **Configuración**: Variables de entorno administradas en archivos \`.env\` para configuraciones de endpoints y tokens.\n\n\`\`\`javascript\n// Gestión del estado persistente fUSphere\nconst session = localStorage.getItem('fusoft_session');\nconst [user, setUser] = useState(session ? JSON.parse(session) : null);\n\`\`\``;
    } else if (tags.includes("NodeJS") || tags.includes("Express") || tags.includes("Backend") || tags.includes("Prisma")) {
      stateMgmt += `- **Esquema Relacional**: Prisma ORM gestiona la configuración de conexiones del pool, migraciones declarativas y generación de tipos fuertemente tipados.\n- **Configuraciones Seguras**: Carga dinámica mediante variables de entorno \`dotenv\` (\`DATABASE_URL\`, \`JWT_SECRET\`).\n\n\`\`\`prisma\n// Prisma data source configuration mapping\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\`\`\``;
    } else {
      stateMgmt += `- **Mapeo de Variables**: Configuración dinámica local a través de constantes globales y almacenamiento en archivos de configuración local persistentes.\n\n\`\`\`javascript\n// Configuración local del sistema\nconst CONFIG = {\n  env: process.env.NODE_ENV || "development",\n  version: "2026.05"\n};\n\`\`\``;
    }

    // Section 3: User Interface Components and Interaction
    let uiComponents = `## User Interface Components and Interaction\n\nComponentes de presentación y flujos de interacción con el usuario final:\n\n`;
    if (tags.includes("React") || tags.includes("Frontend")) {
      uiComponents += `- **UX Fluida**: Botones, modales y layouts protegidos con transiciones animadas y retroalimentación interactiva.\n- **Control de Formularios**: Manejo de inputs controlados con validación activa de campos para asegurar el formato de datos ingresados.\n\n\`\`\`javascript\n// Botón de interacción premium\n<button className="btn btn-primary" onClick={handleLogin}>\n  <span>Ingresar</span>\n</button>\n\`\`\``;
    } else if (tags.includes("NodeJS") || tags.includes("Express") || tags.includes("Backend")) {
      uiComponents += `- **Interacción API**: Respuestas estandarizadas en formato JSON que exponen cabeceras de éxito, payloads útiles y mensajes claros de error para su consumo desde clientes SPA.\n\n\`\`\`json\n// Estructura de respuesta de API interactiva\n{\n  "success": true,\n  "data": { "id": 1, "name": "Camilo" }\n}\n\`\`\``;
    } else {
      uiComponents += `- **Interfaz de Consola**: Registro interactivo estructurado por colores mediante la consola del playground de fUSphere para facilitar la auditoría de eventos de interacción.\n\n\`\`\`javascript\nconsole.log("[USER_INTERACTION]: Cargando perfil...");\n\`\`\``;
    }

    // Section 4: Core Application Utilities and Helpers
    let utilities = `## Core Application Utilities and Helpers\n\nEl repositorio implementa utilidades de soporte técnico reutilizables:\n\n`;
    if (tags.includes("Algorithms") || tags.includes("Algoritmos")) {
      utilities += `- **Suite de Benchmarks**: Generadores automáticos de arrays numéricos desordenados y rastreadores de rendimiento computacional en milisegundos para comparar algoritmos.\n- **Intercambiador**: Funciones matemáticas puras para manipulación de punteros en memoria sin sobrecargar la pila.\n\n\`\`\`javascript\nconst start = Date.now();\n// ejecutar algoritmo\nconsole.log("Tiempo transcurrido:", Date.now() - start, "ms");\n\`\`\``;
    } else if (tags.includes("Estructuras de Datos")) {
      utilities += `- **Búsqueda e Inserción**: Algoritmos eficientes para ordenación de punteros y formateadores ASCII para representaciones en árbol.\n\n\`\`\`javascript\n// Formateador de recorrido de nodos\nconst items = [];\nbst.inOrder(bst.root, node => items.push(node.key));\n\`\`\``;
    } else {
      utilities += `- **Ganchos Personalizados**: Custom hooks como \`useFetch\` para aislamiento de lógica asíncrona de red, manejadores de strings y formateadores de fechas locales.\n\n\`\`\`javascript\n// Custom fetch helper hook\nconst { data, loading } = useFetch('https://api.github.com');\n\`\`\``;
    }

    // Section 5: API and AI Service Integration
    let apiAI = `## API and AI Service Integration\n\nIntegración con servicios de inteligencia artificial y consumo de interfaces de red:\n\n`;
    if (tags.includes("CleanArchitecture") || tags.includes("NestJS")) {
      apiAI += `- **Reglas del Negocio Desacopladas**: Casos de uso abstractos listos para conectarse a endpoints de IA o repositorios remotos a través de puertos de interfaz inyectables.\n\n\`\`\`javascript\n// Inyección del caso de uso de servicio\nconst newProject = await useCase.execute("id", "titulo", 5000);\n\`\`\``;
    } else if (tags.includes("NodeJS") || tags.includes("Express") || tags.includes("Backend")) {
      apiAI += `- **Esquema de Autorización**: Sistema modular JWT (JSON Web Tokens) que valida accesos basados en roles antes de autorizar el consumo de endpoints sensibles del backend.\n\n\`\`\`javascript\nconst token = req.headers['authorization'].split(' ')[1];\nconst decoded = jwt.verify(token, process.env.JWT_SECRET);\n\`\`\``;
    } else {
      apiAI += `- **Consumo de LLMs**: El repositorio provee estructuras semánticas e interfaces de prompt para realizar peticiones directas de inferencia con modelos como **Gemini** o asistentes integrados.\n\n\`\`\`javascript\n// Consumo abstracto de APIs de LLM\nconst response = await fetch('/api/llm', { method: 'POST', body: JSON.stringify({ query }) });\n\`\`\``;
    }

    // Section 6: Desktop Client and Backend Services
    let desktopBackend = `## Desktop Client and Backend Services\n\nSoporte de servicios en segundo plano y compatibilidad con clientes de escritorio como Electron o Tauri:\n\n`;
    if (tags.includes("NestJS") || tags.includes("CleanArchitecture")) {
      desktopBackend += `- **NestJS Modules**: Inyección jerárquica de dependencias que expone controladores y servicios acoplables a envolturas de escritorio para operaciones locales.\n\n\`\`\`typescript\n@Module({\n  controllers: [ProjectController],\n  providers: [ProjectService],\n})\nexport class ProjectModule {}\n\`\`\``;
    } else if (tags.includes("NodeJS") || tags.includes("Express") || tags.includes("Backend")) {
      desktopBackend += `- **Servicios Backend**: Conexión nativa con motores PostgreSQL, soporte de contenedores **Docker** y orquestación de bases de datos para ambientes locales o servidores en la nube.\n\n\`\`\`text\n# Comando de soporte de servicios\ndocker-compose up --build -d postgres-db\n\`\`\``;
    } else {
      desktopBackend += `- **Tauri Core Bindings**: El repositorio provee configuraciones preparadas para su empaquetado en clientes de escritorio ligeros basados en Rust (Tauri), exponiendo APIs del sistema de archivos.\n\n\`\`\`json\n// tauri.conf.json snippet\n{\n  "tauri": { "allowlist": { "fs": true, "http": true } }\n}\n\`\`\``;
    }

    // Section 7: Localization and Persona Management
    let localizationPersona = `## Localization and Persona Management\n\nInternacionalización (i18n) y perfiles del sistema:\n\n`;
    if (tags.includes("React") || tags.includes("Frontend") || tags.includes("fUSoft")) {
      localizationPersona += `- **Personas y Roles**: Definición de perfiles académicos y operativos de Uniempresarial (Administrador, Profesor, Estudiante) que restringen y adaptan la navegación.\n- **Traducciones**: Soporte de archivos JSON multiidioma para localización fluida de toda la interfaz del usuario.\n\n\`\`\`json\n// locale-es.json\n{\n  "welcome": "¡Bienvenido a fUSphere!",\n  "auth_required": "Se requiere autenticación"\n}\n\`\`\``;
    } else {
      localizationPersona += `- **Configuraciones de Localización**: Diccionario estructurado de términos y constantes locales que adaptan los registros y respuestas según el idioma y rol del sistema.\n\n\`\`\`javascript\nconst LOCALE = { es: { success: "Operación Exitosa" } };\n\`\`\``;
    }

    // Section 8: Web Audio and Public Assets
    let audioAssets = `## Web Audio and Public Assets\n\nGestión de recursos estáticos, sonido e interfaces de voz:\n\n`;
    audioAssets += `- **Pipeline de Assets**: Utilización de iconos vectoriales optimizados de **Lucide React** y assets estáticos públicos livianos para garantizar una velocidad de carga instantánea.\n- **Audio Web (TTS/STT)**: Preparado para integrarse con Web Audio API para síntesis de voz, lectura de código guiada por sonido e interacciones de audio en el tutor inteligente de fUSphere.\n\n\`\`\`javascript\n// Carga de activos estáticos públicos vectorizados\nimport { Folder, ChevronRight, X } from 'lucide-react';\n\`\`\``;

    return `${coreUI}\n\n${stateMgmt}\n\n${uiComponents}\n\n${utilities}\n\n${apiAI}\n\n${desktopBackend}\n\n${localizationPersona}\n\n${audioAssets}`;
  };

  const handleGenerateAIAnalysis = async () => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('fusoft_groq_api_key') || '';
    if (!apiKey) {
      alert('Por favor, configura tu API Key de Groq en el archivo .env para realizar el análisis.');
      return;
    }

    setIsLoadingAI(true);
    setAiError('');

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
Título: ${activeArticle.title}
Descripción: ${activeArticle.description}
Contenido README:
${activeArticle.content}

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Error de comunicación con Groq.');
      }

      const data = await response.json();
      const analysisContent = data.choices[0].message.content;

      // Update the article in state and save
      const updatedArticle = {
        ...activeArticle,
        aiAnalysis: analysisContent
      };
      
      onSaveArticle(updatedArticle);
    } catch (err) {
      console.error(err);
      setAiError(`Error al generar el análisis: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const aiAnalysisMarkdown = activeArticle.aiAnalysis || getAISegmentedAnalysis(activeArticle);

  const contentToShow = activeViewTab === 'readme' ? activeArticle.content : aiAnalysisMarkdown;
  const headings = getHeadings(contentToShow);

  // Dynamic Outline Sidebar Items switcher
  const getOutlineItems = () => {
    return headings.map(h => ({
      text: h.text.replace(/[*`_]/g, ''),
      level: h.level,
      id: h.text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }));
  };

  const outlineItems = getOutlineItems();

  return (
    <div className="viewer-layout">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dynamic Outline Sidebar on the Left (No Folders, GitHub layout style) */}
      <div className={`sidebar-nav ${isSidebarOpen ? 'open' : ''}`}>
        {/* Drawer Header (Always visible when open) */}
        <div className="sidebar-mobile-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <span className="sidebar-title" style={{ margin: 0 }}>Índice</span>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <button 
          className="btn btn-secondary animate-fade-in" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center', width: '100%' }}
          onClick={onBackToDashboard}
        >
          <ArrowLeft size={16} />
          <span>Volver al Inicio</span>
        </button>

        <span className="sidebar-title animate-fade-in">On this page</span>

        <ul className="outline-list animate-fade-in" style={{ listStyle: 'none', padding: 0 }}>
          {outlineItems.map((item, idx) => (
            <li 
              key={idx} 
              className={`outline-item h${item.level}`}
              onClick={() => {
                scrollToHeading(item.id);
              }}
              style={{ cursor: 'pointer', marginBottom: '8px' }}
            >
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <div className="viewer-content-container animate-fade-in" style={{ flex: '1', overflowY: 'auto' }}>
          <div className="viewer-article-body">

          {/* Simple and friendly Wiki-style Header */}
          <div className="wiki-header-simple">
            <div className="wiki-breadcrumb">
              <span 
                className="wiki-breadcrumb-item highlight" 
                style={{ cursor: 'pointer' }}
                onClick={onBackToDashboard}
                title="Volver a Repositorios"
              >
                Repositorios
              </span>
              <span className="breadcrumb-separator">/</span>
              <span className="wiki-breadcrumb-item highlight">{activeArticle.category}</span>
            </div>
            
            <div className="wiki-title-container">
              <h1 className="wiki-title">{activeArticle.title}</h1>
              <span className={`difficulty-badge ${activeArticle.difficulty}`}>
                {activeArticle.difficulty}
              </span>
            </div>
            
            <div className="wiki-metadata-row">
              <div className="wiki-meta-left">
                <span className="wiki-meta-item">
                  <User size={13} />
                  <span>{activeArticle.author}</span>
                </span>
                <span className="wiki-meta-separator">•</span>
                <span className="wiki-meta-item">
                  <span>Actualizado: {formattedDate}</span>
                </span>
                <span className="wiki-meta-separator">•</span>
                <span className="wiki-meta-item cursor-pointer" onClick={() => handleCopyCommit(commitHash)} title="Copiar commit hash">
                  <GitBranch size={13} />
                  <span className="repo-branch-text">{repoPath} (commit: {copiedCommit ? '¡Copiado!' : commitHash.slice(0, 7)})</span>
                </span>
              </div>
              
              <div className="wiki-meta-right">
                <span className="wiki-meta-item ai-powered-badge" title="La IA analiza la información y estructura de este repositorio.">
                  <Sparkles size={12} style={{ color: 'var(--accent-secondary)' }} />
                  <span>Powered by Groq</span>
                </span>
              </div>
            </div>
          </div>

          {/* Clean Controls and Actions Row */}
          <div className="viewer-header-meta" style={{ marginTop: '16px', borderTop: 'none', paddingTop: 0 }}>
            <div className="gemini-mistakes-footnote">
              <AlertCircle size={12} style={{ color: 'var(--text-muted)' }} />
              <span>Groq puede cometer errores, revisa la información.</span>
            </div>
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                onClick={() => onToggleBookmark(activeArticle.id)}
              >
                <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} style={{ color: isBookmarked ? 'var(--accent-secondary)' : 'inherit' }} />
                <span>{isBookmarked ? 'Guardado' : 'Guardar'}</span>
              </button>
              {activeArticle.isUserOwned && (
                <>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    onClick={onEditArticle}
                  >
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}
                    onClick={() => {
                      if (window.confirm('¿Estás seguro de que deseas eliminar este repositorio? Esta acción no se puede deshacer.')) {
                        onDeleteArticle(activeArticle.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Viewer Content Separation Tabs */}
          <div className="viewer-tabs">
            <button 
              className={`viewer-tab ${activeViewTab === 'readme' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('readme')}
            >
              README.md (Raw Repo)
            </button>
            <button 
              className={`viewer-tab ${activeViewTab === 'ai-analysis' ? 'active' : ''}`}
              onClick={() => setActiveViewTab('ai-analysis')}
            >
              Estructura por IA (Groq)
            </button>
          </div>

          {/* Render Active View Tab Content */}
          <div style={{ marginTop: '24px' }}>
            {activeViewTab === 'readme' ? (
              <MarkdownRenderer 
                content={activeArticle.content} 
                onOpenInPlayground={onOpenInPlayground} 
              />
            ) : (
              <div className="ai-analysis-container">
                {/* Groq Real-time AI Generation Actions */}
                <div className="groq-ai-generation-box" style={{ marginBottom: '20px', padding: '16px', background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: 'var(--accent-secondary)' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {activeArticle.aiAnalysis ? 'Estructura Analizada con Llama 3 (Groq)' : 'Deseas generar la estructura real con IA de Groq?'}
                      </span>
                    </div>
                    
                    <button 
                      className="btn btn-accent" 
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={handleGenerateAIAnalysis}
                      disabled={isLoadingAI}
                    >
                      {isLoadingAI ? 'Analizando...' : activeArticle.aiAnalysis ? 'Volver a Analizar' : 'Generar Análisis con Groq'}
                    </button>
                  </div>
                  
                  {aiError && (
                    <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{aiError}</span>
                  )}
                  
                  {!activeArticle.aiAnalysis && !isLoadingAI && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Nota: Actualmente viendo plantilla heurística de ejemplo. Haz clic arriba para procesar el README real con Groq.
                    </span>
                  )}
                </div>

                {isLoadingAI ? (
                  <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="chatbot-status-dot" style={{ width: '16px', height: '16px', background: 'var(--accent-primary)', animation: 'pulse 1.2s infinite' }}></div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>El tutor de Groq está leyendo los archivos del repositorio...</span>
                  </div>
                ) : (
                  <MarkdownRenderer 
                    content={aiAnalysisMarkdown} 
                    onOpenInPlayground={onOpenInPlayground} 
                  />
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: '40px', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Tag size={14} style={{ color: 'var(--text-muted)' }} />
              {activeArticle.tags.map(tag => (
                <span 
                  key={tag} 
                  style={{ background: 'var(--bg-tertiary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        </div>
        <ChatbotPanel 
          isOpen={true}
          contextArticle={activeArticle}
          onOpenInPlayground={onOpenInPlayground}
        />
      </div>
    </div>
  );
}
