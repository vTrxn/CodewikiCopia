import { useState, useEffect, useRef } from 'react';
import { Send, X, Bot, Play } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function ChatbotPanel({ isOpen, contextArticle, onOpenInPlayground }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: contextArticle ? `¡Hola! Soy el Tutor fUSphere AI. Veo que estás explorando **${contextArticle.title}**. ¿Tienes alguna pregunta sobre este repositorio o su código?` : '¡Hola! Soy el Tutor fUSphere AI. ¿En qué te puedo ayudar?'
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    const queryText = inputValue;
    setInputValue('');
    setIsTyping(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY || localStorage.getItem('fusoft_groq_api_key') || '';

    if (!apiKey) {
      // Simulate/Fallback Mock Response
      setTimeout(() => {
        let botResponseText;
        let recommendedArticle = null;
        let snippet = null;
        const query = queryText.toLowerCase().trim();

        if (query.includes('state') || query.includes('usestate') || query.includes('react') || query.includes('estado')) {
          recommendedArticle = articles.find(a => a.id === 'fusoft-vite-react-boilerplate');
          botResponseText = 'En React, el **estado** representa los datos dinámicos de un componente. Para manejarlo en componentes funcionales, usamos el hook `useState`.\n\nAquí tienes un ejemplo básico de un contador utilizando React:';
          snippet = `const [contador, setContador] = useState(0);\n// Para actualizar:\nsetContador(contador + 1);`;
        } else if (query.includes('quicksort') || query.includes('ordenamiento') || query.includes('algoritmo')) {
          recommendedArticle = articles.find(a => a.id === 'uniempresarial-algorithms-playground');
          botResponseText = 'El algoritmo **QuickSort** utiliza el enfoque de "Divide y Vencerás". Elige un pivote, ordena los menores a la izquierda y los mayores a la derecha recursivamente. Es un algoritmo sumamente rápido con una complejidad promedio de O(n log n).';
          snippet = `function quicksort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivote = arr[arr.length - 1];\n  const izq = arr.filter((x, i) => x < pivote && i < arr.length - 1);\n  const der = arr.filter(x => x >= pivote);\n  return [...quicksort(izq), pivote, ...quicksort(der)];\n}`;
        } else if (query.includes('lista') || query.includes('enlazada') || query.includes('estructura')) {
          recommendedArticle = articles.find(a => a.id === 'fusoft-educational-data-structures');
          botResponseText = 'Una **Lista Simplemente Enlazada** es una colección de nodos enlazados mediante punteros en memoria no contigua. Cada nodo almacena su valor y un puntero al nodo `siguiente`. A diferencia de los arrays, insertar elementos al inicio toma O(1), pero buscar elementos toma O(n).';
          snippet = `class Nodo {\n  constructor(valor) {\n    this.valor = valor;\n    this.siguiente = null;\n  }\n}`;
        } else if (query.includes('nest') || query.includes('clean') || query.includes('arquitectura') || query.includes('ddd')) {
          recommendedArticle = articles.find(a => a.id === 'fusoft-clean-architecture-nestjs');
          botResponseText = 'La **Arquitectura Limpia** e inyección de dependencias separan el núcleo del negocio (Dominio y Casos de Uso) de los detalles tecnológicos (Bases de datos, NestJS). Esto permite cambiar piezas de infraestructura sin alterar la lógica corporativa.';
          snippet = `// Caso de Uso puro de Dominio\nclass CrearProyecto {\n  constructor(proyectoRepo) {\n    this.repo = proyectoRepo;\n  }\n  async ejecutar(id, titulo) {\n    const p = new Proyecto(id, titulo);\n    return this.repo.guardar(p);\n  }\n}`;
        } else if (query.includes('express') || query.includes('api') || query.includes('postgres') || query.includes('backend') || query.includes('jwt')) {
          recommendedArticle = articles.find(a => a.id === 'uniempresarial-express-postgresql-api');
          botResponseText = 'Nuestra API base en Express con PostgreSQL utiliza Prisma ORM para las consultas relacionales y JWT para la protección de endpoints académicos. Aquí tienes el middleware básico de validación JWT:';
          snippet = `const jwt = require('jsonwebtoken');\nconst decoded = jwt.verify(token, process.env.JWT_SECRET);\nreq.user = decoded;`;
        } else {
          const matched = articles.find(a => 
            a.title.toLowerCase().includes(query) || 
            a.description.toLowerCase().includes(query)
          );

          if (matched) {
            recommendedArticle = matched;
            botResponseText = `Encontré un repositorio relacionado con tu pregunta: **"${matched.title}"**. Explica detalladamente este tema e incluye ejemplos prácticos de código.`;
          } else {
            botResponseText = 'Lo siento, no tengo una respuesta precisa para esa consulta en mi base académica actual. Sin embargo, puedes explorar los repositorios disponibles o utilizar el **Playground** para realizar pruebas de código directamente en JavaScript.\n\n*(Nota: Configura una API Key en el archivo .env para habilitar al tutor en tiempo real con Groq)*';
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
      return;
    }

    // Call Real Groq API
    try {
      // Build conversation history for context
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add new user message
      chatHistory.push({ role: 'user', content: queryText });

      // Insert System Prompt at the beginning
      const systemPrompt = `Eres el Asistente Académico / Tutor de fUSphere, una plataforma educativa de Uniempresarial y fUSoft.
Tienes acceso a los siguientes repositorios de código real en la base académica:
${articles.map(art => `- **${art.title}** (Categoría: ${art.category}, Dificultad: ${art.difficulty}, ID: ${art.id}): ${art.description}`).join('\n')}

Responde las preguntas de los estudiantes de forma didáctica, clara, y estructurada. Puedes explicar algoritmos, buenas prácticas y analizar códigos. Usa Markdown para dar un formato claro.
IMPORTANTE: 
1. Si haces referencia a alguno de los repositorios del catálogo, menciona claramente su ID (ej. fusoft-vite-react-boilerplate, uniempresarial-algorithms-playground, etc.) en tu texto para que el sistema le sugiera un enlace directo.
2. Si incluyes un fragmento de código, asegúrate de envolverlo en bloques de código de triple acento grave (\`\`\`javascript ... \`\`\`) para que el usuario pueda abrirlo y ejecutarlo en el Playground.`;

      chatHistory.unshift({ role: 'system', content: systemPrompt });

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: chatHistory,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || 'Error de comunicación con Groq.');
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      // Extract recommended article
      const matchedArticle = articles.find(art => 
        responseText.toLowerCase().includes(art.id.toLowerCase())
      );

      // Extract snippet code block
      const codeBlockRegex = /```(?:javascript|typescript|js|json|html|css)?\s*([\s\S]*?)```/i;
      const codeMatch = responseText.match(codeBlockRegex);
      const snippet = codeMatch ? codeMatch[1].trim() : null;

      const botMessage = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: responseText,
        article: matchedArticle || null,
        snippet: snippet
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: `Lo siento, ocurrió un error al comunicarme con el motor de IA de Groq: ${err.message || 'Error desconocido'}.\n\nReajustando al modo simulación académica...`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
      <div className="chatbot-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', right: '24px', bottom: '24px', width: '350px', height: '500px', display: 'flex', flexDirection: 'column', border: '1px solid var(--card-border)', borderRadius: '12px', background: 'var(--bg-secondary)', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        <div className="chatbot-header" style={{ borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
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
        </div>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.sender}`}>
              {msg.sender === 'bot' ? (
                <div className="chat-bubble-markdown">
                  <MarkdownRenderer content={msg.text} />
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
              )}
              
              {msg.snippet && (
                <div style={{ marginTop: '10px' }}>
                  <code className="chat-bubble-code">{msg.snippet}</code>
                  {onOpenInPlayground && (
                    <button 
                      onClick={() => {
                        onOpenInPlayground(msg.snippet);
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
  );
}
