# PROMPT: Foro Estudiantil Digital UCM
## Aplicación Angular + Supabase

---

## CONTEXTO DEL PROYECTO

Desarrolla una aplicación web completa llamada **"Foro Estudiantil Digital UCM"** para la Universidad Católica del Maule (campus Talca, Chile). Es una plataforma colaborativa donde los estudiantes publican preguntas, comparten material de estudio, dan retroalimentación sobre ramos y docentes, y acceden a información sobre trámites y becas. El objetivo es reemplazar los canales informales como WhatsApp e Instagram con un espacio centralizado, estructurado y persistente.

---

## STACK TECNOLÓGICO

- **Frontend:** Angular 17+ (standalone components, signals, Angular Router)
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide Angular o ng-icons
- **Auth:** Supabase Auth con magic link o email/password, restringido a correos `@ucm.cl` (validación en cliente y en Supabase RLS)

---

## ESQUEMA DE BASE DE DATOS SUPABASE

Crea las siguientes tablas con Row Level Security (RLS) habilitado:

```sql
-- Perfiles de usuario (extiende auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  career TEXT,              -- Carrera (ej: "Ing. Civil Informática")
  year_of_entry INT,        -- Año de ingreso
  avatar_url TEXT,
  reputation INT DEFAULT 0, -- Puntos por votos recibidos
  is_moderator BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías del foro
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,       -- ej: "Ramos", "Docentes", "Becas", "Trámites", "Vida Universitaria"
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,               -- nombre del icono lucide
  color TEXT,              -- color hex para identificar visualmente
  post_count INT DEFAULT 0
);

-- Publicaciones (posts/hilos)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,   -- Markdown soportado
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category_id INT REFERENCES categories(id),
  tags TEXT[],             -- ej: ["ICC-301", "Cálculo", "2do año"]
  is_anonymous BOOLEAN DEFAULT false, -- autor puede publicar anónimamente
  is_pinned BOOLEAN DEFAULT false,    -- solo moderadores
  is_solved BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Respuestas a posts
CREATE TABLE replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES replies(id),  -- para respuestas anidadas
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,   -- Markdown soportado
  is_anonymous BOOLEAN DEFAULT false,
  is_accepted BOOLEAN DEFAULT false,  -- marcada como respuesta correcta por el autor del post
  upvotes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votos (para posts y replies)
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,    -- ID del post o reply
  target_type TEXT NOT NULL,  -- 'post' o 'reply'
  value INT NOT NULL CHECK (value IN (-1, 1)), -- 1=upvote, -1=downvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

-- Material de estudio
CREATE TABLE study_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,      -- URL en Supabase Storage
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,              -- PDF, PPT, DOC, etc.
  subject TEXT NOT NULL,       -- Nombre del ramo
  subject_code TEXT,           -- Código ej: ICC-301
  career TEXT,
  year INT,
  semester INT CHECK (semester IN (1, 2)),
  uploader_id UUID REFERENCES profiles(id),
  download_count INT DEFAULT 0,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificaciones
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'reply', 'vote', 'accepted', 'mention'
  message TEXT NOT NULL,
  link TEXT,          -- ruta interna ej: /post/uuid
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reportes de contenido
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,  -- 'post', 'reply', 'material'
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Políticas RLS esenciales:
```sql
-- Solo usuarios con @ucm.cl pueden leer y escribir
-- Posts: lectura pública, escritura solo autenticados
-- Votos: un usuario solo puede ver y modificar sus propios votos
-- Materiales: lectura pública, subida solo autenticados
-- Notificaciones: solo el dueño puede leer las suyas
-- Reportes: solo autenticados pueden crear, solo moderadores pueden leer todos
```

### Bucket de Supabase Storage:
- `study-materials`: para PDFs y archivos académicos (max 20MB por archivo)
- `avatars`: para fotos de perfil

---

## ESTRUCTURA DEL PROYECTO ANGULAR

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── supabase.service.ts       # Cliente Supabase singleton
│   │   │   ├── auth.service.ts           # Login, logout, sesión
│   │   │   ├── posts.service.ts          # CRUD de posts
│   │   │   ├── replies.service.ts        # CRUD de respuestas
│   │   │   ├── categories.service.ts     # Lectura de categorías
│   │   │   ├── materials.service.ts      # Upload y listado de materiales
│   │   │   ├── votes.service.ts          # Votar posts y replies
│   │   │   ├── notifications.service.ts  # Realtime notifications
│   │   │   └── profile.service.ts        # Perfil de usuario
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   └── interceptors/ (si aplica)
│   ├── shared/
│   │   ├── components/
│   │   │   ├── navbar/
│   │   │   ├── sidebar/
│   │   │   ├── post-card/
│   │   │   ├── reply-card/
│   │   │   ├── vote-buttons/
│   │   │   ├── category-badge/
│   │   │   ├── markdown-viewer/
│   │   │   ├── markdown-editor/
│   │   │   ├── avatar/
│   │   │   ├── notification-bell/
│   │   │   └── loading-spinner/
│   │   └── pipes/
│   │       ├── time-ago.pipe.ts
│   │       └── file-size.pipe.ts
│   └── pages/
│       ├── landing/              # Página de bienvenida pública
│       ├── auth/
│       │   ├── login/
│       │   └── register/
│       ├── home/                 # Feed principal con posts recientes y populares
│       ├── categories/           # Vista de todas las categorías
│       ├── category-detail/      # Posts filtrados por categoría
│       ├── post-detail/          # Hilo completo con respuestas
│       ├── new-post/             # Formulario crear post
│       ├── materials/            # Biblioteca de material de estudio
│       ├── upload-material/      # Subir nuevo material
│       ├── profile/              # Perfil público de usuario
│       ├── my-profile/           # Editar mi perfil
│       ├── search/               # Resultados de búsqueda global
│       ├── notifications/        # Centro de notificaciones
│       └── admin/                # Panel de moderación (solo moderadores)
```

