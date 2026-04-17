# Blueprint - Delivery Web App Genérica

Documento de referencia para replicar este tipo de aplicación en cualquier negocio de delivery. Define arquitectura, tecnologías, funcionalidades y flujos. No contiene código ni nombres específicos.

---

## Concepto

Aplicación web unificada de delivery que integra:
- **Catálogo público** para clientes (con o sin sesión)
- **Panel de administración** para el dueño del negocio
- **Un único deploy** que sirve frontend + backend + static files

Casos de uso objetivo: restaurantes, panaderías, heladerías, dulcerías, pequeños comercios de comida con entrega a domicilio.

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│              Usuario (navegador)            │
└────────────────────┬────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────┐
│       Servicio único (contenedor)           │
│  ┌─────────────────────────────────────┐    │
│  │  Backend API  (lenguaje tipado)     │    │
│  │  - Controladores REST               │    │
│  │  - Autenticación                    │    │
│  │  - Lógica de negocio                │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  Frontend SPA (static files)        │    │
│  │  servido por el backend             │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │  Volume persistente /storage        │    │
│  │  (imágenes subidas por admin)       │    │
│  └─────────────────────────────────────┘    │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│       Base de datos relacional (PostgreSQL) │
└─────────────────────────────────────────────┘
                     ▲
                     │
┌─────────────────────────────────────────────┐
│  Servicios externos:                        │
│  - Proveedor de email transaccional         │
│    (magic links, notificaciones)            │
│  - Deep link a mensajería (WhatsApp)        │
└─────────────────────────────────────────────┘
```

**Decisión clave:** el backend sirve el frontend como static files. Evita nginx reverse proxy, CORS entre dominios, y simplifica el deploy.

---

## Stack tecnológico sugerido

| Capa | Tecnología recomendada | Alternativas |
|------|----------------------|-------------|
| Backend | .NET 8+ (C#) con ASP.NET Core Web API | Node.js + NestJS, Go + Gin, Python + FastAPI |
| ORM | Entity Framework Core | Prisma, Dapper, SQLAlchemy |
| Frontend | Angular 19+ (standalone components, signals) | React, Vue 3, Svelte |
| UI Framework | Material Design | Tailwind, ChakraUI, shadcn |
| Base de datos | PostgreSQL 15+ | MySQL, MariaDB |
| Auth | Email Magic Link (JWT + Refresh Tokens) | OAuth2 (Google/Facebook), OTP por SMS |
| Email | Servicio transaccional (plan gratuito) | Brevo, Resend, SendGrid, Mailgun |
| Storage imágenes | Volume persistente del contenedor | S3, R2, Supabase Storage |
| Hosting | PaaS con soporte Dockerfile | Railway, Render, Fly.io, AWS Lightsail |
| Containerización | Dockerfile multi-stage | - |

**Criterios de elección:**
- Lenguajes tipados en ambos lados (type safety en los modelos).
- Plataforma PaaS con plan gratuito o muy bajo costo.
- Servicio de email con plan gratuito suficiente para bajo volumen (>1000 emails/mes).

---

## Estructura del repositorio

```
├── backend/
│   ├── src/
│   │   ├── API/              # Controladores, DTOs, Middleware
│   │   ├── Core/             # Entidades, Interfaces, Enums
│   │   └── Infra/            # DB, Servicios, Migraciones
│   └── .env.example
├── frontend/
│   ├── src/app/
│   │   ├── core/             # Services, Guards, Interceptors, Models
│   │   ├── shared/           # Componentes reutilizables
│   │   └── features/         # Home, Catalog, Cart, Checkout, Orders, Profile, Auth, Admin
│   └── proxy.conf.json       # Proxy dev → backend
├── docs/                     # Documentación del proyecto
├── Dockerfile                # Multi-stage: build frontend + backend
├── README.md
└── CLAUDE.md                 # Instrucciones para asistentes de IA
```

---

## Modelo de datos

Entidades principales (PascalCase):

```
BusinessConfig (1 sola fila - singleton)
├── Name, Phone, Whatsapp, Address
├── LogoUrl, FaviconUrl, InstagramUrl
├── ShippingCost, MaxConcurrentOrders
└── EmailFrom, EmailFromName

