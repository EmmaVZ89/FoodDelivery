# Deploy en Railway

## Arquitectura

Un solo servicio que contiene backend + frontend:
- .NET sirve la API en `/api/*`
- .NET sirve el frontend Angular como static files desde `wwwroot/`
- Las imagenes se almacenan en un Volume montado en `/app/storage`
- PostgreSQL como addon de Railway

```
[Usuario] → [Railway Service (.NET)] → [PostgreSQL Addon]
                ├── /api/*     → Controllers
                ├── /uploads/* → Volume (imagenes)
                └── /*         → Angular SPA (wwwroot)
```

## Pasos

### 1. Crear repositorio en GitHub

```bash
cd delivery
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/delivery.git
git push -u origin main
```

### 2. Crear proyecto en Railway

1. Ir a [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo → seleccionar el repo

### 3. Agregar PostgreSQL

1. En el proyecto → Add Service → Database → PostgreSQL
2. Copiar la variable `DATABASE_URL` (formato Railway)

### 4. Configurar el servicio principal

1. Clic en el servicio → Settings
2. **Root Directory**: `/` (raiz del repo)
3. **Builder**: Dockerfile
4. **Dockerfile Path**: `Dockerfile`

### 5. Variables de entorno

Configurar en el servicio:

```
DATABASE_URL=<copiar de Railway PostgreSQL, formato: Host=...;Port=...;Database=...;Username=...;Password=...>
JWT_SECRET=<generar un string aleatorio de 64 caracteres>
JWT_ISSUER=lodeluna-api
JWT_AUDIENCE=lodeluna-app
JWT_EXPIRY_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7
BREVO_API_KEY=<tu api key de Brevo>
EMAIL_FROM=<tu email verificado en Brevo>
EMAIL_FROM_NAME=
STORAGE_PATH=/app/storage
MAX_IMAGE_SIZE_MB=2
FRONTEND_URL=https://TU_DOMINIO.up.railway.app
ASPNETCORE_ENVIRONMENT=Production
```

**IMPORTANTE**: `FRONTEND_URL` debe ser la URL publica del servicio en Railway (se ve en Settings → Domains). Se usa para generar los magic links en los emails.

**Nota sobre DATABASE_URL**: Railway provee la URL en formato `postgresql://user:pass@host:port/db`. Hay que convertirla al formato .NET:
```
Host=HOST;Port=PORT;Database=DB;Username=USER;Password=PASS
```

### 6. Crear Volume para imagenes

1. Clic en el servicio → Add Volume
2. **Mount Path**: `/app/storage`
3. Esto persiste las imagenes entre deploys

### 7. Dominio

Railway asigna automaticamente un dominio `*.up.railway.app`. Para dominio custom:
1. Settings → Domains → Add Custom Domain
2. Configurar CNAME en tu proveedor DNS

### 8. Primer admin

Despues del primer deploy:
1. Acceder a la web
2. Hacer login con cualquier email (llega el magic link)
3. En Railway → PostgreSQL → Data → ejecutar:
```sql
UPDATE users SET "Role" = 'Admin' WHERE "Email" = 'tu@email.com';
```

## Mantenimiento

### Deploys
- Cada push a `main` en GitHub hace deploy automatico
- Railway detecta cambios en el Dockerfile y reconstruye

### Logs
- Railway → servicio → Logs (tiempo real)

### Base de datos
- Railway → PostgreSQL → Data (query editor)
- O conectarse via psql con las credenciales de Railway

### Imagenes
- Almacenadas en el Volume `/app/storage`
- Accesibles via `/uploads/nombre.jpg`
- Persisten entre deploys
- Si se elimina el Volume, se pierden las imagenes

## Costos

Railway free tier:
- $5 de credito gratis/mes
- Suficiente para una app con trafico bajo/medio
- PostgreSQL incluido en el credito
- Volume: primeros 5GB gratis
