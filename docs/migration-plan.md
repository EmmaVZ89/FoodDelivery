# Plan de Migracion - Lo de Luna

## Resumen

Migracion de 3 apps legacy (Angular 14/15 + Firebase + Ionic) a una webapp unificada (.NET 8 + Angular 19 + PostgreSQL). El orden sigue el flujo del usuario final.

---

## Fase 0: Fundacion del Proyecto

### 0.1 Setup Backend (.NET 8)
- Crear solution con 3 proyectos:
  - `LosDeLuna.API` — Controllers, Middleware, DTOs, Program.cs
  - `LosDeLuna.Core` — Entidades, Interfaces, Enums, Excepciones
  - `LosDeLuna.Infra` — DbContext, Repositorios, Servicios, Migraciones
- Configurar:
  - Entity Framework Core + PostgreSQL (Npgsql)
  - FluentValidation para validaciones
  - AutoMapper para Entity ↔ DTO
  - JWT Authentication + Refresh Tokens
  - CORS para frontend
  - Rate limiting (AspNetCoreRateLimit)
  - Swagger/OpenAPI
  - Middleware de excepciones global
  - Configuracion via .env / appsettings

### 0.2 Setup Frontend (Angular 19)
- `ng new frontend --style=scss --routing --standalone`
- Instalar:
  - Angular Material (ultima version)
  - @angular/cdk
  - ngx-skeleton-loader
  - Libreria de iconos (Material Icons)
- Configurar:
  - Estructura de carpetas (core, shared, features, layouts)
  - HTTP Interceptor para JWT
  - Auth Guard y Admin Guard
  - Locale es-AR
  - Environment files (.env via proxy)
  - Paleta de colores (migrar de app legacy)
  - Tema Material custom
  - Responsive breakpoints

### 0.3 Base de Datos
- Crear migracion inicial con todo el schema
- Seed data:
  - 1 fila en business_config (datos de Lo de Luna)
  - 7 filas en schedules (Lunes a Domingo)
  - 1 usuario admin

### 0.4 Autenticacion (Magic Link)
**Backend:**
- `POST /api/auth/magic-link` — recibe email, genera token, envia email
- `POST /api/auth/verify` — recibe token, valida, crea/busca usuario, retorna JWT + refresh token
- `POST /api/auth/refresh` — renueva JWT con refresh token
- `POST /api/auth/logout` — revoca refresh token
- Servicio de email con Resend (3000 emails/mes gratis)
- Auto-registro: si el email no existe, se crea usuario con rol `customer`

**Frontend:**
- Pagina `/auth/login` — formulario con email
- Pagina `/auth/verify?token=xxx` — verifica token automaticamente
- AuthService con manejo de JWT en memoria + refresh token en httpOnly cookie
- AuthGuard para rutas protegidas
- AdminGuard para rutas admin
- HTTP Interceptor que adjunta JWT y maneja 401

**Flujo:**
```
1. Usuario ingresa email
2. Backend genera magic link (token con 15min expiracion)
3. Se envia email con link: {FRONTEND_URL}/auth/verify?token=xxx
4. Usuario clickea link
5. Frontend envia token a /api/auth/verify
6. Backend valida, crea/busca usuario, retorna JWT + refresh
7. Frontend almacena JWT, redirige a home
```

---

## Fase 1: Home + Catalogo

> Lo primero que ve el usuario al entrar a la web.

### 1.1 API - Configuracion del Negocio
- `GET /api/config` — retorna config publica (nombre, logo, whatsapp, horarios, etc.)
- Cache en frontend (se pide 1 vez, se comparte via servicio)
- El frontend usa estos datos para: header, footer, favicon, WhatsApp link, validacion de horarios

### 1.2 API - Categorias
- `GET /api/categories` — lista activas, ordenadas por sort_order
- `GET /api/categories/{id}` — detalle con productos

### 1.3 API - Productos
- `GET /api/products?categoryId=X&page=1&pageSize=20` — paginado, solo activos y disponibles
- `GET /api/products/promotions` — productos en promocion
- `GET /api/products/{id}` — detalle con variantes y customization groups/options

