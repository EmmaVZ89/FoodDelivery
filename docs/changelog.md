# Changelog - Lo de Luna

## 2026-04-16 - Limpieza y blueprint genérico

### Limpieza del repositorio
- Eliminadas carpetas legacy (DeliveryWebApp, DeliveryWebAppAdminMobile, Lo-de-luna-WebApp)
- Eliminados archivos temporales (Nuevo documento de texto.txt, requerimiento iniciales.txt)

### Documentación
- Nuevo `docs/blueprint.md`: guía genérica para replicar el proyecto en cualquier negocio de delivery, sin nombres propios ni código de referencia. Cubre arquitectura, stack, modelo de datos, endpoints, flujos, principios de desarrollo, UI/UX, deploy y consideraciones de escalabilidad.

### Optimización de memoria .NET (Railway)
- Variables documentadas en `.env.example` y `docs/deploy-railway.md`:
  - `DOTNET_gcServer=0` — Workstation GC (menor consumo que Server GC)
  - `DOTNET_GCHeapHardLimit=0x6400000` — Heap máximo 100MB
  - `DOTNET_GCConserveMemory=9` — Máxima agresividad de liberación de memoria
- Reduce consumo típico de ~250MB a ~100MB RAM
- Aplicable en Railway como variables de entorno del servicio (sin cambio de código)

---

## 2026-04-06 - Preparacion para deploy

### Deploy
- Dockerfile multi-stage en raiz: build frontend + backend en un solo servicio
- Backend sirve Angular como static files en produccion (wwwroot + SPA fallback)
- Auto-migrate en todos los ambientes (no solo dev)
- nginx.conf para desarrollo local
- .env.example con todas las variables documentadas
- Guia completa de deploy en Railway (docs/deploy-railway.md)

### Email
- Migracion de Resend a Brevo (API REST, 9000 emails/mes gratis)
- Sender configurable via .env (EMAIL_FROM)
- Nombre del negocio dinamico en emails (desde BD, no hardcodeado)

### WhatsApp
- Links migrados a https://wa.me/ (enlace oficial, funciona en todos los dispositivos)

### Admin
- Nombre y logo dinamicos en sidebar admin (desde config BD)
- Fix referencia circular en GET /api/admin/orders/{id} (devuelve DTO, no entidad)
- Fix enums como numeros en detalle de pedido (ahora strings: "Pending" no 0)
- Historial de estados visible en detalle de pedido expandido

### Documentacion
- README.md completo con setup local y deploy
- .claude/rules.md con reglas del proyecto
- .claude/skills.md con comandos utiles
- docs/deploy-railway.md con guia paso a paso
- .gitignore definitivo

---

## 2026-04-04 - Polish UI/UX (Fase 4)

### Componentes compartidos
- **ConfirmDialogComponent**: dialog reutilizable para confirmaciones (reemplaza window.confirm en toda la app). Soporta tipos danger/warning/info con iconos y colores.

