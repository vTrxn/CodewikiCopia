import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trash2, Code, Info, Terminal, Settings } from 'lucide-react';

export default function CodePlayground({ initialCode }) {
  const [code, setCode] = useState('');
  const [logs, setLogs] = useState([
    { type: 'system', content: 'Consola de fUSphere Inicializada.' },
    { type: 'system', content: 'Escribe JavaScript en el editor de la izquierda y haz clic en "Ejecutar Código".' }
  ]);
  const [lines, setLines] = useState([1]);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setLogs([
        { type: 'system', content: 'Código cargado desde el artículo.' },
        { type: 'system', content: 'Listo para ejecutar.' }
      ]);
    } else {
      setCode(`// Escribe tu código JavaScript aquí\n\nfunction saludar(nombre) {\n  return "¡Hola " + nombre + " bienvenido a fUSphere!";\n}\n\nconst mensaje = saludar("Estudiante");\nconsole.log(mensaje);\n\n// Intenta estructurar un array o un objeto\nconst curso = {\n  nombre: "Desarrollo Web",\n  universidad: "Uniempresarial",\n  semestre: 2026\n};\nconsole.log(curso);\n`);
    }
  }, [initialCode]);

  // Sync line numbers
  useEffect(() => {
    const lineCount = code.split('\n').length;
    const lineArr = Array.from({ length: Math.max(1, lineCount) }, (_, idx) => idx + 1);
    setLines(lineArr);
  }, [code]);

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
            } catch (e) {
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

  const clearConsole = () => {
    setLogs([{ type: 'system', content: 'Consola limpia.' }]);
  };

  const resetCode = () => {
    setCode(`// Escribe tu código JavaScript aquí\n\nfunction saludar(nombre) {\n  return "¡Hola " + nombre + " bienvenido a fUSphere!";\n}\n\nconst mensaje = saludar("Estudiante");\nconsole.log(mensaje);\n`);
    setLogs([{ type: 'system', content: 'Código reiniciado al estado por defecto.' }]);
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
        <div className="playground-header-title">
          <div className="logo-icon" style={{ background: 'var(--accent-secondary-glow)', color: 'var(--accent-secondary)', padding: '6px', borderRadius: '8px' }}>
            <Code size={18} />
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

          <div className="terminal-body">
            {logs.map((log, idx) => {
              if (log.type === 'system') {
                return (
                  <div key={idx} className="terminal-line system">
                    <span>{log.content}</span>
                  </div>
                );
              }
              return (
                <div key={idx} className={`terminal-line ${log.type}`}>
                  <span className="terminal-prompt-symbol">&gt;</span>
                  <span>{log.content}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