### 1.4 Frontend - Home Page
- **Header**: logo + nombre del negocio (desde config) + menu hamburguesa
- **Carousel de promos**: productos con is_promotion=true, muestra precio con descuento
- **Grilla de categorias**: cards con imagen y nombre, click navega a catalogo
- **Skeleton loaders**: en carousel y categorias mientras carga
- **Footer**: direccion, WhatsApp, Instagram (desde config)
- **Alerta banner**: si hay alerta activa para la fecha actual

### 1.5 Frontend - Catalogo por Categoria
- Ruta: `/catalog/:categoryId`
- Lista de productos de la categoria
- Cada card: imagen, nombre, precio (con descuento si aplica), tag "Agotado" si no disponible
- Click en producto abre modal de detalle
- Lazy loading / infinite scroll o paginado
- Skeleton loaders mientras carga

---

## Fase 2: Producto + Carrito

> El usuario elige productos y los agrega al carrito.

### 2.1 API - Detalle de Producto
- `GET /api/products/{id}` ya incluye:
  - Variantes (si has_variants=true)
  - Customization groups con sus options
- `GET /api/cart/validate` — valida items del carrito contra estado actual de productos (precios, disponibilidad)

### 2.2 Frontend - Modal de Producto
- **Producto simple**: imagen, nombre, descripcion, precio, cantidad (+/-), observaciones, boton "Agregar"
- **Producto con variantes** (ej: empanadas):
  1. Elegir variante (Unidad/Media docena/Docena) → muestra precio
  2. Seleccionar opciones del grupo (sabores) → cantidad segun variant.selection_count
  3. Observaciones
  4. Agregar al carrito
- **Producto con customizacion single** (ej: guarnicion):
  1. Elegir 1 opcion del grupo
  2. Precio se ajusta con price_modifier
  3. Agregar al carrito
- **Producto con customizacion multiple** (ej: ensalada):
  1. Elegir hasta max_selections opciones
  2. Contador de selecciones (ej: "3/4 ingredientes")
  3. Agregar al carrito
- **Validaciones**:
  - No agregar si negocio cerrado (check horarios)
  - No agregar si producto no disponible
  - Respetar min/max selections
- **Skeleton loaders** en contenido del modal

### 2.3 Frontend - Carrito
- Ruta: `/cart`
- Almacenamiento: localStorage (persistencia) + BehaviorSubject/Signal (reactividad)
- **Item del carrito**:
  ```typescript
  interface CartItem {
    productId: number;
    variantId?: number;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    customizations: CartCustomization[];
    observations?: string;
  }
  ```
- **Funcionalidades**:
  - Lista de items con detalle (nombre, variante, customizaciones, precio)
  - Modificar cantidad (+/-)
  - Eliminar item
  - Subtotal por item
  - Costo de envio (desde config)
  - Total en tiempo real
  - Boton "Confirmar pedido" (valida horarios + auth)
  - Si no logueado → redirige a login con returnUrl
- **Badge en navegacion**: cantidad total de items

---

## Fase 3: Checkout + Pedidos

> El usuario confirma su pedido en 1 paso.

### 3.1 API - Pedidos
- `POST /api/orders` — crear pedido
  - Recibe: items del carrito, datos de entrega, metodo de pago, codigo descuento (opcional)
  - Valida: productos activos/disponibles, precios correctos (recalcula en backend), horario, capacidad cocina
  - Genera: order_code, calcula totales, genera mensaje WhatsApp
  - Retorna: orden creada con code y mensaje WhatsApp
- `GET /api/orders` — historial del usuario (paginado)
- `GET /api/orders/{id}` — detalle de orden con items y estados
- `POST /api/orders/validate-code` — validar codigo de descuento
- `GET /api/orders/kitchen-capacity` — retorna si hay capacidad disponible

### 3.2 API - Validacion de Capacidad de Cocina
```
Pedidos activos = COUNT(orders WHERE status IN ('pending', 'preparing'))
Si pedidos activos >= max_concurrent_orders AND max_concurrent_orders > 0:
  → Rechazar nuevo pedido con mensaje amigable
```

