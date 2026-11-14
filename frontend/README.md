# ParkControl — Frontend

SPA en React 19 + Vite 8 + React Router 7 + Bootstrap 5.3 que consume la API ParkControl con JWT.

```powershell
npm ci
copy .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev              # http://localhost:5173
npm run lint
npm run build
```

- La sesión se guarda en `sessionStorage` y se revalida con `GET /api/auth/perfil` al recargar.
- El menú se filtra por rol (`src/pages/modulos.js`), pero **la autorización real la hace el backend** (JWT + RBAC + BOLA).
- No colocar secretos en variables `VITE_*`: quedan expuestas en el navegador.

Documentación completa en el [README del proyecto](../README.md).
