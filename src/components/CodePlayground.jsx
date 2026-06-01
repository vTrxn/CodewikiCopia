import { useState } from 'react';
import { Play, RotateCcw, Trash2, Code, Terminal, Download, ArrowLeft } from 'lucide-react';

export default function CodePlayground({ initialCode, onBackToArticle }) {
  const [code, setCode] = useState(() => {
    if (initialCode) return initialCode;
    return `// Escribe tu código JavaScript aquí\n\nfunction saludar(nombre) {\n  return "¡Hola " + nombre + " bienvenido a fUSphere!";\n}\n\nconst mensaje = saludar("Estudiante");\nconsole.log(mensaje);\n\n// Intenta estructurar un array o un objeto\nconst curso = {\n  nombre: "Desarrollo Web",\n  universidad: "Uniempresarial",\n  semestre: 2026\n};\nconsole.log(curso);\n`;
  });

  const [logs, setLogs] = useState(() => {
    if (initialCode) {
      return [
        { type: 'system', content: 'Consola de fUSphere Inicializada.' },
        { type: 'system', content: 'Código cargado desde el repositorio.' },
        { type: 'system', content: 'Listo para ejecutar.' }
      ];
    }
    return [
      { type: 'system', content: 'Consola de fUSphere Inicializada.' },
      { type: 'system', content: 'Escribe JavaScript en el editor de la izquierda y haz clic en "Ejecutar Código".' }
    ];
  });

  const [terminalInput, setTerminalInput] = useState('');

  // Derived state: compute line numbers directly from the code
  const lines = Array.from({ length: Math.max(1, code.split('\n').length) }, (_, idx) => idx + 1);

  const runCode = () => {
    const outputLogs = [];
    const simulatedConsole = {
      log: (...args) => {
        const formatted = args.map(arg => {
          if (arg === null) return 'null';
          if (arg === undefined) return 'undefined';
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        outputLogs.push({ type: 'log', content: formatted });
      },
      error: (...args) => {
        outputLogs.push({ type: 'error', content: args.join(' ') });
      },
      warn: (...args) => {
        outputLogs.push({ type: 'warn', content: args.join(' ') });
      },
      info: (...args) => {
        outputLogs.push({ type: 'info', content: args.join(' ') });
      }
    };

    try {
      setLogs([
        { type: 'system', content: 'Ejecutando...' }
      ]);
      
      // Sandbox compilation and execution
      // We pass the simulated console to a Function wrapper
      const executionFn = new Function('console', code);
      executionFn(simulatedConsole);

      if (outputLogs.length === 0) {
        setLogs([
          { type: 'system', content: 'Código ejecutado exitosamente sin salidas de consola.' }
        ]);
      } else {
        setLogs([
          { type: 'system', content: '--- Salida de ejecución ---' },
          ...outputLogs
        ]);
      }
    } catch (error) {
      setLogs([
        { type: 'system', content: '--- Error de compilación/ejecución ---' },
        { type: 'error', content: `${error.name}: ${error.message}` }
      ]);
    }
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    setTerminalInput('');
    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();

    // Log entered command
    setLogs(prev => [...prev, { type: 'system', content: `$ ${cmd}` }]);

    switch (mainCmd) {
      case 'help':
        setLogs(prev => [
          ...prev,
          { type: 'info', content: 'Comandos disponibles:' },
          { type: 'info', content: '  run | node       - Ejecuta el código del editor' },
          { type: 'info', content: '  clear | cls      - Limpia la consola' },
          { type: 'info', content: '  reset            - Reinicia el editor al código base' },
          { type: 'info', content: '  ls               - Enumera los archivos virtuales del proyecto' },
          { type: 'info', content: '  cat [archivo]    - Muestra el contenido de un archivo virtual' }
        ]);
        break;
      case 'run':
      case 'node':
        runCode();
        break;
      case 'clear':
      case 'cls':
        clearConsole();
        break;
      case 'reset':
        resetCode();
        break;
      case 'ls':
        setLogs(prev => [
          ...prev,
          { type: 'log', content: 'src/App.jsx' },
          { type: 'log', content: 'src/main.jsx' },
          { type: 'log', content: 'package.json' },
          { type: 'log', content: 'README.md' }
        ]);
        break;
      case 'cat': {
        const file = parts[1];
        if (!file) {
          setLogs(prev => [...prev, { type: 'error', content: 'Error: Especifica un archivo. Ej: cat README.md' }]);
        } else if (file.toLowerCase() === 'readme.md') {
          setLogs(prev => [
            ...prev,
            { type: 'log', content: '--- README.md ---' },
            { type: 'log', content: 'fUSphere Sandbox Environment\nEntorno interactivo para pruebas de algoritmos y componentes en JavaScript de Uniempresarial.' }
          ]);
        } else if (file.toLowerCase() === 'package.json') {
          setLogs(prev => [
            ...prev,
            { type: 'log', content: '{\n  "name": "fusphere-sandbox",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^19.2.6"\n  }\n}' }
          ]);
        } else {
          setLogs(prev => [...prev, { type: 'error', content: `Error: Archivo "${file}" no encontrado.` }]);
        }
        break;
      }
      default:
        setLogs(prev => [...prev, { type: 'error', content: `Comando no reconocido: "${cmd}". Escribe "help" para ver la lista de comandos.` }]);
    }
  };

  const clearConsole = () => {
    setLogs([{ type: 'system', content: 'Consola limpia.' }]);
  };

  const resetCode = () => {
    setCode(`// Escribe tu código JavaScript aquí\n\nfunction saludar(nombre) {\n  return "¡Hola " + nombre + " bienvenido a fUSphere!";\n}\n\nconst mensaje = saludar("Estudiante");\nconsole.log(mensaje);\n`);
    setLogs([{ type: 'system', content: 'Código reiniciado al estado por defecto.' }]);
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playground_script.js';
    a.click();
    URL.revokeObjectURL(url);
    setLogs(prev => [
      ...prev,
      { type: 'system', content: 'Archivo playground_script.js descargado exitosamente.' }
    ]);
  };

  const handleKeyDown = (e) => {
    // Support Tab character insertion
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      setCode(newCode);
      // Reset cursor position
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="playground-layout animate-fade-in">
      <div className="playground-header">
        <div className="playground-header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackToArticle && (
            <button 
              className="btn btn-secondary animate-fade-in" 
              onClick={onBackToArticle} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
              title="Volver a los detalles del repositorio"
            >
              <ArrowLeft size={14} />
              <span>Volver al Repositorio</span>
            </button>
          )}
          <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
            <Code size={20} />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Entorno de Código Interactivo</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(JavaScript Sandbox)</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={resetCode} title="Restaurar código base">
            <RotateCcw size={16} />
            <span>Reiniciar</span>
          </button>
          <button className="btn btn-secondary" onClick={clearConsole} title="Limpiar la consola">
            <Trash2 size={16} />
            <span>Limpiar Consola</span>
          </button>
          <button className="btn btn-secondary" onClick={downloadCode} title="Descargar código como archivo .js">
            <Download size={16} />
            <span>Descargar .js</span>
          </button>
          <button className="btn btn-accent" onClick={runCode} title="Correr script">
            <Play size={16} />
            <span>Ejecutar Código</span>
          </button>
        </div>
      </div>

      <div className="playground-grid">
        <div className="playground-editor-pane">
          <div className="editor-pane-header">
            <span>Editor de Código JavaScript</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Consola disponible vía console.log()</span>
          </div>
          
          <div className="playground-code-area">
            <div className="playground-line-numbers">
              {lines.map((num) => (
                <div key={num}>{num}</div>
              ))}
            </div>
            <textarea
              className="playground-textarea"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck="false"
              placeholder="// Escribe tu código JS aquí..."
            />
          </div>
        </div>

        <div className="playground-sidebar-pane">
          <div className="terminal-header">
            <Terminal size={14} style={{ color: 'var(--accent-secondary)' }} />
            <span>Terminal y Salidas</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              <span className="terminal-dot terminal-dot-red"></span>
              <span className="terminal-dot terminal-dot-yellow"></span>
              <span className="terminal-dot terminal-dot-green"></span>
            </div>
          </div>

          <div className="terminal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100% - 37px)', padding: '16px' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
              {logs.map((log, idx) => {
                if (log.type === 'system') {
                  return (
                    <div key={idx} className="terminal-line system" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                      <span>{log.content}</span>
                    </div>
                  );
                }
                return (
                  <div key={idx} className={`terminal-line ${log.type}`} style={{ color: log.type === 'error' ? '#f87171' : log.type === 'info' ? '#60a5fa' : '#10b981', marginBottom: '8px' }}>
                    <span className="terminal-prompt-symbol" style={{ color: 'var(--accent-secondary)', fontWeight: 'bold', marginRight: '8px' }}>&gt;</span>
                    <span>{log.content}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleTerminalSubmit} style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <span className="terminal-prompt-symbol" style={{ color: 'var(--accent-secondary)', fontWeight: 'bold', marginRight: '8px' }}>$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Escribe un comando (help, run, clear, ls)..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