### 3.3 Frontend - Checkout (1 paso)
- Ruta: `/checkout`
- Requiere auth (AuthGuard)
- **Formulario**:
  - Nombre (pre-filled desde perfil)
  - Telefono (pre-filled)
  - Direccion (pre-filled)
  - Entre calles (opcional)
  - Depto/Piso (toggle + campo)
  - Referencia (opcional)
  - Metodo de pago: Efectivo | Transferencia
  - Monto con el que paga (si efectivo, validar >= total)
  - Codigo de descuento (input + boton validar)
- **Resumen del pedido**: lista de items, subtotal, descuento, envio, TOTAL
- **Boton "Confirmar Pedido"**:
  1. Valida formulario
  2. POST /api/orders
  3. Muestra pantalla de confirmacion con:
     - Numero de pedido
     - Codigo
     - Boton "Enviar por WhatsApp" (deeplink con mensaje prearmado)
     - Boton "Ver mis pedidos"
  4. Limpia carrito
- **Validaciones pre-envio**:
  - Horario comercial
  - Capacidad de cocina → si lleno, mostrar mensaje y bloquear
- **Persistencia**: datos del formulario en localStorage (auto-save)

### 3.4 Frontend - Historial de Pedidos
- Ruta: `/orders`
- Requiere auth
- Lista de pedidos del usuario (paginado, mas recientes primero)
- Cada pedido muestra:
  - Codigo + fecha
  - Estado con icono y color:
    - Pendiente (naranja, reloj)
    - En preparacion (azul, cocinero)
    - En camino (celeste, moto)
    - Entregado (verde, check)
    - Cancelado (rojo, X)
  - Total
- Click expande detalle: items, direccion, metodo de pago
- Boton "Reenviar por WhatsApp" (para pedidos no cancelados)

### 3.5 Generacion de Mensaje WhatsApp
El backend genera el mensaje formateado:
```
*Pedido #42 - 2026-0304-143045*
Fecha: 03/04/2026 - 14:30hs

*Productos:*
• 1x Hamburguesa Completa - Guarnicion: Papas fritas - $3.500
• 1x Docena de Empanadas - Sabores: 4 Carne, 4 JyQ, 4 Pollo - $4.500
  Obs: Sin picante

Subtotal: $8.000
Envio: $500
Descuento (10%): -$800
*Total: $7.700*

*Entrega:*
Juan Perez - +54 9 11 6920-0561
Av. Main 123, entre Calle 1 y Calle 2
Depto 5B - Frente al supermercado

Pago: Efectivo ($10.000)
```

---

## Fase 4: Panel de Administracion

> Gestion completa del negocio.

### 4.1 Layout Admin
- Ruta base: `/admin` (protegida con AdminGuard)
- Sidebar con navegacion:
  - Dashboard
  - Categorias
  - Productos
  - Pedidos
  - Horarios
  - Codigos de descuento
  - Alertas
  - Configuracion
- Responsive: sidebar colapsable en mobile
- Header: nombre admin + logout

### 4.2 Dashboard
- Pedidos de hoy (cantidad por estado)
- Pedidos pendientes (lista rapida con acciones)
- Grafico simple: pedidos de la semana
- Capacidad de cocina actual (X/Y pedidos activos)

### 4.3 CRUD Categorias
- Tabla con: nombre, imagen (thumbnail), activo (toggle), orden
- Drag & drop para reordenar
- Modal/drawer para crear/editar:
  - Nombre, descripcion
  - Subir imagen (preview, max 2MB, validacion tipo)
  - Activo toggle
- Eliminar con confirmacion

