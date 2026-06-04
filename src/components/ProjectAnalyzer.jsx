import { useState, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import MarkdownRenderer from './MarkdownRenderer';
import { 
  Upload, FileCode, Folder, FolderOpen, File, Cpu, Check, 
  AlertCircle, Terminal, Settings, Key, RefreshCw, 
  FileText, Sparkles, BookOpen, ArrowRight, ChevronRight, 
  ChevronDown, Database, Play, CheckCircle, Info, HelpCircle,
  Download
} from 'lucide-react';

export default function ProjectAnalyzer({ onSaveArticle, onOpenInPlayground, onBackToDashboard }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
    // Tab states for analysis results
    const [analysisTab, setAnalysisTab] = useState('summary'); // 'summary', 'explanation', 'documentation'
    const [explanationContent, setExplanationContent] = useState('');
    const [documentationContent, setDocumentationContent] = useState('');
    
    // Chat states
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Model selection state
    const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('fusoft_groq_model') || 'llama-3.1-8b-instant');

    // API Key state
    const [apiKey, setApiKey] = useState(() => import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('fusoft_groq_api_key') || '');
    const [apiKeyInput, setApiKeyInput] = useState(apiKey);
    const [showKeySettings, setShowKeySettings] = useState(false);

  // Heuristic analysis results
  const [heuristics, setHeuristics] = useState({
    languages: [],
    dependencies: [],
    externalTools: [],
    recommendedCategory: 'Ingeniería de Software'
  });

  // Re-run heuristics whenever files change
  useEffect(() => {
    if (files.length > 0) {
      const results = analyzeProjectHeuristics(files);
      setHeuristics(results);
    } else {
      setHeuristics({
        languages: [],
        dependencies: [],
        externalTools: [],
        recommendedCategory: 'Ingeniería de Software'
      });
      setSelectedFile(null);
      setExplanationContent('');
      setDocumentationContent('');
    }
  }, [files]);

  // Load Chat history when project changes
  useEffect(() => {
    if (projectName) {
      const savedChat = localStorage.getItem(`fusoft_analyzer_chat_${projectName}`);
      if (savedChat) {
        try {
          setChatMessages(JSON.parse(savedChat).slice(-20)); // Limit to last 20 messages
        } catch (e) {
          console.error(e);
          setChatMessages(getDefaultWelcomeMessages());
        }
      } else {
        setChatMessages(getDefaultWelcomeMessages());
      }
    } else {
      setChatMessages([]);
    }
  }, [projectName]);

  // Save Chat history capped at 20 messages (both sides total)
  useEffect(() => {
    if (projectName && chatMessages.length > 0) {
      const capped = chatMessages.slice(-20);
      localStorage.setItem(`fusoft_analyzer_chat_${projectName}`, JSON.stringify(capped));
    }
  }, [chatMessages, projectName]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (analysisTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, analysisTab]);

  const getDefaultWelcomeMessages = () => [
    {
      id: `welcome-${Date.now()}`,
      sender: 'bot',
      text: `¡Hola! Soy tu Tutor AI de fUSphere. He analizado los archivos de tu proyecto **${projectName}**.
      
¿Tienes alguna pregunta sobre el código fuente, la arquitectura, o cómo instalar y ejecutar este proyecto? Escríbela aquí abajo y te ayudaré.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  // ----------------------------------------------------
  // Drag & Drop Handlers
  // ----------------------------------------------------
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUploadedFile(file);
    }
  };

  const handleFileInput = async (e, isFolder = false) => {
    if (e.target.files && e.target.files[0]) {
      if (isFolder) {
        await processFolderFiles(e.target.files);
      } else {
        const file = e.target.files[0];
        await processUploadedFile(file);
      }
    }
  };

  // ----------------------------------------------------
  // File Processors
  // ----------------------------------------------------
  const processUploadedFile = async (file) => {
    const isZip = file.name.endsWith('.zip');
    setProjectName(file.name.replace(/\.zip$/i, ''));
    setLoading(true);
    setLoadingStep('Procesando archivo...');

    try {
      if (isZip) {
        setLoadingStep('Extrayendo archivo comprimido .ZIP...');
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const filesArray = [];
        
        for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
          if (!zipEntry.dir) {
            // Ignorar directorios de dependencias o compilación pesados
            if (
              relativePath.includes('node_modules/') || 
              relativePath.includes('.git/') || 
              relativePath.includes('dist/') || 
              relativePath.includes('build/') || 
              relativePath.includes('.next/') || 
              relativePath.includes('venv/') || 
              relativePath.includes('__pycache__/')
            ) {
              continue;
            }
            
            try {
              const content = await zipEntry.async('string');
              filesArray.push({
                path: relativePath,
                name: zipEntry.name.split('/').pop(),
                content: content,
                size: content.length
              });
            } catch (err) {
              console.warn(`No se pudo leer el archivo de zip: ${relativePath}`, err);
            }
          }
        }
        
        if (filesArray.length === 0) {
          alert('No se encontraron archivos válidos en el ZIP (se omitieron carpetas del sistema como node_modules).');
        } else {
          setFiles(filesArray);
          setAnalysisTab('summary');
        }
      } else {
        // Individual file upload
        const content = await file.text();
        setFiles([{
          path: file.name,
          name: file.name,
          content: content,
          size: file.size
        }]);
        setAnalysisTab('summary');
      }
    } catch (error) {
      console.error(error);
      alert(`Error al procesar el archivo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processFolderFiles = async (fileList) => {
    setLoading(true);
    setLoadingStep('Procesando archivos de la carpeta...');
    
    try {
      const filesArray = [];
      let detectedProjectName = 'Carpeta del Proyecto';
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const relativePath = file.webkitRelativePath || file.name;
        
        // Inferir el nombre del proyecto desde el directorio raíz
        if (i === 0 && file.webkitRelativePath) {
          detectedProjectName = file.webkitRelativePath.split('/')[0];
        }

        // Ignorar directorios pesados
        if (
          relativePath.includes('node_modules/') || 
          relativePath.includes('.git/') || 
          relativePath.includes('dist/') || 
          relativePath.includes('build/') || 
          relativePath.includes('.next/') || 
          relativePath.includes('venv/') || 
          relativePath.includes('__pycache__/')
        ) {
          continue;
        }

        try {
          const content = await file.text();
          filesArray.push({
            path: relativePath,
            name: file.name,
            content: content,
            size: file.size
          });
        } catch (err) {
          console.warn(`No se pudo leer el archivo: ${relativePath}`, err);
        }
      }

      setProjectName(detectedProjectName);
      if (filesArray.length === 0) {
        alert('No se encontraron archivos procesables (se omitieron carpetas del sistema como node_modules).');
      } else {
        setFiles(filesArray);
        setAnalysisTab('summary');
      }
    } catch (error) {
      console.error(error);
      alert(`Error al procesar la carpeta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Heuristic Scan logic
  // ----------------------------------------------------
  const analyzeProjectHeuristics = (filesList) => {
    const techs = new Set();
    const tools = [];
    const deps = new Set();
    let category = 'Ingeniería de Software';
    
    // Buscar archivos de configuración clave
    const packageJson = filesList.find(f => f.name === 'package.json');
    const requirementsTxt = filesList.find(f => f.name === 'requirements.txt');
    const dockerfile = filesList.find(f => f.name.toLowerCase() === 'dockerfile' || f.name === 'docker-compose.yml');
    const pomXml = filesList.find(f => f.name === 'pom.xml');
    const buildGradle = filesList.find(f => f.name === 'build.gradle');
    const composerJson = filesList.find(f => f.name === 'composer.json');
    const goMod = filesList.find(f => f.name === 'go.mod');
    
    let hasJs = false;
    let hasTs = false;
    let hasPy = false;
    let hasJava = false;
    let hasGo = false;
    let hasPhp = false;
    let hasHtml = false;
    let hasCss = false;
    let hasSql = false;

    filesList.forEach(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      if (ext === 'js' || ext === 'jsx') hasJs = true;
      if (ext === 'ts' || ext === 'tsx') hasTs = true;
      if (ext === 'py') hasPy = true;
      if (ext === 'java') hasJava = true;
      if (ext === 'go') hasGo = true;
      if (ext === 'php') hasPhp = true;
      if (ext === 'html') hasHtml = true;
      if (ext === 'css') hasCss = true;
      if (ext === 'sql') hasSql = true;
    });

    if (hasJs || hasTs) techs.add('JavaScript/TypeScript');
    if (hasPy) techs.add('Python');
    if (hasJava) techs.add('Java');
    if (hasGo) techs.add('Go');
    if (hasPhp) techs.add('PHP');
    if (hasHtml || hasCss) techs.add('HTML/CSS');
    if (hasSql) techs.add('SQL');

    // 1. Detección de Node / JavaScript
    if (packageJson) {
      techs.add('Node.js');
      tools.push({
        name: 'Node.js (LTS v18+ recomendado)',
        description: 'Entorno de tiempo de ejecución para JavaScript fuera del navegador, necesario para instalar dependencias y ejecutar scripts de compilación.',
        purpose: 'Compilación y ejecución del servidor o tooling frontend.'
      });
      
      try {
        const data = JSON.parse(packageJson.content);
        const allDeps = { ...(data.dependencies || {}), ...(data.devDependencies || {}) };
        
        if (allDeps['react']) deps.add('React');
        if (allDeps['vue']) deps.add('Vue');
        if (allDeps['angular']) deps.add('Angular');
        if (allDeps['next']) deps.add('Next.js');
        if (allDeps['vite']) deps.add('Vite');
        if (allDeps['tailwind']) deps.add('TailwindCSS');
        
        if (allDeps['express']) {
          deps.add('Express');
          category = 'Backend';
        }
        if (allDeps['@nestjs/core']) {
          deps.add('NestJS');
          category = 'Backend';
        }
        
        if (allDeps['mongoose'] || allDeps['mongodb']) {
          deps.add('MongoDB');
          tools.push({
            name: 'MongoDB Server',
            description: 'Base de datos NoSQL orientada a documentos configurada en las dependencias.',
            purpose: 'Almacenamiento y persistencia de datos.'
          });
        }
        if (allDeps['pg'] || allDeps['@prisma/client'] || allDeps['sequelize']) {
          if (allDeps['pg'] || packageJson.content.includes('postgres') || packageJson.content.includes('postgresql')) {
            deps.add('PostgreSQL');
            tools.push({
              name: 'PostgreSQL Database',
              description: 'Sistema de administración de bases de datos relacionales robusto.',
              purpose: 'Gestión y consulta de datos relacionales.'
            });
          }
        }
        if (allDeps['mysql2'] || allDeps['mysql']) {
          deps.add('MySQL');
          tools.push({
            name: 'MySQL Server',
            description: 'Motor de base de datos relacional clásico.',
            purpose: 'Almacenamiento estructurado.'
          });
        }
        if (allDeps['redis'] || allDeps['ioredis']) {
          deps.add('Redis');
          tools.push({
            name: 'Redis Cache Server',
            description: 'Almacén de estructuras de datos en memoria para almacenamiento en caché de alto rendimiento.',
            purpose: 'Cacheo y gestión de sesiones rápidas.'
          });
        }

        if (allDeps['react'] && allDeps['vite']) {
          category = 'Frontend';
        }
      } catch (e) {
        console.warn('Fallo al parsear package.json', e);
      }
    }

    // 2. Detección de Python
    if (requirementsTxt || hasPy) {
      tools.push({
        name: 'Python 3.9+ e instalador pip',
        description: 'Intérprete del lenguaje de programación Python y su gestor de paquetes oficial.',
        purpose: 'Ejecutar la lógica del servidor, modelos de datos o scripts de IA.'
      });

      if (requirementsTxt) {
        const content = requirementsTxt.content.toLowerCase();
        if (content.includes('django')) {
          deps.add('Django');
          category = 'Backend';
        }
        if (content.includes('flask')) {
          deps.add('Flask');
          category = 'Backend';
        }
        if (content.includes('fastapi')) {
          deps.add('FastAPI');
          category = 'Backend';
        }
        if (content.includes('psycopg2') || content.includes('postgresql')) {
          deps.add('PostgreSQL');
          tools.push({
            name: 'PostgreSQL Database Server',
            description: 'Base de datos relacional PostgreSQL necesaria para almacenar los modelos de Django/FastAPI.',
            purpose: 'Almacenamiento relacional.'
          });
        }
        if (content.includes('pymongo')) {
          deps.add('MongoDB');
          tools.push({
            name: 'MongoDB Server',
            description: 'Base de datos NoSQL usada desde los conectores de Python.',
            purpose: 'Base de datos no relacional.'
          });
        }
      }
    }

    // 3. Detección de Java
    if (pomXml || buildGradle || hasJava) {
      tools.push({
        name: 'Java Development Kit (JDK 17+)',
        description: 'Kit de desarrollo de software para compilar y ejecutar programas creados en Java.',
        purpose: 'Máquina virtual JVM y ejecución del código compilado.'
      });
      
      if (pomXml) {
        tools.push({
          name: 'Apache Maven',
          description: 'Herramienta de automatización de compilación y gestión de proyectos Java.',
          purpose: 'Manejo del ciclo de vida y descarga de librerías.'
        });
        const content = pomXml.content;
        if (content.includes('spring-boot')) {
          deps.add('Spring Boot');
          category = 'Backend';
        }
        if (content.includes('mysql-connector')) {
          deps.add('MySQL');
          tools.push({
            name: 'MySQL Server',
            description: 'Servidor de base de datos relacional para la persistencia del proyecto Java Spring.',
            purpose: 'Almacenamiento persistente.'
          });
        }
      }
      if (buildGradle) {
        tools.push({
          name: 'Gradle Build Tool',
          description: 'Sistema de automatización de construcción optimizado para proyectos Java/Kotlin.',
          purpose: 'Construcción y resolución de dependencias.'
        });
        const content = buildGradle.content;
        if (content.includes('springboot')) {
          deps.add('Spring Boot');
          category = 'Backend';
        }
      }
    }

    // 4. Detección de PHP
    if (composerJson || hasPhp) {
      tools.push({
        name: 'PHP Runtime Environment (v8.1+)',
        description: 'Intérprete del motor del servidor web PHP necesario para procesar el código del backend.',
        purpose: 'Servidor dinámico backend.'
      });
      tools.push({
        name: 'Composer Package Manager',
        description: 'Manejador de dependencias estándar para el ecosistema PHP.',
        purpose: 'Gestión y carga automática de paquetes.'
      });

      if (composerJson) {
        try {
          const data = JSON.parse(composerJson.content);
          const req = data.require || {};
          if (req['laravel/framework']) {
            deps.add('Laravel');
            category = 'Backend';
          }
          if (req['symfony/framework-bundle']) {
            deps.add('Symfony');
            category = 'Backend';
          }
        } catch {}
      }
    }

    // 5. Detección de Go
    if (goMod || hasGo) {
      tools.push({
        name: 'Go Compiler (Golang v1.20+)',
        description: 'Kit de desarrollo del lenguaje compilado Go de alto rendimiento.',
        purpose: 'Compilación y levantamiento del microservicio backend.'
      });
      category = 'Backend';
      deps.add('Go');
    }

    // 6. Docker (Herramienta general)
    if (dockerfile) {
      tools.push({
        name: 'Docker Desktop / Docker Engine',
        description: 'Herramienta de virtualización que permite empaquetar aplicaciones en contenedores con su entorno y dependencias.',
        purpose: 'Despliegue local unificado y aislamiento del software (base de datos, servicios, etc.).'
      });
      deps.add('Docker');
    }

    // Remover duplicados por nombre
    const uniqueTools = [];
    const seenTools = new Set();
    tools.forEach(t => {
      if (!seenTools.has(t.name)) {
        seenTools.add(t.name);
        uniqueTools.push(t);
      }
    });

    return {
      languages: Array.from(techs),
      dependencies: Array.from(deps),
      externalTools: uniqueTools,
      recommendedCategory: category
    };
  };

  // Helper to extract key source files to feed the LLM context (optimized for low TPM rate limits)
  const getContextFilesSummary = () => {
    let result = `Nombre del Proyecto: ${projectName}\n`;
    result += `Estructura de archivos:\n`;
    
    // Limit file listing to first 25 files to save input tokens
    const visibleFiles = files.slice(0, 25);
    visibleFiles.forEach(f => {
      result += `- ${f.path} (${f.size} bytes)\n`;
    });
    if (files.length > 25) {
      result += `- ... y ${files.length - 25} archivos más.\n`;
    }

    result += `\n--- CONTENIDO DE ARCHIVOS CLAVE ---\n`;

    const keyFiles = files.filter(f => 
      f.name === 'package.json' || 
      f.name === 'requirements.txt' || 
      f.name === 'composer.json' || 
      f.name === 'pom.xml' || 
      f.name === 'go.mod' || 
      f.name === 'docker-compose.yml' ||
      f.name === 'App.jsx' ||
      f.name === 'App.js' ||
      f.name === 'main.js' ||
      f.name === 'index.js' ||
      f.name === 'server.js' ||
      f.name === 'main.py' ||
      f.name.endsWith('.sql')
    );

    let selectedForContext = [...keyFiles];
    if (selectedForContext.length < 2) {
      const codeFiles = files.filter(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        return ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'php', 'go', 'html', 'css'].includes(ext);
      });
      codeFiles.sort((a, b) => b.size - a.size);
      
      codeFiles.slice(0, 2).forEach(cf => {
        if (!selectedForContext.some(f => f.path === cf.path)) {
          selectedForContext.push(cf);
        }
      });
    }

    // Limit snippet size strictly to avoid token inflation and Rate Limits (TPM)
    let charCount = 0;
    for (const kf of selectedForContext) {
      if (charCount > 1000) break;
      const snippet = kf.content.slice(0, 300);
      result += `\nArchivo: [${kf.path}]\n\`\`\`\n${snippet}\n\`\`\`\n`;
      charCount += snippet.length;
    }

    return result;
  };

  // ----------------------------------------------------
  // Groq API Call Handlers
  // ----------------------------------------------------
  const handleRunAiAnalysis = async (type) => {
    setLoading(true);
    setAnalysisTab(type);

    if (type === 'explanation') {
      setLoadingStep('Analizando arquitectura y explicando el código fuente...');
    } else {
      setLoadingStep('Generando guía de documentación y Wiki académica...');
    }

    const activeKey = apiKey || import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('fusoft_groq_api_key') || '';

    // Si no está la API Key, simular respuesta académica local
    if (!activeKey) {
      setTimeout(() => {
        setLoading(false);
        if (type === 'explanation') {
          setExplanationContent(getMockedExplanation());
        } else {
          setDocumentationContent(getMockedDocumentation());
        }
      }, 2500);
      return;
    }

    try {
      const contextText = getContextFilesSummary();
      const prompt = type === 'explanation' 
        ? `Actúa como el Tutor AI de fUSphere. Analiza el código fuente del proyecto y haz una explicación técnica detallada. 
           Estructura tu respuesta en las siguientes secciones en español:
           1. # Arquitectura y Flujo de Trabajo (Explica cómo se estructuran las carpetas, el flujo de ejecución principal y los puntos de entrada).
           2. # Componentes y Lógica Core (Explica qué hacen los componentes principales o los scripts de código central).
           3. # Estado y Gestión de Datos (Explica cómo administra los datos, variables de entorno, almacenamiento, base de datos local o remota).
           4. # Puntos Críticos o Buenas Prácticas (Indica si el código sigue buenas prácticas de software o áreas de mejora).

           Usa Markdown limpio. Agrega bloques de código de ejemplo útiles de los archivos si es apropiado.`
        : `Actúa como el Documentador de Proyectos Académicos de fUSphere. Genera una Wiki o README formal y didáctico para este repositorio.
           Debe incluir:
           1. # [Nombre del Proyecto]
           2. ## Descripción General (Qué problema resuelve, objetivos académicos y alcance).
           3. ## Stack Tecnológico (Lenguajes, Frameworks y base de datos con sus respectivos propósitos).
           4. ## Estructura de Directorios (Esquema en árbol del código fuente cargado).
           5. ## Requisitos de Instalación (Paso a paso de lo que se requiere instalar en local).
           6. ## Guía de Uso Rápido (Comandos para iniciar el servidor de desarrollo, pruebas y despliegue).
           7. > [!NOTE]
              > Agrega una sección de consejos de desarrollo académico en una alerta estilo GitHub.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'Eres el Tutor Académico y Documentador experto de fUSphere. Generas explicaciones detalladas y documentación estructurada en Markdown.'
            },
            {
              role: 'user',
              content: `Aquí está el contexto de los archivos del proyecto subido:\n\n${contextText}\n\nInstrucción:\n${prompt}`
            }
          ],
          temperature: 0.4,
          max_tokens: 1200
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Error en respuesta de servidor de IA.');
      }

      const data = await response.json();
      const text = data.choices[0].message.content;

      if (type === 'explanation') {
        setExplanationContent(text);
      } else {
        setDocumentationContent(text);
      }
    } catch (error) {
      console.error(error);
      alert(`Error al generar el análisis con Groq: ${error.message}. Usando respuestas del simulador académico local.`);
      if (type === 'explanation') {
        setExplanationContent(getMockedExplanation());
      } else {
        setDocumentationContent(getMockedDocumentation());
      }
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Mock fallback responders
  // ----------------------------------------------------
  const getMockedExplanation = () => {
    return `# Análisis Arquitectónico Local (Simulado)

Este es un análisis estructurado heurístico del proyecto **${projectName}** debido a que no tienes una Clave de API de Groq configurada (o se usó el fallback de contingencia).

## 1. Arquitectura y Flujo de Trabajo
El proyecto está estructurado con los siguientes lenguajes dominantes: **${heuristics.languages.join(', ') || 'Desconocido'}**.
* **Punto de Entrada:** Se detecta que el flujo se inicia en los archivos de la raíz o en carpetas como \`src/\`, \`app/\` o \`main\`.
* **Organización:** Sigue un diseño estructurado por carpetas donde se dividen los recursos de código, archivos de configuración de dependencias y lógica del dominio.

## 2. Componentes y Lógica Core
* Se identificaron archivos fuente clave en el árbol del proyecto.
* La configuración en los archivos describe un modelo que depende de: **${heuristics.dependencies.join(', ') || 'Librerías estándar'}**.

## 3. Estado y Gestión de Datos
${heuristics.externalTools.length > 0 
  ? `Se detectaron requerimientos de bases de datos o servicios externos:
${heuristics.externalTools.map(t => `* **${t.name}**: ${t.purpose}`).join('\n')}`
  : '* El proyecto parece ser puramente cliente / estático sin bases de datos pesadas declaradas en configuración.'}

---
> [!TIP]
> Si deseas un análisis inteligente profundo basado en inteligencia artificial real que lea línea a línea tus archivos, ingresa tu **Groq API Key** en la barra superior derecha de configuración.`;
  };

  const getMockedDocumentation = () => {
    return `# Documentación Académica - ${projectName}

Guía rápida autogenerada localmente por fUSphere.

## Descripción General
Este es el repositorio **${projectName}**, cargado en la plataforma de aprendizaje. Incluye la estructura necesaria para un entorno educativo.

## Stack Tecnológico
* **Lenguajes:** ${heuristics.languages.join(', ') || 'No detectados'}
* **Dependencias Principales:** ${heuristics.dependencies.join(', ') || 'Librerías nativas'}
* **Herramientas de Entorno:** ${heuristics.externalTools.map(t => t.name).join(', ') || 'Ninguna herramienta externa requerida.'}

## Requisitos de Instalación
Dependiendo del motor del lenguaje:
${heuristics.externalTools.map((t, idx) => `${idx + 1}. **${t.name}**: ${t.description}`).join('\n')}
* Asegúrate de clonar el código y abrir la terminal en esta ubicación.

## Guía de Uso Rápido
${heuristics.dependencies.includes('React') || heuristics.dependencies.includes('Vite') || heuristics.languages.includes('Node.js')
  ? `\`\`\`bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev
\`\`\``
  : heuristics.languages.includes('Python')
  ? `\`\`\`bash
# Instalar requerimientos
pip install -r requirements.txt

# Ejecutar el script principal
python main.py
\`\`\``
  : `* Consulta los scripts y configuraciones del archivo de dependencias correspondiente para levantar este proyecto.`}

---
> [!NOTE]
> Documentación generada por el módulo estático local de fUSphere. Configura una Groq API Key para obtener documentación enriquecida.`;
  };

  // ----------------------------------------------------
  // Integrate Analysis into fUSphere DB
  // ----------------------------------------------------
  const handleIndexInWiki = () => {
    if (!projectName) return;
    
    // Preparar el código interactivo para el Playground de fUSphere
    // Buscar un archivo de código javascript para indexarlo en el sandbox
    const jsFile = files.find(f => f.name.endsWith('.js') || f.name.endsWith('.jsx'));
    const playgroundCode = jsFile 
      ? jsFile.content 
      : `// Código del Playground generado desde el proyecto: ${projectName}\nconsole.log("¡Proyecto cargado en fUSphere!");\n`;

    const markdownDoc = documentationContent || getMockedDocumentation();
    const cleanExplanation = explanationContent || getMockedExplanation();

    const wikiArticle = {
      id: `uploaded-${Date.now()}`,
      title: projectName,
      description: `Proyecto académico en ${heuristics.languages.join(', ') || 'código'}. Analizado e indexado localmente.`,
      category: heuristics.recommendedCategory,
      difficulty: heuristics.dependencies.includes('Docker') || heuristics.dependencies.includes('NestJS') ? 'Avanzado' : 'Intermedio',
      author: 'Estudiante fUSphere Upload',
      tags: [...heuristics.languages, ...heuristics.dependencies],
      lastUpdated: new Date().toISOString().split('T')[0],
      content: markdownDoc,
      playgroundCode: playgroundCode,
      aiAnalysis: cleanExplanation,
      isUserOwned: true
    };

    onSaveArticle(wikiArticle);
    alert(`¡Éxito! El proyecto "${projectName}" ha sido indexado en tu catálogo de fUSphere bajo la categoría "${heuristics.recommendedCategory}".`);
  };

  const handleDownloadSummary = (type, content) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = projectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    a.download = `${cleanName}-${type === 'explanation' ? 'explicacion' : 'documentacion'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportChat = () => {
    if (chatMessages.length === 0) return;
    
    let textContent = `Historial de Chat de fUSphere - Proyecto: ${projectName}\n`;
    textContent += `Límite de memoria: Últimos 20 mensajes\n`;
    textContent += `Fecha de exportación: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    textContent += `========================================================================\n\n`;

    chatMessages.forEach(msg => {
      const label = msg.sender === 'user' ? 'Usuario' : 'Tutor AI';
      textContent += `[${label}] (${msg.timestamp || ''}):\n${msg.text}\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanName = projectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    a.download = `chat-memoria-${cleanName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportChat = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      
      try {
        if (text.trim().startsWith('[')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const validMessages = parsed.filter(m => m.sender && m.text).slice(-20);
            setChatMessages(validMessages);
            alert(`Historial cargado con éxito (${validMessages.length} mensajes).`);
            return;
          }
        }
      } catch (err) {}

      try {
        const lines = text.split('\n');
        const parsedMessages = [];
        let currentMessage = null;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const userMatch = line.match(/^\[Usuario\]\s*\(([^)]+)\):/i) || line.match(/^\[Usuario\]:/i);
          const botMatch = line.match(/^\[Tutor\s*AI\]\s*\(([^)]+)\):/i) || line.match(/^\[Tutor\s*AI\]:/i);

          if (userMatch) {
            if (currentMessage) parsedMessages.push(currentMessage);
            currentMessage = {
              id: `imported-${Date.now()}-${i}`,
              sender: 'user',
              text: '',
              timestamp: userMatch[1] || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          } else if (botMatch) {
            if (currentMessage) parsedMessages.push(currentMessage);
            currentMessage = {
              id: `imported-${Date.now()}-${i}`,
              sender: 'bot',
              text: '',
              timestamp: botMatch[1] || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          } else {
            if (currentMessage) {
              if (currentMessage.text) {
                currentMessage.text += '\n' + line;
              } else {
                currentMessage.text = line;
              }
            }
          }
        }
        if (currentMessage) parsedMessages.push(currentMessage);

        const cleanedMessages = parsedMessages.map(m => ({
          ...m,
          text: m.text.trim()
        })).filter(m => m.text.length > 0).slice(-20);

        if (cleanedMessages.length > 0) {
          setChatMessages(cleanedMessages);
          alert(`Historial de texto importado con éxito (${cleanedMessages.length} mensajes cargados).`);
        } else {
          alert('No se pudo encontrar un formato de chat válido en el archivo de texto.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al parsear el archivo de texto.');
      }
    };
    reader.readAsText(file);
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, userMessage].slice(-20);
    setChatMessages(updatedMessages);
    const queryText = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    const activeKey = apiKey || import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('fusoft_groq_api_key') || '';

    if (!activeKey) {
      setTimeout(() => {
        const mockResponse = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Entiendo tu duda sobre **"${queryText}"** en el proyecto **${projectName}**.
          
Como no tienes configurada una **Groq API Key**, estoy respondiendo en modo simulación académica. El proyecto está desarrollado principalmente con **${heuristics.languages.join(', ') || 'código estándar'}**.

Puedes configurar tu clave de API arriba a la derecha para hacerme cualquier pregunta técnica real sobre las funciones y lógica de estos archivos.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, mockResponse].slice(-20));
        setIsChatLoading(false);
      }, 1500);
      return;
    }

    try {
      const contextText = getContextFilesSummary();
      const conversationContext = chatMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      conversationContext.push({ role: 'user', content: queryText });

      const systemPrompt = `Eres el Tutor Académico de IA en fUSphere. Estás guiando a un estudiante sobre el proyecto de código subido: **${projectName}**.
      
Aquí está la estructura y archivos clave del proyecto:
${contextText}

Responde de forma clara, directa, educada y didáctica en español. Ayúdalo a entender la lógica, sintaxis o resolver sus dudas conceptuales sobre el código.
Usa Markdown para tu formato. Si incluyes ejemplos de código, asegúrate de envolverlos en bloques de código de triple acento grave (\`\`\`javascript ... \`\`\`).`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationContext.slice(-20)
          ],
          temperature: 0.6,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Error en respuesta de servidor de IA.');
      }

      const data = await response.json();
      const botText = data.choices[0].message.content;

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, botMessage].slice(-20));
    } catch (error) {
      console.error(error);
      let errorText = `Lo siento, ocurrió un error al comunicarme con la API de Groq: ${error.message || 'Error desconocido'}.`;
      if (error.message && error.message.toLowerCase().includes('rate limit')) {
        errorText += `\n\n💡 **Tip académico:** Has alcanzado el límite de tokens por minuto (TPM) en la API gratuita de Groq. Te recomendamos hacer clic en el engranaje de **Configurar Groq Key** (arriba a la derecha) y seleccionar el modelo **llama-3.3-70b-versatile**, ya que cuenta con cuotas de tokens significativamente más grandes y mayor calidad de respuesta.`;
      }
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: errorText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage].slice(-20));
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRunSelectedInPlayground = (fileItem) => {
    if (!fileItem) return;
    onOpenInPlayground(fileItem.content);
  };

  const saveApiKey = (key) => {
    localStorage.setItem('fusoft_groq_api_key', key);
    setApiKey(key);
    setShowKeySettings(false);
    alert('API Key de Groq guardada localmente.');
  };

  // Format file size
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get icons for files
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext)) return <FileCode size={18} style={{ color: '#f7df1e' }} />;
    if (ext === 'json') return <FileCode size={18} style={{ color: '#cbd5e1' }} />;
    if (ext === 'py') return <FileCode size={18} style={{ color: '#3776ab' }} />;
    if (ext === 'html') return <File size={18} style={{ color: '#e34f26' }} />;
    if (ext === 'css') return <File size={18} style={{ color: '#1572b6' }} />;
    if (ext === 'md') return <FileText size={18} style={{ color: '#005a9c' }} />;
    if (['zip', 'rar', 'gz'].includes(ext)) return <Cpu size={18} style={{ color: '#a855f7' }} />;
    return <File size={18} style={{ color: 'var(--text-muted)' }} />;
  };

  return (
    <div className="analyzer-container" style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      height: 'calc(100vh - 64px)'
    }}>
      
      {/* Upper header action bar */}
      <div className="analyzer-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--card-border)',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-icon" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary)' }}>
            <Upload size={22} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Analizador & Documentador de Proyectos
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Sube carpetas locales o archivos comprimidos .ZIP para analizar dependencias y generar explicaciones académicas.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* API Key Panel */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowKeySettings(!showKeySettings)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '0.85rem' }}
            >
              <Key size={16} style={{ color: apiKey ? '#10b981' : 'var(--text-muted)' }} />
              <span>{apiKey ? 'Groq Activa' : 'Configurar Groq Key'}</span>
            </button>
            
            {showKeySettings && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '320px',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '16px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Clave de API de Groq</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Ingresa tu API Key de Groq para habilitar el análisis por Inteligencia Artificial de forma local. Tu clave no se enviará a ningún servidor de terceros aparte de Groq.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Modelo de IA:</label>
                  <select 
                    value={selectedModel}
                    onChange={(e) => {
                      const m = e.target.value;
                      setSelectedModel(m);
                      localStorage.setItem('fusoft_groq_model', m);
                    }}
                    style={{
                      padding: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Rápido - Alta Disponibilidad)</option>
                    <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Calidad Máxima - Límites TPM)</option>
                    <option value="gemma2-9b-it">gemma2-9b-it (Equilibrado)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="password" 
                    placeholder="gsk_..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={() => saveApiKey(apiKeyInput)}
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    Guardar
                  </button>
                </div>
                {apiKey && (
                  <button 
                    onClick={() => saveApiKey('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-secondary)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left' }}
                  >
                    Borrar clave guardada
                  </button>
                )}
              </div>
            )}
          </div>

          <button className="btn btn-secondary" onClick={onBackToDashboard} style={{ fontSize: '0.85rem' }}>
            Volver
          </button>
        </div>
      </div>

      {/* Main split workarea */}
      <div className="analyzer-workarea" style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        
        {/* Left Side: Upload zone / File manager */}
        <div className="analyzer-sidebar" style={{
          width: files.length > 0 ? '360px' : '100%',
          transition: 'width 0.3s ease',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--card-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          justifyContent: files.length > 0 ? 'flex-start' : 'center',
          alignItems: 'stretch',
          padding: '20px'
        }}>
          {files.length === 0 ? (
            // Big Drop Zone
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                maxWidth: '640px',
                width: '100%',
                margin: '0 auto',
                padding: '60px 40px',
                border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--card-border)'}`,
                borderRadius: 'var(--radius-lg)',
                background: dragActive ? 'var(--accent-primary-glow)' : 'var(--bg-secondary)',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px'
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Upload size={32} />
              </div>
              
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
                  Arrastra tu carpeta o archivo .ZIP aquí
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '450px', margin: '0 auto', lineHeight: '1.5' }}>
                  Sube el código de tu proyecto escolar para mapearlo de inmediato. Se omitirán directorios pesados automáticamente (node_modules, .git, etc.).
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCode size={16} />
                  <span>Subir Archivo .ZIP</span>
                  <input 
                    type="file" 
                    accept=".zip" 
                    onChange={(e) => handleFileInput(e, false)} 
                    style={{ display: 'none' }} 
                  />
                </label>

                <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder size={16} />
                  <span>Subir Carpeta</span>
                  <input 
                    type="file" 
                    directory="" 
                    webkitdirectory="" 
                    multiple
                    onChange={(e) => handleFileInput(e, true)} 
                    style={{ display: 'none' }} 
                  />
                </label>
              </div>
            </div>
          ) : (
            // Small Sidebar File Explorer
            <>
              <div style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '1px solid var(--card-border)',
                paddingBottom: '12px'
              }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, wordBreak: 'break-all' }}>📦 {projectName}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {files.length} archivos cargados
                  </span>
                </div>
                <button 
                  onClick={() => setFiles([])} 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-secondary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cambiar
                </button>
              </div>

              {/* Actions Box */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Análisis Tutor AI
                </span>
                
                <button 
                  className={`btn ${analysisTab === 'explanation' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleRunAiAnalysis('explanation')}
                  style={{ fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
                >
                  <Cpu size={14} style={{ marginRight: '8px' }} />
                  Explicar Código y Arquitectura
                </button>

                <button 
                  className={`btn ${analysisTab === 'documentation' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleRunAiAnalysis('documentation')}
                  style={{ fontSize: '0.8rem', width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}
                >
                  <FileText size={14} style={{ marginRight: '8px' }} />
                  Generar Wiki de Documentación
                </button>

                {/* Index button */}
                {(explanationContent || documentationContent) && (
                  <button 
                    className="btn btn-primary"
                    onClick={handleIndexInWiki}
                    style={{ 
                      fontSize: '0.8rem', 
                      width: '100%', 
                      padding: '8px 12px',
                      background: '#10b981',
                      borderColor: '#10b981',
                      marginTop: '4px'
                    }}
                  >
                    <CheckCircle size={14} style={{ marginRight: '8px' }} />
                    Guardar en Wiki fUSphere
                  </button>
                )}
              </div>

              {/* File Explorer Tree view */}
              <h5 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>
                Explorador de Archivos
              </h5>
              
              <div className="file-explorer-tree" style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                background: 'var(--bg-secondary)'
              }}>
                {files.map(f => (
                  <div 
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      background: selectedFile?.path === f.path ? 'var(--accent-primary-glow)' : 'transparent',
                      color: selectedFile?.path === f.path ? 'var(--accent-primary)' : 'var(--text-primary)',
                      transition: 'background 0.15s ease',
                      gap: '8px'
                    }}
                  >
                    {getFileIcon(f.name)}
                    <span 
                      style={{ 
                        flex: 1, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        direction: 'rtl',
                        textAlign: 'left'
                      }}
                      title={f.path}
                    >
                      {f.path}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {formatBytes(f.size)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Side: File preview and analyzer reports */}
        {files.length > 0 && (
          <div className="analyzer-content" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg-primary)'
          }}>
            
            {/* View selectors */}
            <div className="analyzer-tabs" style={{
              display: 'flex',
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--card-border)',
              padding: '0 20px',
              height: '48px',
              alignItems: 'stretch'
            }}>
              <button 
                className={`tab-btn ${analysisTab === 'summary' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('summary')}
                style={{
                  padding: '0 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: analysisTab === 'summary' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: analysisTab === 'summary' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Resumen de Dependencias
              </button>

              <button 
                className={`tab-btn ${analysisTab === 'explanation' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('explanation')}
                style={{
                  padding: '0 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: analysisTab === 'explanation' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: analysisTab === 'explanation' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Explicación del Proyecto
              </button>

              <button 
                className={`tab-btn ${analysisTab === 'documentation' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('documentation')}
                style={{
                  padding: '0 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: analysisTab === 'documentation' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: analysisTab === 'documentation' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Wiki / Documentación
              </button>

              <button 
                className={`tab-btn ${analysisTab === 'chat' ? 'active' : ''}`}
                onClick={() => setAnalysisTab('chat')}
                style={{
                  padding: '0 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: analysisTab === 'chat' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: analysisTab === 'chat' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Preguntar a la IA
              </button>

              {selectedFile && (
                <button 
                  className={`tab-btn ${analysisTab === 'file-preview' ? 'active' : ''}`}
                  onClick={() => setAnalysisTab('file-preview')}
                  style={{
                    padding: '0 20px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: analysisTab === 'file-preview' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: analysisTab === 'file-preview' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    marginLeft: 'auto'
                  }}
                >
                  Vista de Archivo: {selectedFile.name}
                </button>
              )}
            </div>

            {/* Content view body */}
            <div className="analyzer-panel-body" style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px'
            }}>
              
              {loading ? (
                // Loading Spinner
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '100px 0',
                  gap: '16px'
                }}>
                  <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-primary)' }} />
                  <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{loadingStep}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Esto podría demorar unos segundos...</p>
                </div>
              ) : (
                <>
                  {/* SUMMARY TAB */}
                  {analysisTab === 'summary' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Welcome analysis card */}
                      <div style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}>
                        <div style={{
                          background: 'var(--accent-primary-glow)',
                          color: 'var(--accent-primary)',
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Cpu size={24} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Mapeo de Entorno completado con Éxito</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Hemos analizado los archivos cargados de <strong>{projectName}</strong> y categorizado su stack tecnológico. Revisa abajo qué herramientas necesitas instalar para levantarlo.
                          </p>
                        </div>
                      </div>

                      {/* Main stats indicators */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '16px'
                      }}>
                        
                        {/* Langs box */}
                        <div style={{
                          border: '1px solid var(--card-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Lenguajes de Programación
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {heuristics.languages.length > 0 ? (
                              heuristics.languages.map(l => (
                                <span key={l} style={{
                                  background: 'var(--bg-tertiary)',
                                  color: 'var(--text-primary)',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500
                                }}>
                                  {l}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No detectados</span>
                            )}
                          </div>
                        </div>

                        {/* Frameworks & Libraries box */}
                        <div style={{
                          border: '1px solid var(--card-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Frameworks e Integraciones
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {heuristics.dependencies.length > 0 ? (
                              heuristics.dependencies.map(d => (
                                <span key={d} style={{
                                  background: 'var(--accent-primary-glow)',
                                  color: 'var(--accent-primary)',
                                  padding: '4px 10px',
                                  borderRadius: '20px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}>
                                  {d}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ninguno detectado</span>
                            )}
                          </div>
                        </div>

                        {/* Recommended Category */}
                        <div style={{
                          border: '1px solid var(--card-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Categoría Sugerida en Wiki
                          </span>
                          <span style={{
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: 'var(--accent-primary)'
                          }}>
                            {heuristics.recommendedCategory}
                          </span>
                        </div>
                      </div>

                      {/* Tool dependencies warnings / Requirements list */}
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Database size={16} />
                          Herramientas Externas Requeridas
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {heuristics.externalTools.length > 0 ? (
                            heuristics.externalTools.map(tool => (
                              <div 
                                key={tool.name}
                                style={{
                                  border: '1px solid var(--card-border)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '16px',
                                  display: 'flex',
                                  gap: '14px',
                                  alignItems: 'flex-start'
                                }}
                              >
                                <div style={{
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  color: '#e37400',
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <AlertCircle size={18} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {tool.name}
                                  </h5>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                    {tool.description}
                                  </p>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    <strong>Objetivo:</strong> {tool.purpose}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div style={{
                              padding: '24px',
                              textAlign: 'center',
                              border: '1px dashed var(--card-border)',
                              borderRadius: 'var(--radius-md)',
                              color: 'var(--text-secondary)',
                              fontSize: '0.85rem'
                            }}>
                              No se detectaron dependencias de software o bases de datos complejas. Este parece ser un proyecto frontend estático o librería sin herramientas externas pesadas.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next steps educational suggestions */}
                      <div style={{
                        marginTop: '12px',
                        borderTop: '1px solid var(--card-border)',
                        paddingTop: '20px'
                      }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                          💡 ¿Qué deseas hacer a continuación?
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                          <div 
                            onClick={() => handleRunAiAnalysis('explanation')}
                            style={{
                              border: '1px solid var(--card-border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: 'var(--bg-secondary)'
                            }}
                            className="hover-card-action"
                          >
                            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                              Generar Explicación Académica ➔
                            </h5>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              El Tutor AI analizará el código fuente y generará una guía comprensiva de la arquitectura y flujo lógico.
                            </p>
                          </div>

                          <div 
                            onClick={() => handleRunAiAnalysis('documentation')}
                            style={{
                              border: '1px solid var(--card-border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              background: 'var(--bg-secondary)'
                            }}
                            className="hover-card-action"
                          >
                            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                              Documentar en Wiki ➔
                            </h5>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Generará un archivo README estructurado listo para ser guardado y consultado en el dashboard de fUSphere.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EXPLANATION TAB */}
                  {analysisTab === 'explanation' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                      {explanationContent ? (
                        <>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            background: 'var(--bg-secondary)',
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--card-border)'
                          }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
                              Explicación autogenerada por el Tutor Académico
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleDownloadSummary('explanation', explanationContent)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                <Download size={14} />
                                <span>Descargar (.md)</span>
                              </button>
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleRunAiAnalysis('explanation')}
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                Volver a analizar
                              </button>
                            </div>
                          </div>
                          <MarkdownRenderer content={explanationContent} onOpenInPlayground={onOpenInPlayground} />
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                          <Cpu size={40} style={{ color: 'var(--text-muted)' }} />
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Aún no se ha analizado el código</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '8px auto 0' }}>
                              Haz clic en el botón de abajo para que el Tutor AI fUSphere explique detalladamente el flujo de este proyecto.
                            </p>
                          </div>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleRunAiAnalysis('explanation')}
                            style={{ marginTop: '8px' }}
                          >
                            Explicar Lógica e Interfaces
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DOCUMENTATION TAB */}
                  {analysisTab === 'documentation' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                      {documentationContent ? (
                        <>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '16px',
                            background: 'var(--bg-secondary)',
                            padding: '10px 16px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--card-border)'
                          }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
                              Guía de instalación y uso documentada
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleDownloadSummary('documentation', documentationContent)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                <Download size={14} />
                                <span>Descargar (.md)</span>
                              </button>
                              <button 
                                className="btn btn-primary"
                                onClick={handleIndexInWiki}
                                style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                              >
                                Indexar en Wiki
                              </button>
                              <button 
                                className="btn btn-secondary"
                                onClick={() => handleRunAiAnalysis('documentation')}
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                              >
                                Re-generar
                              </button>
                            </div>
                          </div>
                          <MarkdownRenderer content={documentationContent} onOpenInPlayground={onOpenInPlayground} />
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                          <FileText size={40} style={{ color: 'var(--text-muted)' }} />
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Guía de Documentación no creada</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '8px auto 0' }}>
                              Genera un artículo de documentación completo (README estructurado) listo para agregarlo a tu espacio de estudio local.
                            </p>
                          </div>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleRunAiAnalysis('documentation')}
                            style={{ marginTop: '8px' }}
                          >
                            Crear Wiki de Proyecto
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CHAT TAB */}
                  {analysisTab === 'chat' && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: 'calc(100vh - 200px)',
                      maxHeight: '600px',
                      maxWidth: '850px',
                      margin: '0 auto',
                      border: '1px solid var(--card-border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      background: 'var(--bg-primary)'
                    }}>
                      {/* Chat header panel */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 20px',
                        background: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--card-border)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tutor AI Académico (Conversación)</span>
                          <span style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            background: 'var(--bg-tertiary)',
                            padding: '2px 8px',
                            borderRadius: '10px'
                          }}>
                            Memoria: {chatMessages.length} / 20
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary"
                            onClick={handleExportChat}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            <Download size={12} />
                            <span>Exportar (.txt)</span>
                          </button>
                          
                          <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.75rem', cursor: 'pointer' }}>
                            <Upload size={12} />
                            <span>Importar (.txt)</span>
                            <input 
                              type="file" 
                              accept=".txt,.json" 
                              onChange={handleImportChat} 
                              style={{ display: 'none' }} 
                            />
                          </label>
                        </div>
                      </div>

                      {/* Chat Messages scrollbox */}
                      <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        background: 'var(--bg-secondary)'
                      }}>
                        {chatMessages.map((msg) => (
                          <div 
                            key={msg.id} 
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                              width: '100%'
                            }}
                          >
                            <div style={{
                              maxWidth: '85%',
                              background: msg.sender === 'user' ? 'var(--accent-primary)' : 'var(--card-bg)',
                              color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary)',
                              border: msg.sender === 'user' ? 'none' : '1px solid var(--card-border)',
                              borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              padding: '12px 16px',
                              fontSize: '0.85rem',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              lineHeight: '1.5',
                              wordBreak: 'break-word'
                            }}>
                              {msg.sender === 'user' ? (
                                <p style={{ margin: 0 }}>{msg.text}</p>
                              ) : (
                                <MarkdownRenderer content={msg.text} onOpenInPlayground={onOpenInPlayground} />
                              )}
                            </div>
                            <span style={{
                              fontSize: '0.7rem',
                              color: 'var(--text-muted)',
                              marginTop: '4px',
                              marginRight: msg.sender === 'user' ? '4px' : '0',
                              marginLeft: msg.sender === 'bot' ? '4px' : '0'
                            }}>
                              {msg.sender === 'user' ? 'Estudiante' : 'Tutor AI'} • {msg.timestamp}
                            </span>
                          </div>
                        ))}
                        
                        {isChatLoading && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', paddingLeft: '4px' }}>
                            <RefreshCw className="animate-spin" size={14} />
                            <span>Tutor AI escribiendo...</span>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Chat text box input form */}
                      <form 
                        onSubmit={handleSendChatMessage}
                        style={{
                          display: 'flex',
                          padding: '16px',
                          borderTop: '1px solid var(--card-border)',
                          background: 'var(--bg-primary)',
                          gap: '10px'
                        }}
                      >
                        <input 
                          type="text"
                          placeholder="Pregúntale al tutor sobre el código, las dependencias o el proyecto..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={isChatLoading}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '24px',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            outline: 'none'
                          }}
                        />
                        <button 
                          type="submit"
                          className="btn btn-primary"
                          disabled={!chatInput.trim() || isChatLoading}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '24px',
                            fontSize: '0.85rem'
                          }}
                        >
                          Preguntar
                        </button>
                      </form>
                    </div>
                  )}

                  {/* FILE PREVIEW TAB */}
                  {analysisTab === 'file-preview' && selectedFile && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--bg-secondary)',
                        padding: '10px 16px',
                        border: '1px solid var(--card-border)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {getFileIcon(selectedFile.name)}
                            {selectedFile.path}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Tamaño: {formatBytes(selectedFile.size)}
                          </span>
                        </div>

                        {selectedFile.name.endsWith('.js') || selectedFile.name.endsWith('.jsx') ? (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleRunSelectedInPlayground(selectedFile)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}
                          >
                            <Play size={14} />
                            <span>Ejecutar en Playground</span>
                          </button>
                        ) : null}
                      </div>

                      {/* Code reader container */}
                      <pre style={{
                        flex: 1,
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--card-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        maxHeight: '600px'
                      }}>
                        {selectedFile.content || '// El archivo está vacío o no contiene texto legible.'}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