---

## PÁGINAS Y FUNCIONALIDADES DETALLADAS

### 1. LANDING PAGE (`/`)
- Header con logo UCM y nombre de la plataforma
- Hero section explicando el propósito del foro
- Estadísticas en tiempo real: total posts, usuarios, materiales
- Vista previa de las 6 categorías con íconos
- Botones "Iniciar sesión" y "Registrarse"
- Footer con info de la UCM

### 2. AUTENTICACIÓN (`/auth/login`, `/auth/register`)
- Login con email/password
- Registro: nombre completo, email (@ucm.cl obligatorio, validar con regex), carrera (select con carreras de UCM), año de ingreso, username único
- Verificación de email antes de acceder
- Mensaje de error claro si el email no es @ucm.cl
- Opción "¿Olvidaste tu contraseña?" con reset por email

### 3. HOME / FEED PRINCIPAL (`/home`)
**Layout de 3 columnas:**
- **Izquierda (sidebar):** Lista de categorías con conteo de posts, filtros rápidos
- **Centro (main):** 
  - Tabs: "Recientes" | "Populares" | "Sin respuesta" | "Resueltos"
  - Lista de PostCards ordenadas según el tab activo
  - Paginación o infinite scroll
  - Botón flotante "+" para crear nuevo post (solo autenticados)
- **Derecha (sidebar):**
  - Top 5 usuarios más activos (por reputación)
  - Posts más vistos esta semana
  - Últimos materiales subidos

### 4. DETALLE DE POST (`/post/:id`)
- Título, contenido (renderizado en Markdown), categoría, tags, fecha, autor (o "Anónimo"), contador de vistas
- Botones de voto arriba/abajo para el post
- Botón "Marcar como resuelto" (solo autor del post)
- Botón "Reportar" (usuarios autenticados)
- Sección de respuestas anidadas (máx. 2 niveles de profundidad)
- Cada respuesta: contenido Markdown, votos, botón "Aceptar respuesta" (solo autor del post), botón "Reportar"
- Editor de respuesta al final (Markdown con preview)
- Checkbox "Publicar anónimamente"
- Notificación Realtime cuando llega una nueva respuesta

### 5. CREAR POST (`/new-post`)
- Campo título (max 200 chars)
- Select de categoría (obligatorio)
- Editor Markdown con toolbar básica y preview
- Campo de tags (input con chips, ej: escribir "ICC-301" + Enter)
- Checkbox "Publicar anónimamente"
- Botón "Publicar" y "Cancelar"
- Validaciones en tiempo real

