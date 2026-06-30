# UNAHUR Anti-Social Net — Frontend

Trabajo Práctico 2 — Construcción de Interfaces de Usuario (UNAHUR).

Frontend en **React + TypeScript + Vite** que consume la API REST del
backend `anti-social-documental-tp-git-pull-la-septima` (materia
Estrategias de Persistencia).

## Stack

- React 19 + TypeScript
- Vite
- react-router-dom
- Context API (auth, theme, toasts)
- CSS variables + tema claro/oscuro

## Correr en local

Requisitos: Node 22+, backend corriendo en `:3001`.

```bash
npm install
npm run dev    # http://localhost:5173
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