Schedule (7 filas - una por día)
└── DayOfWeek, OpenTime, CloseTime, IsOpen

User
├── Email (unique), Name, Phone, Address
├── Role (Customer | Admin)
└── 1:N → Order, RefreshToken

MagicLink
└── Email, Token, ExpiresAt, UsedAt

RefreshToken
└── UserId, Token, ExpiresAt, RevokedAt

Category
├── Name, Description, ImageUrl
├── IsActive, SortOrder
└── 1:N → Product

Product
├── Name, Description, Price, ImageUrl
├── IsActive, IsAvailable
├── IsPromotion, DiscountPercent
├── HasVariants (flag)
├── CategoryId (FK)
├── 1:N → ProductVariant (opcional)
└── 1:N → CustomizationGroup (opcional)

ProductVariant  (ej: "Unidad", "Media docena", "Docena")
├── Name, Price, SelectionCount
└── ProductId (FK)

CustomizationGroup
├── Name (ej: "Sabores", "Guarnición", "Ingredientes")
├── SelectionType (Single | Multiple | Quantity)
├── MinSelections, MaxSelections, IsRequired
├── ProductId (FK)
└── 1:N → CustomizationOption

CustomizationOption
├── Name, PriceModifier
└── GroupId (FK)

DiscountCode
├── Code (unique), DiscountPercent
├── FreeShipping, IsActive
├── ValidFrom, ValidUntil
├── MaxUses, CurrentUses

Alert
├── Message, ValidFrom, ValidUntil, IsActive

Order
├── OrderCode (unique, formato YYYY-DDMM-HHMMSS)
├── Status (Pending | Preparing | OnTheWay | Delivered | Cancelled)
├── Subtotal, ShippingCost, DiscountAmount, Total
├── PaymentMethod (Cash | Transfer)
├── DeliveryName, DeliveryPhone, DeliveryAddress, DeliveryApartment, DeliveryNotes
├── WhatsappMessage (snapshot del mensaje generado)
├── Timestamps: CreatedAt, ConfirmedAt, ShippedAt, DeliveredAt, CancelledAt
├── UserId (FK, nullable)
├── DiscountCodeId (FK, nullable)
├── 1:N → OrderItem
└── 1:N → OrderStatusHistory

OrderItem
├── ProductName, VariantName (snapshots)
├── Quantity, UnitPrice, Subtotal
├── Observations
├── OrderId (FK)
└── 1:N → OrderItemCustomization

OrderItemCustomization
├── GroupName, OptionName (snapshots)
└── OptionQuantity, PriceModifier

OrderStatusHistory
└── OrderId, Status, Notes, CreatedAt, ChangedBy
```

**Decisiones clave:**
- Precios SIEMPRE se recalculan en el backend al crear pedido. El frontend solo muestra.
- Los OrderItems guardan **snapshots** (nombre, precio) para que el pedido no se rompa si editás el producto después.
- Los enums se persisten como string (`"Pending"`, no `0`) para legibilidad en queries.
- Fechas en UTC, conversión a zona horaria local solo para display/validación de horarios.

---

## Sistema de customización de productos

Este es el diferenciador clave del modelo de datos. Reemplaza flags hardcodeados (ej: `isEmpanada`, `hasSideDishes`, `isSalad`) con un sistema extensible:

```
Product
├── Variants[]                    (opcional - ej: tamaños/paquetes)
└── CustomizationGroups[]
    ├── SelectionType: Single     (elegir 1 - ej: salsa)
    ├── SelectionType: Multiple   (elegir N de M - ej: ingredientes ensalada)
    ├── SelectionType: Quantity   (elegir con cantidades - ej: sabores empanada)
    └── Options[]