**API Admin:**
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/{id}`
- `DELETE /api/admin/categories/{id}`
- `PUT /api/admin/categories/reorder` — recibe array de {id, sort_order}

### 4.4 CRUD Productos
- Tabla con: nombre, categoria, precio, promo, disponible, activo, orden
- Filtros: por categoria, por estado
- Modal/drawer para crear/editar:
  - Datos basicos: nombre, descripcion, precio, categoria
  - Imagen (subir con preview)
  - Flags: activo, disponible, es promocion (+ % descuento)
  - Toggle "Tiene variantes" → si activo:
    - Lista de variantes (nombre, precio, cantidad de seleccion)
    - Agregar/editar/eliminar variantes
  - Grupos de customizacion:
    - Agregar grupo (nombre, tipo seleccion, min, max, requerido)
    - Dentro de cada grupo: agregar opciones (nombre, precio adicional)
    - Eliminar grupo/opcion
- Eliminar producto con confirmacion

**API Admin:**
- `GET /api/admin/products?page=1&categoryId=X`
- `POST /api/admin/products`
- `PUT /api/admin/products/{id}`
- `DELETE /api/admin/products/{id}`
- `PUT /api/admin/products/reorder`
- CRUD variantes y customizaciones via endpoints del producto (nested)

### 4.5 Gestion de Pedidos
- Tabla con: #, codigo, cliente, fecha, estado, total, acciones
- Filtros: por estado, por rango de fechas
- Paginado
- **Acciones rapidas** (botones por fila):
  - Pending → "Preparar" (cambia a preparing)
  - Preparing → "Enviar" (cambia a on_the_way)
  - On the way → "Entregado" (cambia a delivered)
  - Cualquiera (no final) → "Cancelar"
- Click expande detalle del pedido
- Auto-refresh cada 30 segundos (o polling)

**API Admin:**
- `GET /api/admin/orders?status=X&from=Y&to=Z&page=1`
- `PUT /api/admin/orders/{id}/status` — body: { status, notes }
- `GET /api/admin/orders/{id}` — detalle completo

### 4.6 Horarios
- Vista semanal simple: 7 filas (Lunes a Domingo)
- Cada dia: toggle abierto/cerrado + hora apertura + hora cierre
- Boton "Guardar todo"
- Sin drag & drop (el orden es fijo)

**API Admin:**
- `GET /api/admin/schedules`
- `PUT /api/admin/schedules` — recibe array completo de 7 dias

### 4.7 Codigos de Descuento
- Tabla: codigo, descuento %, envio gratis, activo, usos
- CRUD con modal
- Validacion: descuento max 50%

**API Admin:**
- CRUD estandar en `/api/admin/discount-codes`

### 4.8 Alertas
- Tabla: mensaje, desde, hasta, activo
- CRUD con modal

**API Admin:**
- CRUD estandar en `/api/admin/alerts`

### 4.9 Configuracion del Negocio
- Formulario unico con todos los campos de business_config
- Subir logo y favicon
- Configurar capacidad de cocina
- Configurar costo de envio
- Preview del logo

**API Admin:**
- `GET /api/admin/config`
- `PUT /api/admin/config`
- `POST /api/admin/config/upload-logo`
- `POST /api/admin/config/upload-favicon`

### 4.10 Subida de Imagenes
- Libreria recomendada: `ngx-dropzone` o `ng2-file-upload` (Angular compatible)
- Drag & drop + click para seleccionar
- Preview antes de subir
- Validacion: tipo (jpg, png, webp), tamano (max 2MB)
- Backend: guardar en disco (Railway Volume) + servir via endpoint estatico
- Endpoint: `POST /api/admin/upload` → retorna URL de la imagen

---

## Fase 5: Polish y Optimizaciones

### 5.1 UI/UX
- Revisar responsive en todas las pantallas (mobile, tablet, desktop)
- Animaciones sutiles (Angular animations)
- Skeleton loaders en todas las cargas
- Toast notifications consistentes
- Estados vacios con ilustracion ("No hay pedidos aun")
- PWA opcional (manifest.json para "agregar a pantalla de inicio")

### 5.2 Performance
- Lazy loading de todas las feature modules
- Paginado en todos los listados
- Compresion de imagenes al subir
- Cache de config y categorias
- Angular SSR/prerender para SEO (opcional, fase futura)

### 5.3 Seguridad
- Audit OWASP Top 10:
  1. Injection: parametrizado via EF Core ✓
  2. Broken Auth: JWT + refresh + magic link ✓
  3. Sensitive Data: HTTPS + .env + no secrets en frontend ✓
  4. XXE: no aplica (JSON only) ✓
  5. Broken Access: Guards + policies en backend ✓
  6. Misconfiguration: CORS estricto, headers de seguridad ✓
  7. XSS: sanitizacion Angular built-in + CSP header ✓
  8. Deserialization: DTOs validados ✓
  9. Components vulnerables: mantener deps actualizadas
  10. Logging: middleware de logging para acciones admin

### 5.4 Preparacion para Produccion
- Docker Compose (backend + frontend + PostgreSQL)
- Dockerfile para backend (.NET)
- Dockerfile para frontend (nginx + Angular build)
- Railway config files
- Variables de entorno para cada environment
- Healthcheck endpoints
- Script de migracion de datos desde Firestore (opcional)

---

## Resumen de Endpoints API

### Publicos (sin auth)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/config | Config del negocio |
| GET | /api/categories | Categorias activas |
| GET | /api/products?categoryId=X | Productos paginados |
| GET | /api/products/promotions | Promos activas |
| GET | /api/products/{id} | Detalle con variantes y customizaciones |
| GET | /api/alerts/active | Alertas vigentes |
| POST | /api/auth/magic-link | Solicitar magic link |
| POST | /api/auth/verify | Verificar token |
| POST | /api/auth/refresh | Renovar JWT |

### Cliente (auth requerida)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | /api/orders | Mis pedidos (paginado) |
| GET | /api/orders/{id} | Detalle de mi pedido |
| POST | /api/orders | Crear pedido |
| POST | /api/orders/validate-code | Validar codigo descuento |
| GET | /api/orders/kitchen-capacity | Consultar capacidad |
| GET | /api/profile | Mi perfil |
| PUT | /api/profile | Actualizar perfil |
| POST | /api/auth/logout | Cerrar sesion |

### Admin (auth + rol admin)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | /api/admin/categories | CRUD categorias |
| PUT | /api/admin/categories/reorder | Reordenar |
| GET/POST/PUT/DELETE | /api/admin/products | CRUD productos |
| PUT | /api/admin/products/reorder | Reordenar |
| GET | /api/admin/orders | Pedidos (filtros) |
| PUT | /api/admin/orders/{id}/status | Cambiar estado |
| GET/PUT | /api/admin/schedules | Horarios |
| GET/POST/PUT/DELETE | /api/admin/discount-codes | Codigos descuento |
| GET/POST/PUT/DELETE | /api/admin/alerts | Alertas |
| GET/PUT | /api/admin/config | Config negocio |
| POST | /api/admin/upload | Subir imagen |
| GET | /api/admin/dashboard | Metricas |

---

## Estimacion por Fase

| Fase | Componentes principales |
|------|------------------------|
| **0. Fundacion** | Setup .NET + Angular + PostgreSQL + Auth magic link |
| **1. Home + Catalogo** | Config API, Home page, Categorias, Listado productos, Skeletons |
| **2. Producto + Carrito** | Modal detalle (customizaciones), Carrito reactivo |
| **3. Checkout + Pedidos** | Checkout 1 paso, WhatsApp, Historial, Estados |
| **4. Admin** | Dashboard, CRUD completo, Gestion pedidos, Config |
| **5. Polish** | Responsive final, Performance, Seguridad, Docker |

---

## Orden de Implementacion Detallado

Dentro de cada fase, el orden es:
1. **Modelos/Entidades** (.NET Core)
2. **Migracion EF** (schema)
3. **Repositorios + Servicios** (.NET Infra)
4. **Controllers + DTOs** (.NET API)
5. **Modelos TypeScript** (Angular)
6. **Servicios Angular** (HTTP)
7. **Componentes UI** (Angular)
8. **Tests basicos**

Este orden garantiza que siempre hay backend funcionando antes de construir el frontend.


---

## Estado Actual (2026-04-04)

| Fase | Estado |
|------|--------|
| Fase 0: Fundacion | Completada |
| Fase 1: Home + Catalogo | Completada |
| Fase 2: Carrito + Checkout + Pedidos | Completada |
| Fase 3: Admin Panel | Completada |
| Fase 4: Polish UI/UX | Completada |
| Fase 5: Deploy Railway | Pendiente |

### Pendiente para produccion
- Configurar Resend API key para emails reales
- Configurar Railway: Dockerfile backend, nginx frontend, PostgreSQL, Volume para imagenes
- Variables de entorno de produccion
- Dominio custom (opcional)
- SSL/HTTPS automatico via Railway
