# Lo de Luna - Delivery Web App

## Descripcion del Proyecto

Aplicacion web de delivery de comida para el restaurante "Lo de Luna" (Argentina). Webapp unificada que integra el sistema de pedidos para clientes y el panel de administracion en una sola aplicacion, con routing por rol.

Migrada desde 3 proyectos Angular legacy (Angular 14/15 + Firebase + Ionic/Capacitor) a un stack moderno .NET + Angular + PostgreSQL.

## Tech Stack

| Capa | Tecnologia |
|------|-----------|
| Backend | .NET 8 (C#), ASP.NET Core Web API |
| Frontend | Angular 19, Angular Material, SCSS |
| Base de datos | PostgreSQL 16 |
| ORM | Entity Framework Core 8 |
| Auth | Email Magic Link (JWT + Refresh Tokens) |
| Storage | Railway Volume (imagenes) |
| Hosting | Railway (backend, frontend, BD, storage) |
| Email | Resend (magic links, notificaciones) |

## Arquitectura

```
delivery/
├── backend/                    # .NET 8 Web API
│   ├── src/
│   │   ├── LosDeLuna.API/
│   │   │   ├── Controllers/         # AuthController, ConfigController, CategoriesController, ProductsController, AlertsController, OrdersController, ProfileController
│   │   │   ├── Controllers/Admin/   # AdminCategoriesController, AdminProductsController, AdminOrdersController, AdminConfigController
│   │   │   ├── DTOs/                # Auth/, Categories/, Products/, Orders/, Profile/, Alerts/, Admin/, Common/
│   │   │   ├── Middleware/          # ExceptionMiddleware
│   │   │   └── Program.cs          # DI, JWT, CORS, Rate Limiting, Static Files
│   │   ├── LosDeLuna.Core/
│   │   │   ├── Entities/            # 17 entidades (BaseEntity, BusinessConfig, Schedule, User, MagicLink, RefreshToken, Category, Product, ProductVariant, CustomizationGroup, CustomizationOption, DiscountCode, Alert, Order, OrderItem, OrderItemCustomization, OrderStatusHistory)
│   │   │   ├── Enums/               # OrderStatus, SelectionType, PaymentMethod, UserRole
│   │   │   ├── Interfaces/          # IRepository, IUnitOfWork, IAuthService, IEmailService, IBusinessConfigService
│   │   │   └── Exceptions/          # BusinessException
│   │   └── LosDeLuna.Infra/
│   │       ├── Data/                # AppDbContext, UnitOfWork
│   │       ├── Repositories/        # Repository<T>
│   │       ├── Services/            # AuthService, EmailService, BusinessConfigService, OrderService
│   │       └── Migrations/
├── frontend/                        # Angular 19 SPA
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── services/            # AuthService, ConfigService, CatalogService, CartService, OrderService, ProfileService, AlertService, AdminService
│   │   │   ├── models/              # auth.model, business-config.model, catalog.model, order.model, user.model
│   │   │   ├── guards/              # authGuard, adminGuard
│   │   │   └── interceptors/        # authInterceptor (JWT + auto-refresh en 401)
│   │   ├── shared/components/       # ConfirmDialogComponent
│   │   ├── features/
│   │   │   ├── home/                # Hero banner + carousel promos + categorias grid
│   │   │   ├── catalog/             # Listado productos + ProductDetailDialog (customizaciones)
│   │   │   ├── cart/                # Carrito con login banner si no autenticado
│   │   │   ├── checkout/            # Checkout 1 paso + WhatsApp deeplink + confirmacion
│   │   │   ├── orders/              # Historial con estados y detalle expandible
│   │   │   ├── profile/             # Perfil editable + logout
│   │   │   ├── auth/                # login/ (magic link) + verify/ (token)
│   │   │   └── admin/               # Layout + dashboard + categories + products + orders + schedules + config + discount-codes + alerts
│   │   └── app.routes.ts            # Rutas con lazy loading + guards
│   ├── src/environments/
│   └── proxy.conf.json              # Proxy dev: /api → localhost:5050
├── .claude/                         # Rules y skills
├── docs/                            # changelog.md, database-model.md, migration-plan.md
├── CLAUDE.md                        # Este archivo
└── .env                             # Variables de entorno (no commitear)
```

## Principios de Desarrollo

### Seguridad (OWASP Top 10)
- Validacion de inputs en backend siempre (FluentValidation)
- Parametros SQL via EF Core (nunca concatenar)
- JWT con expiracion corta (15min) + refresh tokens
- CORS configurado estrictamente
- Rate limiting en endpoints sensibles (auth, pedidos)
- Sanitizacion de outputs para prevenir XSS
- HTTPS obligatorio
- Precios SIEMPRE se calculan en backend (nunca confiar en frontend)
- Todas las imagenes se validan (tipo, tamano max 2MB)

### SOLID Principles
- **S**: Cada servicio tiene una responsabilidad clara
- **O**: Sistema de customizacion extensible sin modificar codigo existente
- **L**: Interfaces bien definidas entre capas
- **I**: Interfaces especificas por funcionalidad (no mega-interfaces)
- **D**: Inyeccion de dependencias en todo el stack

### Convenciones de Codigo

**Backend (.NET)**
- PascalCase para clases, metodos, propiedades publicas
- camelCase para variables locales y parametros
- Async/await en todo endpoint
- DTOs separados para Request/Response
- Repositorio por entidad principal
- Excepciones custom para reglas de negocio

**Frontend (Angular)**
- kebab-case para archivos y selectores
- PascalCase para clases e interfaces
- camelCase para propiedades y metodos
- Standalone components (Angular 19)
- Signals para estado reactivo
- Interfaces tipadas para TODOS los modelos (espejo de backend)
- Lazy loading por feature module

### Zona Horaria
- Backend: todas las fechas en UTC, conversion a America/Argentina/Buenos_Aires solo para display
- Frontend: muestra siempre en hora Argentina
- Validacion de horarios del negocio siempre en hora Argentina

## Sistema de Customizacion de Productos (CLAVE)

Reemplaza los flags legacy (isEmpanada, hasSideDishes, isSalad, isBuildSalad, isBigSalad) con un sistema generico:

```
Product
  └── ProductVariant[] (ej: "Unidad", "Media docena", "Docena")
  └── CustomizationGroup[] (ej: "Sabores", "Guarnicion", "Ingredientes")
       └── CustomizationOption[] (ej: "Carne", "Jamon y queso", etc.)
```

**Tipos de seleccion:**
- `single`: elegir 1 opcion (guarnicion)
- `multiple`: elegir N opciones (ingredientes de ensalada)
- `quantity`: elegir con cantidades (sabores de empanada)

**Variantes:** Si el producto tiene variantes, la variante seleccionada determina `max_selections` del grupo de customizacion.

## Funcionalidades

### Cliente
- [x] Home con carousel de promos y categorias
- [x] Catalogo por categoria con disponibilidad/stock
- [x] Detalle de producto con personalizacion (sistema generico)
- [x] Carrito con total en tiempo real (localStorage + API)
- [x] Checkout en 1 paso (tipo WhatsApp)
- [x] WhatsApp como fallback para enviar pedido
- [x] Historial de pedidos con estados
- [x] Tracking de estado (pendiente > preparacion > en camino > entregado)
- [x] Perfil con datos editables
- [x] Login con Magic Link (email)
- [x] Skeleton loaders en toda la app
- [x] Validacion de horarios comerciales

### Admin
- [x] Dashboard con metricas basicas
- [x] CRUD Categorias (con imagenes)
- [x] CRUD Productos (con imagenes, variantes, customizaciones)
- [x] Gestion de horarios simplificada
- [x] Gestion de pedidos en tiempo real (cambiar estados)
- [x] CRUD Codigos de descuento
- [x] Alertas configurables
- [x] Config del negocio (nombre, logo, telefono, etc.)
- [x] Capacidad de cocina (limitar pedidos simultaneos)
- [x] Config costos de envio

### Transversales
- [x] Responsive (mobile-first, todas las pantallas)
- [x] UI estilo PedidosYa (botones grandes, flujo corto)
- [x] Lazy loading / paginado en listados
- [x] Rate limiting
- [x] .env para datos sensibles

## Variables de Entorno (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/lodeluna

# JWT
JWT_SECRET=<secret>
JWT_ISSUER=lodeluna-api
JWT_AUDIENCE=lodeluna-app
JWT_EXPIRY_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7

# Email (Resend)
RESEND_API_KEY=<key>
EMAIL_FROM=noreply@lodeluna.com

# Storage
STORAGE_PATH=/app/storage
MAX_IMAGE_SIZE_MB=2

# App
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:5000
ENVIRONMENT=development
```

## Comandos

```bash
# Backend
cd backend && dotnet run --project src/LosDeLuna.API
dotnet ef migrations add <Name> --project src/LosDeLuna.Infra --startup-project src/LosDeLuna.API
dotnet ef database update --project src/LosDeLuna.Infra --startup-project src/LosDeLuna.API

# Frontend
cd frontend && ng serve
ng generate component features/<feature>/<component> --standalone
ng build --configuration production

# Base de datos
# PostgreSQL local en puerto 5432
```

## Orden de Migracion

La migracion sigue el flujo del usuario:
1. **Fundacion**: proyecto, BD, auth, config negocio
2. **Home + Catalogo**: home, categorias, productos (skeleton loaders)
3. **Producto + Carrito**: detalle con customizaciones, carrito
4. **Checkout + Pedidos**: checkout 1 paso, WhatsApp, estados
5. **Admin**: CRUD completo, gestion pedidos, metricas
6. **Polish**: notificaciones, optimizaciones, deploy

Ver `docs/migration-plan.md` para detalle completo.
Ver `docs/database-model.md` para schema de BD.
Ver `docs/changelog.md` para historial de cambios.

## Componentes Compartidos

### ConfirmDialogComponent (`shared/components/confirm-dialog.component.ts`)
Dialog reutilizable para confirmaciones. Reemplaza `window.confirm()` en toda la app.
- Props: `title`, `message`, `confirmText`, `cancelText`, `type` (danger/warning/info)
- Retorna `true` si el usuario confirma, `false` si cancela
- Uso: `this.dialog.open(ConfirmDialogComponent, { data: {...}, width: '400px' })`

## Convenciones UI/UX

### Layout
- **Header**: fondo rojo oscuro (#c62828), nav con icono+label en desktop, bottom nav en mobile
- **Admin sidebar**: fondo blanco, texto gris oscuro, link activo rojo
- **Home**: hero banner rojo degradado + categorias con overlay
- **Botones de accion** (Crear/Actualizar/Cancelar): siempre alineados a la derecha
- **Formularios admin**: toggle show/hide con boton "Nuevo X" / "Cerrar"
- **Eliminaciones**: siempre con ConfirmDialog, nunca window.confirm
- **Tablas**: envueltas en `table-wrapper` con `overflow-x: auto`
- **Imagenes**: upload via zona drag/click, preview con cambiar/eliminar, max 2MB, JPG/PNG/WebP

### Responsive
- Mobile-first (<768px): bottom nav, formularios full-width, grids 2 cols
- Desktop (>=768px): nav horizontal en header, grids auto-fill, sidebar admin fija
- Dashboard: 2 cols en mobile, auto-fill en desktop, cards uniformes
- Horarios: cards individuales por dia, 1 col mobile, 2 cols desktop

### Almacenamiento de Imagenes
- Local: `./storage/`, servido via `/uploads/` (static files)
- Railway: mismo path, montado como Volume persistente
- URLs relativas (`/uploads/archivo.jpg`), independientes del dominio
- Al cambiar imagen, se elimina la anterior del servidor
- Endpoint: `POST /api/admin/upload` (subir), `DELETE /api/admin/upload?url=` (eliminar)