```

**Ejemplo 1 — Empanadas por pack:**
- Product: "Empanadas"
- Variants: Unidad (selectionCount=1), Media docena (6), Docena (12)
- CustomizationGroup: "Sabores" (Quantity) con Options: Carne, JyQ, Pollo, Humita
- Al elegir "Docena" → debe completar 12 entre los sabores disponibles

**Ejemplo 2 — Ensalada armable:**
- Product: "Ensalada"
- CustomizationGroup: "Ingredientes" (Multiple, min=3, max=6)
- Options con priceModifier según si el ingrediente suma al precio

**Ejemplo 3 — Hamburguesa con guarnición:**
- Product: "Hamburguesa"
- CustomizationGroup: "Guarnición" (Single, required=true)
- Options: Papas fritas (0), Ensalada (0), Papas + Ensalada (+500)

---

## Endpoints del backend

### Públicos (sin auth)

```
POST   /api/auth/magic-link          Envía link de acceso por email
POST   /api/auth/verify              Verifica token, retorna JWT + Refresh
POST   /api/auth/refresh             Renueva JWT usando Refresh Token
GET    /api/config                   Config pública del negocio
GET    /api/categories               Listado de categorías activas
GET    /api/products?categoryId=     Productos por categoría (paginado)
GET    /api/products/promotions      Productos en promo
GET    /api/products/:id             Detalle con variantes y customizaciones
GET    /api/alerts/active            Alertas vigentes
```

### Cliente autenticado

```
GET    /api/profile                  Mi perfil
PUT    /api/profile                  Actualizar mi perfil
POST   /api/orders                   Crear pedido
GET    /api/orders                   Mis pedidos (paginado)
GET    /api/orders/:id               Detalle de mi pedido
POST   /api/orders/validate-code     Validar código de descuento
POST   /api/auth/logout              Cerrar sesión (revoca refresh token)
```

### Admin (auth + role=Admin)

```
GET    /api/admin/dashboard          Métricas del día
CRUD   /api/admin/categories         Gestión de categorías
CRUD   /api/admin/products           Gestión de productos (con variantes y customizaciones anidadas)
GET    /api/admin/orders             Pedidos con filtros
GET    /api/admin/orders/:id         Detalle con historial de estados
PUT    /api/admin/orders/:id/status  Cambiar estado del pedido
GET    /api/admin/schedules          Horarios
PUT    /api/admin/schedules          Actualizar horarios (bulk)
GET    /api/admin/config             Config del negocio
PUT    /api/admin/config             Actualizar config
CRUD   /api/admin/discount-codes     Códigos de descuento
CRUD   /api/admin/alerts             Alertas
POST   /api/admin/upload             Subir imagen (multipart, max 2MB, JPG/PNG/WebP)
DELETE /api/admin/upload?url=        Eliminar imagen
```

---

## Flujos principales

### Flujo 1: Cliente hace pedido

1. Cliente entra a la web → ve menú por categorías
2. Selecciona producto → abre modal con customizaciones
3. Elige variantes/opciones → precio se actualiza en vivo
4. Agrega al carrito (localStorage + signal reactivo)
5. Va al carrito → revisa items, total, envío
6. Click "Confirmar pedido"
   - Si no está logueado → redirige a `/auth/login?returnUrl=/checkout`
   - Ingresa email → recibe magic link
   - Hace clic en el link → `/auth/verify?token=X` → JWT guardado → volvió al checkout
7. Completa datos de entrega (pre-filled si ya pidió antes)
8. Elige método de pago (Efectivo | Transferencia)
9. Opcionalmente ingresa código de descuento
10. Click "Confirmar"
11. Backend:
    - Valida horario comercial
    - Valida capacidad de cocina
    - Recalcula precios server-side
    - Aplica código de descuento si corresponde
    - Genera `OrderCode` y mensaje de WhatsApp
    - Crea `Order` + `OrderItems` + `OrderItemCustomizations`
    - Crea `OrderStatusHistory` (Pending)
12. Frontend muestra pantalla de confirmación con botón "Enviar por WhatsApp"
13. Click abre deep link `https://wa.me/NUMERO?text=MENSAJE` → abre app WhatsApp con mensaje prellenado

### Flujo 2: Admin gestiona pedido

1. Admin entra al panel → ve pedidos pendientes
2. Click en pedido → expande detalle (items, dirección, historial)
3. Botón contextual según estado:
   - **Pending** → "Preparar" | "Cancelar"
   - **Preparing** → "Enviar" | "Cancelar"
   - **OnTheWay** → "Entregado" | "Cancelar"
