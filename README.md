# ⚽ MyTeamStats v2 - Gestor Inteligente de Equipos de Fútbol

**MyTeamStats** es una Progressive Web App (PWA) diseñada para llevar la gestión de equipos de fútbol amateur y semi-profesional al siguiente nivel. Olvídate de las hojas de cálculo dispersas; centraliza resultados, estadísticas avanzadas, análisis de rendimiento con IA y gestión de plantilla en una sola plataforma moderna y colaborativa.

---

## 📖 Índice de Contenidos

1. [Visión General](#visión-general)
2. [Funcionalidades Principales](#funcionalidades-principales)
    - [📝 Registro de Partidos](#1-registro-de-partidos-recorder)
    - [📊 Dashboard de Estadísticas](#2-dashboard-de-estadísticas-stats)
    - [👥 Gestión del Plantel](#3-gestión-del-plantel-squad)
    - [📅 Historial y Tablas](#4-historial-y-tablas-table)
    - [🏆 Progreso y Gamificación](#5-progreso-y-gamificación-progress)
    - [🧠 Entrenador IA](#6-entrenador-ia-coach)
    - [📱 Centro Social](#7-centro-social-social)
    - [⚙️ Administración y Nube](#8-administración-y-nube-settings)
3. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Stack Tecnológico](#stack-tecnológico)

---

## Visión General

La aplicación permite a los administradores registrar cada detalle de los encuentros, desde goles y asistencias hasta minutos jugados y tarjetas. Utiliza **Google Gemini AI** para analizar estos datos y ofrecer consejos tácticos, resúmenes de partidos y titulares periodísticos automáticos. Además, cuenta con sincronización en la nube mediante Firebase, permitiendo la colaboración de múltiples miembros del equipo con diferentes niveles de acceso.

---

## Funcionalidades Principales

### 1. Registro de Partidos (Recorder)
El corazón de la entrada de datos. Diseñado para ser rápido y preciso, incluso desde el borde del campo.

*   **Datos del Encuentro:** Fecha, rival, torneo y resultado rápido.
*   **Marcador Interactivo:** Control tipo "stepper" para goles a favor y en contra.
*   **Alineación Dinámica:** Carga jugadores, define titulares/suplentes/arqueros y asigna estadísticas individuales (Goles, Asistencias, Tarjetas).
*   **Incidencias y Cambios:** Registra sustituciones con cálculo automático de minutos jugados para los involucrados.
*   **Notas:** Espacio para crónicas o apuntes tácticos del partido.

### 2. Dashboard de Estadísticas (Stats)
Un panel de control visual para entender el estado de forma del equipo de un vistazo.

*   **KPIs:** Puntos, efectividad (%), goles a favor/contra y promedios.
*   **Índice de Consistencia:** Un algoritmo calcula la desviación estándar del rendimiento para determinar si el equipo es regular o "de rachas".
*   **Momentum:** Gráfico de barras visual que muestra la secuencia de resultados recientes.
*   **Calendario de Actividad:** Mapa de calor (estilo GitHub) que visualiza la frecuencia de partidos y resultados a lo largo del año.
*   **Análisis IA:** Generación automática de "Highlights" y consejos de mejora basados en datos recientes.

### 3. Gestión del Plantel (Squad)
Análisis profundo del rendimiento individual y colectivo.

*   **Tabla de Estadísticas:** Lista ordenable con PJ, Goles, Asistencias, Promedios (G/P, A/P), % de Victorias y Minutos jugados.
*   **Comparador de Jugadores:** Herramienta "Cara a Cara" que permite seleccionar hasta 3 jugadores y superponer sus métricas en un gráfico de radar.
*   **Mapa de Calor de Asociaciones (Chemistry):**
    *   Matriz visual que muestra qué parejas de jugadores rinden mejor juntas.
    *   Calcula un **"Impact Score"** basado en puntos obtenidos y goles generados cuando ambos coinciden en cancha.
*   **Perfiles Individuales:** Modals con foto, estadísticas históricas, récords personales y evolución.

### 4. Historial y Tablas (Table)
Base de datos histórica navegable y filtrable.

*   **Filtros Avanzados:** Por resultado (V/E/D), torneo, rival o año.
*   **Gráfico de Radar:** Compara visualmente el rendimiento de diferentes años en métricas clave.
*   **Perfil de Rival:** Al hacer clic en un rival, se despliega el historial completo contra ese equipo ("Padre/Hijo"), con estadísticas de efectividad y goles.

### 5. Progreso y Gamificación (Progress)
Módulo diseñado para mantener la motivación alta.

*   **Constructor de Metas:** Define objetivos (ej: "Llegar a 50 goles esta temporada"). La IA puede sugerir metas realistas y ambiciosas basadas en tu historial.
*   **Sistema de Logros:** Insignias desbloqueables automáticas (ej: "Muro Defensivo" por vallas invictas, "Racha Ganadora").
*   **Niveles de XP:** Los jugadores ganan experiencia por jugar, asistir y marcar, subiendo de nivel visualmente.

### 6. Entrenador IA (Coach)
Chatbot contextual potenciado por **Google Gemini**.

*   **Contexto Total:** La IA recibe todo el historial de partidos del equipo.
*   **Consultas Naturales:** Pregunta: *"¿Cuál es nuestra mayor debilidad defensiva?"*, *"¿Quién rinde mejor contra equipos difíciles?"* o *"Dame una charla motivacional"*.
*   **Memoria:** Guarda el historial de interacciones y análisis generados.

### 7. Centro Social (Social)
Generador de contenido para compartir en redes (Instagram/WhatsApp).

*   **Tarjetas Generativas:** Crea imágenes estéticas listas para descargar sobre:
    *   Resultado del último partido.
    *   MVP del encuentro.
    *   Estado de ánimo/Moral del equipo (calculado algorítmicamente).
    *   Logros desbloqueados.
    *   Resúmenes mensuales y anuales.

### 8. Administración y Nube (Settings)
Gestión integral de la cuenta y equipos.

*   **Multi-Equipo:** Crea y gestiona múltiples equipos desde una sola cuenta.
*   **Configuración de Torneos:** Define reglas específicas (iconos, colores, duración) para cada competición.
*   **Gestión de Miembros:** Invita a otros usuarios por email y asigna roles.
*   **Importación/Exportación:** Respalda tus datos en JSON o expórtalos a CSV para Excel.

---

## Sistema de Roles y Permisos

Para facilitar la colaboración sin riesgos, la aplicación implementa un sistema RBAC (Role-Based Access Control):

| Rol | Descripción y Permisos |
| :--- | :--- |
| 👑 **Owner (Dueño)** | Acceso total. Puede eliminar el equipo, gestionar administradores y acceder a la "Zona de Peligro". |
| 🛡️ **Admin** | Puede invitar/expulsar miembros, configurar torneos y editar toda la data (partidos, jugadores). No puede borrar el equipo. |
| ✏️ **Editor** | Ideal para colaboradores. Puede registrar nuevos partidos, cargar estadísticas y editar resultados. No gestiona miembros. |
| 👁️ **Viewer (Espectador)** | Solo lectura. Puede ver estadísticas, gráficos y análisis, pero no puede modificar ni borrar nada. |

---

## Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/myteamstats.git
    cd myteamstats
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en la raíz y añade tu API Key de Google Gemini (necesaria para las funciones de IA):
    ```env
    VITE_API_KEY=tu_api_key_de_google_gemini
    ```

4.  **Configurar Firebase:**
    Actualiza `src/firebase/config.ts` con las credenciales de tu proyecto Firebase.

5.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```

---

## Stack Tecnológico

*   **Frontend:** React 19, TypeScript, Vite.
*   **Estilos:** CSS-in-JS (Objetos de estilo para rendimiento y encapsulamiento), Diseño Responsivo manual.
*   **Base de Datos & Auth:** Firebase (Firestore, Authentication).
*   **Inteligencia Artificial:** Google Gemini API (Modelos `gemini-2.5-flash`).
*   **Gráficos:** SVG nativos personalizados (sin librerías pesadas de charts).
*   **Utilidades:** `html-to-image` (generación social), `pako` (compresión de datos).
