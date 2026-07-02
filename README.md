# UNAHUR Anti-Social Net — Frontend

Trabajo Práctico 2 — Construcción de Interfaces de Usuario (UNAHUR).

Frontend en **React + TypeScript + Vite** que consume la API REST del
backend `anti-social-documental-tp-git-pull-la-septima` (materia
Estrategias de Persistencia).

## Integrantes

- Cristian Ramirez
- Lucas
- Marcos
- Nicolas B
- Nicolas Dondero

## Repos

- **Frontend (este)**: https://github.com/CristRamirez/ciu-anti-social
- **Backend**: https://github.com/EP-UnaHur-2026C1/anti-social-documental-tp-git-pull-la-septima

## Levantar el proyecto desde cero

Requisitos: Node 22+, Docker + Docker Compose, Git.

### 1. Clonar los dos repos

```bash
git clone https://github.com/EP-UnaHur-2026C1/anti-social-documental-tp-git-pull-la-septima.git
git clone https://github.com/CristRamirez/ciu-anti-social.git
```

### 2. Backend

Entrá al repo del backend y creá un archivo `.env` con estas variables:

```env
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
MONGO_URL=mongodb://admin:admin1234@mongodb:27017/seriesMongo?authSource=admin
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin1234
ME_USERNAME=web
ME_PASSWORD=web1234
REDIS_PASSWORD=redis1234
```

Levantá los servicios con Docker:

```bash
cd anti-social-documental-tp-git-pull-la-septima
docker compose up -d
```

Esto levanta:
- **App Node.js** en `http://localhost:3001`
- **MongoDB** en `:27017`
- **Mongo Express** en `http://localhost:8081`
- **Redis** en `:6379`
- **RedisInsight** en `http://localhost:5540`

### 3. Frontend

Entrá al repo del frontend y creá `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Instalá dependencias y corré:

```bash
cd ciu-anti-social
npm install
npm run dev
```

App disponible en `http://localhost:5173`.

## Variables de entorno

### Backend (`.env` en la raíz del repo backend)

| Variable | Descripción | Ejemplo |
|--|--|--|
| `PORT` | Puerto del servidor Node | `3001` |
| `ALLOWED_ORIGINS` | Origen permitido por CORS (URL del front) | `http://localhost:5173` |
| `MONGO_URL` | URL de conexión a MongoDB | `mongodb://admin:admin1234@mongodb:27017/seriesMongo?authSource=admin` |
| `MONGO_ROOT_USERNAME` | Usuario admin de Mongo | `admin` |
| `MONGO_ROOT_PASSWORD` | Password admin de Mongo | `admin1234` |
| `ME_USERNAME` | Usuario Mongo Express | `web` |
| `ME_PASSWORD` | Password Mongo Express | `web1234` |
| `REDIS_PASSWORD` | Password de Redis | `redis1234` |

### Frontend (`.env` en la raíz de este repo)

| Variable | Descripción | Ejemplo |
|--|--|--|
| `VITE_API_URL` | URL base de la API backend | `http://localhost:3001/api` |

## Funcionalidades

- Login simulado (`nickName` + contraseña fija `123456`).
- Registro con validaciones (nombre, apellido, fecha nac. ≥18, nickname).
- Sesión persistida en `localStorage` vía `useContext`.
- Rutas protegidas + overlay `AuthGate` para acceso no autenticado.
- Feed de publicaciones con tabs **Últimos / Populares**.
- Filtro por etiqueta y paginación "Cargar más" (10 x pagina).
- Detalle de publicación (`/post/:id`) con imágenes, tags y comentarios.
- Perfil propio y de otros usuarios (`/u/:id`).
- Editar/eliminar posts propios (con confirmación modal).
- Editar/eliminar comentarios propios.
- Agregar/eliminar imágenes durante edición.
- Selector de etiquetas con creación on-the-fly.
- Búsqueda de usuarios en vivo.
- Selector de emojis para posts y comentarios.
- Panel derecho con 5 usuarios random + link a todos.
- Sidebar izquierda (desktop) + bottom nav (mobile).
- Ajustes: editar nickname, eliminar cuenta, tema claro/oscuro.
- CRUD de etiquetas vía engranaje inferior derecho.
- Toasts para feedback de acciones.
- Carousel tipo Instagram para múltiples imágenes.
- Animación de entrada para posts nuevos.
- Responsive completo (mobile / tablet / desktop).
- Tema claro y oscuro con persistencia.

## Stack

| Tema                 | Aplicación                                       |
| -------------------- | ------------------------------------------------ |
| React 19             | Framework UI                                     |
| TypeScript           | Tipado estático                                  |
| Vite                 | Build tool + dev server                          |
| react-router-dom     | Ruteo + rutas protegidas                         |
| Context API          | Auth, Theme, Toasts                              |
| fetch                | Consumo API REST (wrapper `src/api.ts`)          |
| CSS variables        | Tema + tokens (verde y azul UNAHUR)              |
| localStorage         | Persistencia de sesión y tema                    |

## Endpoints consumidos

| Método | Endpoint                                                  |
| ------ | --------------------------------------------------------- |
| GET    | `/users`, `/users/:id`                                    |
| POST   | `/users`                                                  |
| PUT    | `/users/:id`                                              |
| DELETE | `/users/:id`                                              |
| GET    | `/posts`, `/posts/user/:id`                               |
| POST   | `/posts/user/:id`                                         |
| PUT    | `/posts/user/:id/post/:id_post`                           |
| DELETE | `/posts/:id`                                              |
| GET    | `/tags`                                                   |
| POST   | `/tags`                                                   |
| PUT    | `/tags/:id`                                               |
| DELETE | `/tags/:id`                                               |
| GET    | `/comments/post/:postId`                                  |
| POST   | `/comments/user/:userId/post/:postId`                     |
| PUT    | `/comments/user/:userId/post/:postId/:commentId`          |
| DELETE | `/comments/user/:userId/post/:postId/:commentId`          |
| GET    | `/post-images/user/:userId/post/:postId/images`           |
| POST   | `/post-images/user/:userId/post/:postId/images`           |
| DELETE | `/post-images/user/:userId/post/:postId/images/:id`       |

## Build de producción

```bash
npm run build
npm run preview
```

## Estructura

```
src/
  api.ts                    fetch wrapper + endpoints
  types.ts                  tipos compartidos
  utils/
    time.ts                 helper "hace X min"
  context/
    AuthContext.tsx         sesión + localStorage
    ThemeContext.tsx        tema claro/oscuro
    ToastContext.tsx        toasts con portal
  components/
    Navbar.tsx
    Sidebar.tsx
    MobileNav.tsx
    UsersPanel.tsx
    PostCard.tsx
    PostComposer.tsx
    ImageCarousel.tsx
    EmojiPicker.tsx
    Modal.tsx
    ConfirmDialog.tsx
    ProtectedRoute.tsx
    AuthGate.tsx
    SettingsDialog.tsx
    SettingsFab.tsx
    SearchUsers.tsx
  pages/
    Home.tsx
    Login.tsx
    Register.tsx
    PostDetail.tsx
    Profile.tsx
    Users.tsx
    NewPost.tsx
  App.tsx                   router + providers + layout
  styles.css                estilos globales + tema
```
