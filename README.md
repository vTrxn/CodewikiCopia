# CodeWiki | Plataforma de Aprendizaje y Colaboración de Programación

**CodeWiki** es una plataforma interactiva de documentación, desarrollo de software y tutoría inteligente adaptada para estudiantes y profesores de la **Fundación Universitaria de la Cámara de Comercio de Bogotá - Uniempresarial**.

Este proyecto ha sido desarrollado como una Single Page Application (SPA) utilizando **React** y **Vite**, ofreciendo un diseño dinámico en modo oscuro con una base de datos local y un asistente de código interactivo.

---

##  Características Principales

### 1. Dashboard e Indexación de Artículos
- **Buscador Inteligente:** Filtra artículos en tiempo real por título, descripción, autor, etiquetas o categorías.
- **Categorías del Plan de Estudios:** Acceso rápido a temas clave como *Frontend, Backend, Estructuras de Datos, Algoritmos e Ingeniería de Software*.
- **Filtros por Dificultad:** Clasifica el contenido según el nivel académico (`Principiante`, `Intermedio`, `Avanzado`).

### 2. Lector Interactivo de Artículos
- **Navegación Lateral:** Sidebar con la estructura completa de los temas agrupados por áreas.
- **Tabla de Contenidos Dinámica:** Índice lateral autogenerado que permite saltar a secciones específicas del artículo mediante scroll suave.
- **Alertas Personalizadas:** Integración de bloques visuales informativos y advertencias al estilo GitHub (`> [!NOTE]`, `> [!WARNING]`).
- **Marcadores:** Sistema para guardar tus artículos favoritos y consultarlos de forma directa.

### 3. Editor Visual de Markdown
- **Previsualización en Tiempo Real:** Interfaz dividida (split-pane) que muestra el renderizado HTML de Markdown al instante mientras escribes.
- **Gestión de Metadatos:** Configuración intuitiva de categorías, dificultad, autor y un compilador visual de etiquetas.
- **Artículos Persistentes:** Creación y modificación de entradas guardadas directamente en el navegador.

### 4. Sandbox / Playground de Código
- **Editor Embebido:** Zona de edición JavaScript con numeración de líneas y tabulaciones automáticas.
- **Consola de Ejecución:** Entorno seguro local que intercepta las llamadas a `console.log()` y `console.error()`, imprimiendo el resultado de la ejecución del código directamente en una terminal simulada.
- **Integración Directa:** Carga rápida del código de los artículos del curso hacia el playground en un solo clic.

### 5. Tutor AI Académico (Asistente Integrado)
- **Chat Flotante:** Panel de ayuda técnica disponible desde cualquier pantalla.
- **Respuestas Inteligentes:** Responde preguntas sobre conceptos complejos (useState, QuickSort, Git, etc.), muestra bloques de código funcionales y recomienda lecturas relacionadas dentro de la wiki.

---

##  Stack Tecnológico

- **Framework:** React 19
- **Bundler:** Vite
- **Iconografía:** Lucide React
- **Estilos:** CSS3 nativo con diseño fluído (Flexbox, Grid), variables HSL y diseño responsivo para dispositivos móviles.
- **Almacenamiento:** Inicializado mediante archivo de semilla `src/data/initialData.json` y persistencia completa en el navegador a través de la API `localStorage`.

---

##  Arquitectura de Datos y Persistencia

La aplicación implementa una estrategia de persistencia local sin dependencias de bases de datos externas:

1. **Carga Inicial:** Al abrir la aplicación por primera vez, el sistema lee los artículos pre-redactados de `initialData.json` y los guarda en la llave `wiki_articles` de `localStorage`.
2. **Ciclo CRUD:** Cualquier nuevo artículo, edición, borrado o cambio en los marcadores se guarda de forma asíncrona en el almacenamiento local.
3. **Resiliencia:** El contenido editado y los artículos agregados persisten entre recargas de la página o cierres del navegador.

---

##  Instalación y Uso Local

Sigue los siguientes pasos para ejecutar el proyecto en tu máquina local:

### Requisitos Previos

- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### Pasos

1. **Clonar o copiar el proyecto** a tu directorio local.
2. **Abrir la terminal** en la carpeta raíz del proyecto.
3. **Instalar dependencias:**
   ```bash
   npm install
   ```
4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
5. **Acceder a la aplicación:** Abre tu navegador e ingresa a la URL local generada por Vite (usualmente `http://localhost:5173`).

---

##  Compilación para Producción

Para generar el paquete listo para despliegue (hosting en GitHub Pages, Vercel, Netlify, etc.), ejecuta:

```bash
npm run build
```

Los archivos estáticos optimizados se generarán en la carpeta `dist/`.

---