4. Al cambiar estado:
   - Backend valida transición permitida (máquina de estados)
   - Actualiza `Order.Status` + timestamp correspondiente
   - Crea nuevo `OrderStatusHistory`

**Transiciones válidas:**
```
Pending ──┬──→ Preparing ──┬──→ OnTheWay ──┬──→ Delivered
          │                 │                │
          └──→ Cancelled    └──→ Cancelled   └──→ Cancelled
```

### Flujo 3: Auth Magic Link

1. Cliente ingresa email → `POST /api/auth/magic-link`
2. Backend:
   - Invalida magic links previos no usados (mismo email)
   - Genera token aleatorio seguro (32 bytes)
   - Crea `MagicLink` con `ExpiresAt = now + 15min`
   - Envía email con link: `https://app.com/auth/verify?token=XXX`
3. Cliente hace clic en el email → frontend llama `POST /api/auth/verify`
4. Backend:
   - Valida token (existe, no usado, no expirado)
   - Marca `MagicLink.UsedAt = now`
   - Busca o crea `User` con el email
   - Genera JWT (15 min) + Refresh Token (7 días)
   - Retorna ambos al frontend
5. Frontend guarda JWT y Refresh Token en localStorage
6. HTTP Interceptor agrega `Authorization: Bearer TOKEN` a cada request
7. Si el backend retorna 401 → interceptor usa Refresh Token para obtener JWT nuevo
8. Si Refresh Token también falla → logout

---

## Funcionalidades del admin

| Módulo | Descripción |
|---|---|
| **Dashboard** | Métricas del día: pedidos por estado, ingresos, capacidad de cocina |
| **Categorías** | CRUD con imagen, toggle activo, orden |
| **Productos** | CRUD completo con variantes, grupos de customización y opciones anidadas |
| **Pedidos** | Lista con filtros, detalle expandible, cambio de estados |
| **Horarios** | Configuración por día: abierto/cerrado + apertura/cierre |
| **Config** | Datos del negocio: nombre, logo, favicon, WhatsApp, dirección, envío, capacidad, email remitente |
| **Códigos descuento** | CRUD con % descuento, envío gratis, fechas válidas, usos máximos |
| **Alertas** | Mensajes temporales que se muestran como snackbar a los clientes |

---

## Principios de desarrollo

### Seguridad (OWASP)
- Validación de inputs en backend siempre (FluentValidation o similar)
- Parametrización SQL via ORM (nunca concatenar strings)
- JWT con expiración corta (15 min) + Refresh Token rotativo (7 días)
- CORS estricto (solo dominio del frontend permitido)
- Rate limiting en endpoints sensibles (auth: 5/min, general: 60/min)
- Sanitización de outputs (XSS)
- HTTPS obligatorio en producción
- **Precios siempre se calculan en backend, nunca confiar en frontend**
- Validación de imágenes: tipo (JPG/PNG/WebP), tamaño máximo (2MB)
- Role-based access control (Customer | Admin)
- `.env` para secretos, nunca commitear

### SOLID
- **S**: Un servicio = una responsabilidad (AuthService, OrderService, EmailService)
- **O**: Sistema de customización extensible sin modificar código existente
- **L**: Interfaces bien definidas entre capas (Core → Infra → API)
- **I**: Interfaces específicas por funcionalidad
- **D**: Inyección de dependencias en todo el stack

### Zona horaria
- Backend: fechas en UTC internamente
- Conversión a zona horaria local solo para validación de horarios y display
- Frontend muestra siempre en hora local

### Convenciones

**Backend:**
- PascalCase para clases, métodos, propiedades públicas
- camelCase para variables locales y parámetros
- Async/await en todos los endpoints
- DTOs separados para Request/Response (nunca exponer entidades directamente)
- Repository pattern por entidad principal
- Excepciones custom para reglas de negocio (ej: `BusinessException` → 400)