### Header y navegacion
- Header forzado a rojo oscuro (#c62828) — no depende del tema Material que generaba rosa
- Desktop: nav horizontal con **icono + label** por cada seccion (Inicio, Carrito, Pedidos, Perfil, Admin)
- Mobile: bottom nav con 5 botones incluyendo Admin (solo visible para admins)
- Badge de carrito naranja con contador
- Nombre de usuario con pill semitransparente en desktop
- Boton "Ingresar" blanco pill con texto rojo

### Home page
- Hero banner con gradiente rojo: nombre del negocio, subtitulo, direccion, badge abierto/cerrado
- Seccion "Ofertas del dia" con carousel
- Seccion "Nuestro menu" con categorias estilo overlay (imagen + texto superpuesto)
- Estado vacio amigable cuando no hay menu cargado

### Dashboard admin
- Cards 2 columnas en mobile, auto-fill en desktop
- Cards uniformes con min-height fijo
- Texto sin saltos de linea (white-space: nowrap)
- Font sizes responsive

### Categorias admin
- Boton "Nueva categoria" toggle (show/hide formulario), igual que Productos
- Upload de imagen: zona drag/click full-width, preview con cambiar/eliminar
- Eliminacion con ConfirmDialog en vez de window.confirm
- Botones Crear/Actualizar/Cancelar alineados a la derecha
- Tabla envuelta en table-wrapper (no overflow horizontal)

### Productos admin
- Checkboxes (Activo, Disponible, Promocion, Tiene variantes) en columna vertical en mobile
- Grupos de personalizacion con layout vertical en mobile
- Upload de imagen full-width
- Eliminacion con ConfirmDialog
- Botones alineados a la derecha
- Tabla con table-wrapper
- Page header con titulo + boton toggle

### Horarios admin
- Rediseno completo: cada dia es una card individual
- Layout: 1 columna mobile, 2 columnas desktop
- Dia como header con toggle abierto/cerrado
- Inputs de hora solo visibles si el dia esta abierto
- Boton "Guardar horarios" alineado a la derecha

### Codigos de descuento y Alertas admin
- Eliminacion con ConfirmDialog
- Toggle show/hide formulario con boton "Nuevo X"
- Botones alineados a la derecha
- Tablas con table-wrapper

### Sidebar admin
- Cambio de fondo oscuro a fondo blanco con texto gris oscuro
- Link activo: fondo rojo claro + texto rojo
- Toolbar blanca con borde sutil
- Responsive: 240px en mobile, 260px en desktop

### Mobile general
- Bottom nav 56px con safe-area para iPhone notch
- Cards con efecto scale al tocar (no translateY)
- Dialog de producto fullscreen en mobile
- Formularios full-width en mobile
- overflow-x: hidden global
- viewport-fit: cover

### Almacenamiento de imagenes
- Upload a servidor local (`./storage/`)
- Servido via `/uploads/` (static files)
- Al cambiar imagen se elimina la anterior
- Validacion: JPG/PNG/WebP, max 2MB
- Preparado para Railway Volumes

---

## 2026-04-04 - Fase 3: Panel de Administracion

### Backend
- 4 controllers admin: Categories, Products, Orders, Config
- CRUD completo para categorias, productos (con variantes y customizaciones), codigos descuento, alertas
- Gestion de pedidos con maquina de estados (solo transiciones validas)
- Dashboard con metricas del dia
- Upload de imagenes (max 2MB, JPG/PNG/WebP)
- Gestion de horarios simplificada

### Frontend
- 9 paginas admin con lazy loading
- Layout con sidebar responsive (fija desktop, drawer mobile)
- Dashboard con cards de metricas
- CRUD completo para todas las entidades
- Formulario de productos con variantes y customizaciones anidadas

---

## 2026-04-04 - Fase 2: Carrito + Checkout + Pedidos

### Backend
- OrderService con calculo de precios server-side
- Generacion de mensaje WhatsApp formateado
- Validacion de horarios, capacidad cocina, codigos descuento
- CRUD perfil de usuario

### Frontend
- Carrito reactivo con localStorage + signals
- Checkout en 1 paso con cupones y WhatsApp deeplink
- Historial de pedidos con estados coloreados
- Perfil editable

---

## 2026-04-03 - Fase 1: Home + Catalogo

### Backend
- APIs publicas: categorias, productos paginados, promos, alertas
- Detalle de producto con variantes y customizaciones

### Frontend
- Home con carousel de promos y grilla de categorias
- Catalogo por categoria con paginacion
- Modal de detalle con sistema de customizacion generico (single/multiple/quantity)
- Skeleton loaders

---

## 2026-04-03 - Fase 0: Fundacion

### Backend (.NET 8)
- Solution con 3 proyectos (API, Core, Infra)
- 16 entidades, 4 enums, 5 interfaces
- DbContext con EF Core + PostgreSQL
- Auth Magic Link (JWT + refresh tokens)
- Email service (Resend con fallback a log)
- Middleware de excepciones, rate limiting, CORS

### Frontend (Angular 19)
- Standalone components con lazy loading
- Auth: login (email), verify (token), JWT management
- HTTP interceptor con auto-refresh
- Guards: auth y admin
- Angular Material con tema custom

### Base de datos
- PostgreSQL con schema completo
- Seed data: config negocio, horarios, usuario admin