### 6. CATEGORÍAS (`/categories`)
Tarjetas para cada categoría con icono, color, nombre, descripción y conteo de posts:
- 📚 **Ramos** — Consultas sobre asignaturas específicas
- 👨‍🏫 **Docentes** — Opiniones y recomendaciones sobre profesores
- 🎓 **Becas** — Información sobre postulación y requisitos de becas
- 📋 **Trámites** — Procedimientos administrativos (TNE, certificados, etc.)
- 🏛️ **Vida Universitaria** — Actividades, deportes, vida en campus
- 💡 **General** — Consultas generales y off-topic académico

### 7. MATERIAL DE ESTUDIO (`/materials`)
- Filtros: carrera, ramo, año, semestre, tipo de archivo
- Buscador por nombre del ramo o código
- Grid de tarjetas con: nombre del archivo, ramo, subido por, descargas, fecha
- Botón de descarga directa desde Supabase Storage
- Botón "Subir material" (usuarios autenticados)
- Votos para destacar los mejores materiales

### 8. SUBIR MATERIAL (`/upload-material`)
- Input de archivo (drag & drop + click), max 20MB, formatos: PDF, DOCX, PPTX, XLSX, ZIP
- Título descriptivo
- Selección de ramo (texto libre + código)
- Carrera, año y semestre
- Descripción opcional
- Barra de progreso durante la subida a Supabase Storage

### 9. PERFIL DE USUARIO (`/profile/:username`)
- Avatar, nombre, carrera, año de ingreso, reputación con badge de nivel
- Tabs: "Posts publicados" | "Respuestas" | "Materiales subidos"
- Estadísticas: total posts, respuestas aceptadas, materiales

### 10. BÚSQUEDA GLOBAL (`/search?q=...`)
- Barra de búsqueda en el navbar que navega a esta página
- Resultados en tabs: "Posts" | "Materiales"
- Búsqueda en título, contenido y tags (usando Supabase full-text search con `to_tsvector` en español)
- Highlight del término buscado en los resultados

### 11. NOTIFICACIONES (`/notifications`)
- Lista de notificaciones con tipo, mensaje, fecha y estado (leída/no leída)
- Marcar todas como leídas
- Bell icon en navbar con badge de cantidad no leída
- Realtime con Supabase Realtime subscriptions

### 12. PANEL DE MODERACIÓN (`/admin`) — Solo moderadores
- Lista de reportes pendientes con tipo, contenido reportado y razón
- Botones: "Ver contenido" | "Eliminar" | "Desestimar reporte"
- Tabla de usuarios con opción de banear temporalmente
- Posts fijados (pin/unpin)

---

## COMPONENTES COMPARTIDOS

### `<app-post-card>`
Props: post (con author, category, stats)
Muestra: título, preview del contenido (150 chars), autor/anónimo, categoría con color, tags, tiempo relativo, stats (votos, respuestas, vistas)

### `<app-vote-buttons>`
Props: targetId, targetType, currentVotes, userVote
Comportamiento: upvote/downvote con efecto visual inmediato (optimistic update), sin voto doble

### `<app-markdown-editor>`
Toolbar: negrita, cursiva, código inline, bloque de código, lista, cita
Preview en tiempo real lado a lado o en toggle

### `<app-notification-bell>`
Badge rojo con conteo, dropdown con últimas 5 notificaciones, link a `/notifications`

---

## SERVICIOS PRINCIPALES

### `supabase.service.ts`
```typescript
// Singleton del cliente Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;
  
  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }
  
  get client() { return this.supabase; }
}
```

### `auth.service.ts`
- `signUp(email, password, profileData)` — registrar y crear perfil
- `signIn(email, password)`
- `signOut()`
- `currentUser$` — observable del usuario actual (usando `onAuthStateChange`)
- `isAuthenticated()` — signal booleano

### `posts.service.ts`
- `getPosts(filters)` — paginado, con joins a profiles y categories
- `getPostById(id)` — con vistas incrementadas
- `createPost(data)` 
- `updatePost(id, data)` — solo autor o moderador
- `deletePost(id)`
- `searchPosts(query)` — full-text search

### `votes.service.ts`
- `vote(targetId, targetType, value)` — upsert con lógica para quitar voto si ya votó igual

---