**Frontend:**
- kebab-case para archivos y selectores
- PascalCase para clases e interfaces TS
- camelCase para propiedades y métodos
- Standalone components (sin NgModules)
- Signals para estado reactivo (no RxJS Subjects)
- Interfaces tipadas espejo del backend
- Lazy loading por feature module

---

## UI/UX

### Layout cliente
- **Header**: logo + nombre negocio + nav horizontal (desktop), solo logo (mobile)
- **Bottom nav (mobile)**: Inicio | Carrito | Pedidos | Perfil | Admin (si aplica)
- **Home**: hero banner + promos en carousel + grilla de categorías
- **Catálogo**: grid de productos con badges (promo, agotado)
- **Dialog de producto**: fullscreen en mobile, centrado en desktop

### Layout admin
- **Sidebar fija** en desktop (colapsable en mobile)
- **Link activo** con background color accent
- **Toolbar** con título de sección

### Patrones consistentes
- **Tablas admin**: envueltas en `table-wrapper` con `overflow-x: auto`
- **Columna acciones**: siempre primera a la izquierda, `white-space: nowrap`
- **Botones Crear/Actualizar/Cancelar**: siempre alineados a la derecha
- **Formularios admin**: toggle show/hide con botón "Nuevo X" / "Cerrar"
- **Eliminaciones**: siempre con ConfirmDialog, nunca `window.confirm`
- **Imágenes**: upload via zona drag/click, preview, botón cambiar/eliminar
- **Skeleton loaders** para carga inicial, spinners solo en acciones puntuales

### Paleta de colores (criterios)
- **Primary**: color principal de la marca (cálido si es comida)
- **Background**: tono cálido suave (no gris frío)
- **Border**: muy sutil, armónico con el primary
- **Text**: 3 niveles (primary, secondary, muted) con contraste WCAG AA
- **Status badges**: paleta completa (pending, preparing, ontheway, delivered, cancelled)
- **Success/Error/Warning**: colores estándar con contraste alto

### Responsive
- Mobile-first (<768px): bottom nav, formularios full-width, grids 2 cols
- Desktop (>=768px): nav horizontal, grids auto-fill, sidebar admin fija
- Touch targets mínimos de 44x44px
- `overflow-x: hidden` global para evitar scroll horizontal

---

## Configuración de producción

### Variables de entorno requeridas

```
DATABASE_URL              Connection string PostgreSQL
JWT_SECRET                String aleatorio >32 chars
JWT_ISSUER                Identificador del emisor
JWT_AUDIENCE              Identificador del destinatario
JWT_EXPIRY_MINUTES        15 (recomendado)
REFRESH_TOKEN_EXPIRY_DAYS 7 (recomendado)
EMAIL_API_KEY             API key del proveedor de email
EMAIL_FROM                Email remitente verificado
EMAIL_FROM_NAME           Nombre que aparece como remitente
STORAGE_PATH              Ruta al volumen persistente (/app/storage)
MAX_IMAGE_SIZE_MB         2
FRONTEND_URL              URL pública del servicio
ASPNETCORE_ENVIRONMENT    Production
```

### Optimización de memoria (apps con pocos usuarios)

Para apps .NET con bajo tráfico, usar Workstation GC con conservación agresiva:

```
DOTNET_gcServer=0                    # Workstation GC en vez de Server GC
DOTNET_GCHeapHardLimit=0x6400000     # 100MB heap máximo
DOTNET_GCConserveMemory=9            # Máxima agresividad (escala 0-9)
```

Reduce el consumo típico de ~250MB a ~100MB. Si aparece `OutOfMemoryException`, subir el heap a `0xC800000` (200MB).

### Dockerfile multi-stage

```
Stage 1: Build del frontend
  - node:X-alpine
  - npm ci + build producción
  - output a /frontend/dist/

Stage 2: Build del backend
  - sdk:X
  - dotnet restore + publish Release
  - output a /app/publish/

Stage 3: Runtime final
  - aspnet:X (imagen chica)
  - Copia publish del backend
  - Copia dist del frontend a wwwroot/
  - mkdir /app/storage
  - EXPOSE 8080
  - ENTRYPOINT dotnet API.dll
```

### Hosting en Railway (o similar)

