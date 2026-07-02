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

## API

Base URL configurable en `.env` con `VITE_API_URL` (default
`http://localhost:3001/api`).

Endpoints consumidos:

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

## Correr en local

### Backend

Requiere el backend con **CORS habilitado** para `http://localhost:5173`.

```bash
cd ../anti-social-documental-tp-git-pull-la-septima
docker compose up -d      # mongo + redis + app en :3001
# o: npm install && npm run dev
```

### Frontend

Requisitos: Node 22+.

```bash
npm install
npm run dev              # http://localhost:5173
```

Variables (`.env`):

```env
VITE_API_URL=http://localhost:3001/api
```

## Build

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
  App.tsx                   router + providers + layout
  styles.css                estilos globales + tema
```
