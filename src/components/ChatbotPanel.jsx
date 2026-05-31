import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Bot, Sparkles, Code, Play } from 'lucide-react';

export default function ChatbotPanel({ isOpen, onClose, articles, onOpenArticle, onOpenInPlayground }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! Soy el Asistente Académico de fUSphere. 🎓\n\nPuedes preguntarme sobre conceptos de programación, pedirme que te explique un código o que te recomiende artículos sobre temas específicos como React, Promesas, QuickSort o Listas Enlazadas.'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue.toLowerCase().trim();
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking and smart responses based on categories & article content
    setTimeout(() => {
      let botResponseText = '';
      let recommendedArticle = null;
      let snippet = null;

      if (query.includes('state') || query.includes('usestate') || query.includes('react') || query.includes('estado')) {
        recommendedArticle = articles.find(a => a.id === 'intro-react-state');
        botResponseText = 'En React, el **estado** representa los datos dinámicos de un componente. Para manejarlo en componentes funcionales, usamos el hook `useState`.\n\nAquí tienes un ejemplo básico de un contador utilizando React:';
        snippet = `const [contador, setContador] = useState(0);\n// Para actualizar:\nsetContador(contador + 1);`;
      } else if (query.includes('quicksort') || query.includes('ordenamiento') || query.includes('algoritmo')) {
        recommendedArticle = articles.find(a => a.id === 'algorithm-quicksort');
        botResponseText = 'El algoritmo **QuickSort** utiliza el enfoque de "Divide y Vencerás". Elige un pivote, ordena los menores a la izquierda y los mayores a la derecha recursivamente. Es un algoritmo sumamente rápido con una complejidad promedio de O(n log n).';
        snippet = `function quicksort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivote = arr[arr.length - 1];\n  const izq = arr.filter((x, i) => x < pivote && i < arr.length - 1);\n  const der = arr.filter(x => x >= pivote);\n  return [...quicksort(izq), pivote, ...quicksort(der)];\n}`;
      } else if (query.includes('lista') || query.includes('enlazada') || query.includes('estructura')) {
        recommendedArticle = articles.find(a => a.id === 'linked-list-basics');
        botResponseText = 'Una **Lista Simplemente Enlazada** es una colección de nodos enlazados mediante punteros en memoria no contigua. Cada nodo almacena su valor y un puntero al nodo `siguiente`. A diferencia de los arrays, insertar elementos al inicio toma O(1), pero buscar elementos toma O(n).';
        snippet = `class Nodo {\n  constructor(valor) {\n    this.valor = valor;\n    this.siguiente = null;\n  }\n}`;
      } else if (query.includes('git') || query.includes('commit') || query.includes('workflow')) {
        recommendedArticle = articles.find(a => a.id === 'git-workflow-university');
        botResponseText = 'Para proyectos universitarios en grupo, se recomienda usar **GitHub Flow**:\n1. Mantén la rama `main` siempre estable.\n2. Trabaja en ramas independientes (`git checkout -b feature/nombre`).\n3. Crea Pull Requests para integrar cambios con tus compañeros.';
        snippet = `git checkout -b feature/nueva-funcion\ngit add .\ngit commit -m "Agrega funcion"\ngit push origin feature/nueva-funcion`;
      } else if (query.includes('promesa') || query.includes('async') || query.includes('await') || query.includes('asincro')) {
        recommendedArticle = articles.find(a => a.id === 'javascript-async-await');
        botResponseText = 'La programación asíncrona en JavaScript se maneja con **Promesas** y la sintaxis moderna `async/await`. `async` declara que una función devuelve una promesa y `await` pausa la ejecución hasta que la promesa se cumpla.';
        snippet = `async function cargarDatos() {\n  try {\n    const response = await fetch('https://api.github.com');\n    const data = await response.json();\n    console.log(data);\n  } catch (err) {\n    console.error(err);\n  }\n}`;
      } else {
        // Fallback search match in headings/descriptions
        const matched = articles.find(a => 
          a.title.toLowerCase().includes(query) || 
          a.description.toLowerCase().includes(query)
        );

        if (matched) {
          recommendedArticle = matched;
          botResponseText = `Encontré un artículo relacionado con tu pregunta: **"${matched.title}"**. Explica detalladamente este tema e incluye ejemplos prácticos de código.`;
        } else {
          botResponseText = 'Lo siento, no tengo una respuesta precisa para esa consulta en mi base académica actual. Sin embargo, puedes explorar los artículos disponibles o utilizar el **Playground** para realizar pruebas de código directamente en JavaScript.';
        }
      }

      const botMessage = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: botResponseText,
        article: recommendedArticle,
        snippet: snippet
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="chatbot-panel-overlay animate-fade-in" onClick={onClose}>
      <div className="chatbot-panel" onClick={(e) => e.stopPropagation()}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600 }}>Tutor fUSphere AI</h3>
              <div className="chatbot-status-row">
                <span className="chatbot-status-dot"></span>
                <span>Asistente en línea</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
              
              {msg.snippet && (
                <div style={{ marginTop: '10px' }}>
                  <code className="chat-bubble-code">{msg.snippet}</code>
                  {onOpenInPlayground && (
                    <button 
                      onClick={() => {
                        onOpenInPlayground(msg.snippet);
                        onClose();
                      }}
                      className="btn btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: '6px', gap: '4px' }}
                    >
                      <Play size={10} />
                      <span>Abrir en Playground</span>
                    </button>
                  )}
                </div>
              )}

              {msg.article && (
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Artículo Recomendado:
                  </span>
                  <button 
                    onClick={() => {
                      onOpenArticle(msg.article);
                      onClose();
                    }}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', width: '100%', justifyContent: 'center' }}
                  >
                    Leer "{msg.article.title}"
                  </button>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="chatbot-bot-typing">
              <span className="chatbot-typing-dot"></span>
              <span className="chatbot-typing-dot"></span>
              <span className="chatbot-typing-dot"></span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input-area" onSubmit={handleSend}>
          <input 
            type="text" 
            placeholder="Pregúntame algo..." 
            className="chatbot-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="chatbot-send-btn">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