1. Conectar repo GitHub
2. Agregar servicio PostgreSQL (addon)
3. Configurar variables de entorno
4. Crear Volume montado en `/app/storage` (imágenes persistentes)
5. Generar dominio público (puerto 8080)
6. Primer deploy automático
7. Promover primer admin: `UPDATE users SET "Role"='Admin' WHERE "Email"='tu@email.com';`

---

## Primera configuración post-deploy

1. Login con el email del dueño → recibir magic link → acceder
2. Query SQL en la BD: promover a Admin
3. Volver a loguearse (JWT se actualiza con el nuevo rol)
4. Admin → Configuración → completar:
   - Nombre, teléfono, WhatsApp, dirección
   - Subir logo (se usa como favicon también)
   - Configurar costo de envío
   - Email remitente (verificado en el proveedor de email)
5. Admin → Horarios → configurar días y horas de atención
6. Admin → Categorías → crear categorías con imagen
7. Admin → Productos → crear productos con variantes/customizaciones
8. Probar flujo completo como cliente (logout o ventana incógnita)

---

## Consideraciones de escalabilidad

### Cuándo empezar a preocuparse
- **Hasta ~200 usuarios concurrentes navegando**: el stack funciona sin problemas
- **Hasta ~50 pedidos activos simultáneos**: sin ajustes adicionales
- **Más de eso**: considerar las siguientes mejoras

### Escalabilidad horizontal
- Separar frontend del backend (CDN para static files)
- Cache con Redis (config, categorías, productos activos)
- Mover storage de imágenes a S3/R2 (en vez de volume local)
- Connection pooling de PostgreSQL (PgBouncer)
- Múltiples replicas del backend detrás de un load balancer

### Escalabilidad funcional
- Multi-sucursal: agregar tabla `Branch` con FK en Products, Orders
- Repartidores: tabla `Deliverer` + asignación a órdenes + geolocalización
- Tracking en mapa: WebSocket + integración con servicio de mapas
- Pagos online: SDK de pasarela de pagos (Stripe, Mercado Pago)
- Notificaciones push: Firebase Cloud Messaging o similar

---

## Testing y calidad

### Mínimo viable
- Backend: tests unitarios de servicios de lógica de negocio (cálculo de totales, máquina de estados)
- Frontend: smoke tests de rutas principales
- E2E: 1-2 tests del flujo crítico (crear pedido end-to-end)

### Recomendado para producción
- Cobertura >60% en capa de servicios del backend
- Tests de integración de endpoints críticos (auth, orders)
- Tests E2E de flujo completo cliente y admin
- Performance testing básico (k6, Artillery) para identificar cuellos de botella

---

## Tiempo estimado de desarrollo

Para un desarrollador con el stack:

| Fase | Tiempo |
|---|---|
| Setup inicial + auth | 1 semana |
| Modelo de datos + APIs backend | 1-2 semanas |
| Frontend cliente (home, catálogo, carrito, checkout) | 2 semanas |
| Panel admin (CRUDs, pedidos, config) | 2 semanas |
| Polish UI/UX + responsive | 1 semana |
| Deploy + documentación | 3-5 días |
| **Total MVP funcional** | **7-8 semanas** |

---

## Decisiones de diseño que rescatar

Pequeñas decisiones que marcan diferencia:

1. **Magic Link en vez de password**: mejor UX, sin problemas de olvido de contraseña
2. **Backend sirve el frontend**: deploy más simple, sin CORS entre dominios
3. **Sistema de customización genérico**: reemplaza flags hardcodeados (is_empanada, etc.)
4. **Snapshots en órdenes**: los pedidos no se rompen al editar productos
5. **Precios calculados server-side**: imposible alterar el total desde el frontend
6. **Volume persistente para imágenes**: simple, sin dependencia de servicios externos
7. **Capacidad de cocina configurable**: protege al negocio de recibir más pedidos de los que puede procesar
8. **WhatsApp deep link**: no requiere integración pagada, abre la app del cliente directamente
9. **Config del negocio en BD**: cambios sin redeploy (nombre, logo, email remitente)
10. **Tema CSS con variables globales**: cambio de paleta se aplica con reemplazo en un archivo central