## SISTEMA DE REPUTACIÓN

| Acción | Puntos |
|--------|--------|
| Post recibe upvote | +5 |
| Respuesta recibe upvote | +10 |
| Respuesta marcada como aceptada | +15 |
| Material subido recibe upvote | +5 |
| Post recibe downvote | -2 |

**Niveles por reputación:**
- 🌱 Estudiante Nuevo: 0–49
- 📖 Colaborador: 50–199
- ⭐ Referente: 200–499
- 🏆 Experto UCM: 500+

---

## DISEÑO Y UI

**Paleta de colores (identidad UCM):**
- Primario: `#1B3A6B` (azul oscuro UCM)
- Secundario: `#C8102E` (rojo UCM)
- Acento: `#F5A623` (amarillo/dorado)
- Fondo claro: `#F5F7FA`
- Texto principal: `#1A202C`

**Tipografía:**
- Fuente principal: Inter (Google Fonts)
- Código: JetBrains Mono

**Principios de diseño:**
- Diseño limpio, académico y profesional
- Mobile-first y completamente responsivo
- Dark mode opcional (toggle en navbar)
- Animaciones sutiles en transiciones de página (Angular Animations)
- Estados vacíos con ilustraciones amigables y mensajes motivadores
- Skeleton loaders mientras carga el contenido

---

## FUNCIONALIDADES DE ACCESIBILIDAD Y UX

- Publicación anónima opcional en posts y respuestas
- Editor Markdown con preview para facilitar el formato
- Búsqueda full-text en español con `pg_catalog.spanish`
- Notificaciones en tiempo real (Supabase Realtime)
- Validación de email `@ucm.cl` en registro
- Infinite scroll o paginación en feeds
- Tags con autocompletado de tags populares
- Soporte para código en respuestas (útil para alumnos de Informática)
- Confirmación antes de eliminar contenido
- Toast notifications para feedback de acciones (éxito/error)

---

## CONFIGURACIÓN DE AMBIENTE

**`environment.ts`:**
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseAnonKey: 'TU_SUPABASE_ANON_KEY'
};
```

**Instalar dependencias:**
```bash
npm install @supabase/supabase-js
npm install @angular/material  # opcional para componentes UI
npm install marked              # para renderizar Markdown
npm install ngx-markdown        # componente Angular para Markdown
```

---

## SEEDS DE BASE DE DATOS

Inserta datos iniciales:

```sql
-- Categorías
INSERT INTO categories (name, slug, description, icon, color) VALUES
('Ramos', 'ramos', 'Consultas y material sobre asignaturas', 'book-open', '#3B82F6'),
('Docentes', 'docentes', 'Opiniones y experiencias con profesores', 'user-tie', '#10B981'),
('Becas', 'becas', 'Información sobre becas y beneficios estudiantiles', 'graduation-cap', '#F59E0B'),
('Trámites', 'tramites', 'Procedimientos administrativos: TNE, certificados, matrícula', 'file-text', '#8B5CF6'),
('Vida Universitaria', 'vida-universitaria', 'Actividades, deportes, eventos y vida en el campus', 'university', '#EC4899'),
('General', 'general', 'Consultas generales y temas variados', 'message-circle', '#6B7280');
```

---

## NOTAS PARA EL DESARROLLADOR

1. Usa **Angular Signals** para el manejo de estado reactivo (no NgRx en esta etapa)
2. Implementa **lazy loading** en todas las rutas para optimizar el bundle size
3. Las **Row Level Security policies** en Supabase son la primera línea de defensa; nunca confiar solo en validaciones del cliente
4. El campo `is_anonymous` oculta el autor en la UI, pero el `author_id` se guarda en BD para moderación
5. Usa **Supabase Realtime** para suscribirse a nuevas respuestas en el detalle de post
6. El full-text search debe configurar el `tsvector` con `'spanish'` para tokenización correcta
7. Implementa **optimistic updates** en los votos para UX fluida
8. Todas las fechas deben mostrarse en zona horaria de Chile (America/Santiago)
9. El registro debe enviar email de confirmación antes de permitir acceso
10. Implementa un **rate limiting** en el cliente: máx. 5 posts por hora por usuario

---

*Proyecto académico — Metodología de la Investigación, ICI UCM, Grupo 8, 2026*
