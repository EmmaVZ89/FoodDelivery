# Delivery WebApp

Aplicacion web de delivery de comida. Webapp unificada que integra pedidos para clientes y panel de administracion en una sola aplicacion.

## Tech Stack

- **Backend**: .NET 8 (C#), ASP.NET Core Web API, Entity Framework Core
- **Frontend**: Angular 19, Angular Material, SCSS
- **Base de datos**: PostgreSQL
- **Auth**: Email Magic Link (JWT + Refresh Tokens)
- **Email**: Brevo (transactional emails)
- **Storage**: Disco local / Railway Volumes (imagenes)

## Requisitos

- .NET SDK 8+
- Node.js 18+
- PostgreSQL 15+
- Angular CLI (`npm install -g @angular/cli`)

## Setup Local

### 1. Base de datos

```bash
# Crear la base de datos
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE lodeluna"
```

### 2. Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Restaurar dependencias y ejecutar
dotnet run --project src/LosDeLuna.API --launch-profile http
# El backend inicia en http://localhost:5050
# La BD se migra automaticamente en modo desarrollo
```

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar (proxy configurado a localhost:5050)
ng serve
# El frontend inicia en http://localhost:4200
```

### 4. Primer admin

```bash
# Solicitar magic link desde la web con cualquier email
# Obtener el token de la BD (en dev los emails se loguean en consola)
psql -h localhost -p 5433 -U postgres -d lodeluna -c "SELECT \"Token\" FROM magic_links WHERE \"UsedAt\" IS NULL ORDER BY \"CreatedAt\" DESC LIMIT 1"

# Acceder: http://localhost:4200/auth/verify?token=TOKEN_AQUI

# Promover a admin
psql -h localhost -p 5433 -U postgres -d lodeluna -c "UPDATE users SET \"Role\"='Admin' WHERE \"Email\"='tu@email.com'"
```

## Variables de Entorno

Ver `.env.example` para la lista completa. Variables requeridas:

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret para firmar JWT (min 32 chars) |
| `BREVO_API_KEY` | API key de Brevo para emails |
| `EMAIL_FROM` | Email verificado en Brevo como sender |
| `FRONTEND_URL` | URL del frontend (para magic links) |
| `STORAGE_PATH` | Ruta donde se guardan imagenes |

## Deploy en Railway

### Servicios necesarios

1. **PostgreSQL** — base de datos (Railway addon)
2. **Backend** — .NET API (Dockerfile)
3. **Frontend** — Angular + Nginx (Dockerfile)
4. **Volume** — para imagenes (montado en el backend)

### Pasos

1. Crear proyecto en Railway
2. Agregar PostgreSQL addon → copiar connection string
3. Crear servicio Backend desde el repo (root: `/backend`, Dockerfile)
4. Crear servicio Frontend desde el repo (root: `/frontend`, Dockerfile)
5. Configurar variables de entorno en cada servicio
6. Crear Volume y montarlo en el backend en `/app/storage`
7. Configurar dominios custom (opcional)

Ver `docs/deploy-railway.md` para instrucciones detalladas.

## Estructura del Proyecto

```
├── backend/                         # .NET 8 Web API
│   ├── src/
│   │   ├── LosDeLuna.API/           # Controllers, DTOs, Middleware
│   │   ├── LosDeLuna.Core/          # Entidades, Enums, Interfaces
│   │   └── LosDeLuna.Infra/         # DbContext, Servicios, Repositorios
│   ├── .env.example
│   └── Dockerfile
├── frontend/                        # Angular 19 SPA
│   ├── src/app/
│   │   ├── core/                    # Services, Guards, Interceptors, Models
│   │   ├── shared/                  # Componentes reutilizables
│   │   └── features/               # Home, Catalog, Cart, Checkout, Orders, Profile, Auth, Admin
│   ├── proxy.conf.json
│   └── Dockerfile
├── docs/                            # Documentacion
├── .claude/                         # Rules y skills para Claude Code
├── CLAUDE.md
└── README.md
```

## Funcionalidades

### Cliente
- Catalogo con categorias y productos
- Detalle de producto con personalizaciones (variantes, opciones single/multiple/quantity)
- Carrito con total en tiempo real
- Checkout en 1 paso con WhatsApp como canal de confirmacion
- Historial de pedidos con tracking de estados
- Login sin contrasena (magic link por email)
- Codigos de descuento

### Admin
- Dashboard con metricas del dia
- CRUD de categorias y productos (con upload de imagenes)
- Gestion de pedidos (cambio de estados: pendiente → preparacion → en camino → entregado)
- Horarios de atencion
- Configuracion del negocio (nombre, logo, WhatsApp, direccion)
- Codigos de descuento y alertas
- Capacidad de cocina configurable

## Licencia

Privado.
