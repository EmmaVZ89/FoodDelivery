# Modelo de Base de Datos - Lo de Luna

## Diagrama de Relaciones

```
business_config (1 fila)
schedules

users ──────┬── magic_links
            ├── refresh_tokens
            └── orders ──────┬── order_items ── order_item_customizations
                             └── order_status_history

categories ── products ──┬── product_variants
                         └── customization_groups ── customization_options

discount_codes
alerts
```

## Schema SQL (PostgreSQL 16)

### 1. Configuracion del Negocio

```sql
CREATE TABLE business_config (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    whatsapp        VARCHAR(20) NOT NULL,
    logo_url        TEXT,
    favicon_url     TEXT,
    instagram_url   TEXT,
    address         TEXT,
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    max_concurrent_orders INT DEFAULT 0,       -- 0 = sin limite
    shipping_cost   DECIMAL(10, 2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Una sola fila, se actualiza con UPDATE
-- Insertar fila seed en migracion inicial
```

### 2. Horarios

```sql
CREATE TABLE schedules (
    id              SERIAL PRIMARY KEY,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    -- 0=Lunes, 1=Martes, ..., 6=Domingo
    open_time       TIME,
    close_time      TIME,
    is_open         BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0
);

-- 7 filas (una por dia), seed en migracion inicial
-- Logica: si is_open=false, el dia esta cerrado
-- Validacion en backend: hora Argentina actual entre open_time y close_time
```

### 3. Usuarios

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(100),
    phone           VARCHAR(20),
    address         TEXT,
    between_streets VARCHAR(255),
    apartment_info  VARCHAR(100),
    delivery_notes  TEXT,
    role            VARCHAR(20) DEFAULT 'customer'
                    CHECK (role IN ('customer', 'admin')),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### 4. Autenticacion (Magic Link)

```sql
CREATE TABLE magic_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    email           VARCHAR(255) NOT NULL,
    token           VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Token expira en 15 minutos
-- Si user_id es NULL, el usuario aun no existe (se crea al usar el link)
-- Limpiar tokens expirados con job periodico

CREATE INDEX idx_magic_links_token ON magic_links(token);
CREATE INDEX idx_magic_links_email ON magic_links(email);

CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
```

### 5. Categorias

```sql
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    image_url       TEXT,
    is_active       BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_active ON categories(is_active, sort_order);
```

### 6. Productos

```sql
CREATE TABLE products (
    id              SERIAL PRIMARY KEY,
    category_id     INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    price           DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    image_url       TEXT,
    is_active       BOOLEAN DEFAULT true,
    is_available    BOOLEAN DEFAULT true,    -- stock/disponibilidad temporal
    is_promotion    BOOLEAN DEFAULT false,
    discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    has_variants    BOOLEAN DEFAULT false,   -- si true, el precio base se ignora y se usa el de la variante
    sort_order      INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active, is_available, sort_order);
CREATE INDEX idx_products_promotion ON products(is_promotion) WHERE is_promotion = true;
```

### 7. Variantes de Producto

```sql
-- Para productos con diferentes presentaciones (empanadas: unidad/media docena/docena)
CREATE TABLE product_variants (
    id              SERIAL PRIMARY KEY,
    product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,  -- "Unidad (min 3)", "Media docena", "Docena"
    price           DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    selection_count INT NOT NULL,           -- cuantas selecciones requiere (3, 6, 12)
    sort_order      INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
```

**Como funciona:**
- Si un producto `has_variants = true`, el frontend muestra las variantes en vez del precio base.
- `selection_count` define cuantas opciones del grupo de customizacion se deben elegir.
- Ej: Empanada "Docena" → price=X, selection_count=12 → el usuario elige 12 sabores.

### 8. Grupos de Customizacion

```sql
-- Reemplaza las colecciones legacy: empanadas, sidedishes, ingredients
CREATE TABLE customization_groups (
    id              SERIAL PRIMARY KEY,
    product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,  -- "Sabores", "Guarnicion", "Ingredientes"
    selection_type  VARCHAR(20) NOT NULL
                    CHECK (selection_type IN ('single', 'multiple', 'quantity')),
    -- single: elegir 1 (guarnicion)
    -- multiple: elegir N (ingredientes ensalada)
    -- quantity: elegir con cantidades (sabores empanada)
    min_selections  INT DEFAULT 0,
    max_selections  INT,                    -- NULL = sin limite
    -- Si el producto has_variants=true, max_selections se toma del variant.selection_count
    is_required     BOOLEAN DEFAULT false,
    sort_order      INT DEFAULT 0
);

CREATE INDEX idx_customization_groups_product ON customization_groups(product_id);
```

### 9. Opciones de Customizacion

```sql
CREATE TABLE customization_options (
    id              SERIAL PRIMARY KEY,
    group_id        INT NOT NULL REFERENCES customization_groups(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,  -- "Carne", "Jamon y Queso", "Papas fritas"
    price_modifier  DECIMAL(10, 2) DEFAULT 0,  -- costo adicional (0 si incluido)
    is_active       BOOLEAN DEFAULT true,
    sort_order      INT DEFAULT 0
);

CREATE INDEX idx_customization_options_group ON customization_options(group_id);
```

### 10. Ejemplos del Sistema de Customizacion

```
EJEMPLO 1: Hamburguesa con guarnicion
├── Product: "Hamburguesa Completa" (price: 3500, has_variants: false)
└── CustomizationGroup: "Guarnicion" (selection_type: single, is_required: true)
    ├── Option: "Papas fritas" (price_modifier: 0)
    ├── Option: "Ensalada" (price_modifier: 0)
    └── Option: "Papas + Ensalada" (price_modifier: 500)

EJEMPLO 2: Empanadas
├── Product: "Empanadas" (price: 0, has_variants: true)
├── ProductVariant: "Unidad (min 3)" (price: 450, selection_count: 3)
├── ProductVariant: "Media docena" (price: 2400, selection_count: 6)
├── ProductVariant: "Docena" (price: 4500, selection_count: 12)
└── CustomizationGroup: "Sabores" (selection_type: quantity, is_required: true)
    ├── Option: "Carne" (price_modifier: 0)
    ├── Option: "Jamon y Queso" (price_modifier: 0)
    ├── Option: "Pollo" (price_modifier: 0)
    └── Option: "Humita" (price_modifier: 0)

EJEMPLO 3: Ensalada (arma tu propia - chica)
├── Product: "Ensalada Chica" (price: 2000, has_variants: false)
└── CustomizationGroup: "Ingredientes" (selection_type: multiple, max: 4, is_required: true)
    ├── Option: "Lechuga" (price_modifier: 0)
    ├── Option: "Tomate" (price_modifier: 0)
    ├── Option: "Rucula" (price_modifier: 0)
    ├── Option: "Pollo" (price_modifier: 300)
    └── ...

EJEMPLO 4: Ensalada Grande
├── Product: "Ensalada Grande" (price: 2800, has_variants: false)
└── CustomizationGroup: "Ingredientes" (selection_type: multiple, max: 6, is_required: true)
    └── (mismas opciones que la chica)

EJEMPLO 5: Plato simple sin customizacion
└── Product: "Milanesa napolitana" (price: 4200, has_variants: false)
    (sin customization_groups)
```

### 11. Codigos de Descuento

```sql
CREATE TABLE discount_codes (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,
    discount_percent DECIMAL(5, 2) NOT NULL CHECK (discount_percent BETWEEN 0 AND 50),
    free_shipping   BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    valid_from      TIMESTAMPTZ,
    valid_until     TIMESTAMPTZ,
    max_uses        INT,                    -- NULL = ilimitado
    current_uses    INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_discount_codes_code ON discount_codes(code);
```

### 12. Alertas

```sql
CREATE TABLE alerts (
    id              SERIAL PRIMARY KEY,
    message         TEXT NOT NULL,
    valid_from      TIMESTAMPTZ NOT NULL,
    valid_until     TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 13. Pedidos

```sql
CREATE TABLE orders (
    id              SERIAL PRIMARY KEY,
    order_code      VARCHAR(30) UNIQUE NOT NULL, -- codigo visible: "2026-0304-143045"
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'preparing', 'on_the_way', 'delivered', 'cancelled')),
    -- Montos (calculados en backend)
    subtotal        DECIMAL(10, 2) NOT NULL,
    shipping_cost   DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    total           DECIMAL(10, 2) NOT NULL,
    -- Pago
    discount_code_id INT REFERENCES discount_codes(id) ON DELETE SET NULL,
    payment_method  VARCHAR(20) NOT NULL
                    CHECK (payment_method IN ('cash', 'transfer')),
    cash_amount     DECIMAL(10, 2),         -- monto con el que paga (si es efectivo)
    -- Datos de entrega (snapshot, no FK)
    delivery_name   VARCHAR(100) NOT NULL,
    delivery_phone  VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    delivery_between_streets VARCHAR(255),
    delivery_apartment VARCHAR(100),
    delivery_notes  TEXT,
    -- WhatsApp
    whatsapp_message TEXT,
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at    TIMESTAMPTZ,            -- cuando pasa a "preparing"
    shipped_at      TIMESTAMPTZ,            -- cuando pasa a "on_the_way"
    delivered_at    TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_code ON orders(order_code);
```

### 14. Items del Pedido

```sql
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INT REFERENCES products(id) ON DELETE SET NULL,
    variant_id      INT REFERENCES product_variants(id) ON DELETE SET NULL,
    -- Snapshots (para que el pedido no cambie si se edita el producto)
    product_name    VARCHAR(150) NOT NULL,
    variant_name    VARCHAR(100),
    quantity        INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price      DECIMAL(10, 2) NOT NULL,
    subtotal        DECIMAL(10, 2) NOT NULL,
    observations    TEXT,
    sort_order      INT DEFAULT 0
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### 15. Customizaciones del Item de Pedido

```sql
-- Snapshot de las selecciones hechas por el usuario
CREATE TABLE order_item_customizations (
    id              SERIAL PRIMARY KEY,
    order_item_id   INT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    group_name      VARCHAR(100) NOT NULL,  -- snapshot del nombre del grupo
    option_name     VARCHAR(100) NOT NULL,  -- snapshot del nombre de la opcion
    option_quantity INT DEFAULT 1,          -- para selection_type=quantity
    price_modifier  DECIMAL(10, 2) DEFAULT 0
);

CREATE INDEX idx_order_item_cust_item ON order_item_customizations(order_item_id);
```

### 16. Historial de Estados del Pedido

```sql
CREATE TABLE order_status_history (
    id              SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL,
    changed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
```

## Maquina de Estados - Pedidos

```
                    ┌──────────────┐
                    │   PENDING    │ (cliente confirma pedido)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │                         │
              v                         v
     ┌────────────────┐        ┌──────────────┐
     │   PREPARING    │        │  CANCELLED   │
     └───────┬────────┘        └──────────────┘
             │                        ^
             v                        │
     ┌────────────────┐               │
     │  ON_THE_WAY    │───────────────┘
     └───────┬────────┘  (puede cancelarse antes de entregar)
             │
             v
     ┌────────────────┐
     │   DELIVERED    │
     └────────────────┘
```

**Transiciones validas:**
- `pending` → `preparing` | `cancelled`
- `preparing` → `on_the_way` | `cancelled`
- `on_the_way` → `delivered` | `cancelled`
- `delivered` → (estado final)
- `cancelled` → (estado final)

## Capacidad de Cocina

- `business_config.max_concurrent_orders` define el limite.
- Se cuentan pedidos con status IN ('pending', 'preparing').
- Si se alcanza el limite, el frontend muestra "Estamos al maximo, intenta en unos minutos".
- `0` = sin limite.

## Migracion de Datos Legacy

| Firestore Collection | Tabla PostgreSQL |
|---------------------|-----------------|
| foods | products + product_variants + customization_groups + customization_options |
| categories | categories |
| empanadas | customization_options (dentro de grupo "Sabores") |
| sidedishes | customization_options (dentro de grupo "Guarnicion") |
| ingredients | customization_options (dentro de grupo "Ingredientes") |
| schedules | schedules |
| costs | business_config.shipping_cost |
| alerts | alerts |
| codes | discount_codes |
| orders | orders + order_items + order_item_customizations |
| idorders | orders.id (SERIAL autoincrement) |
| userslog | (eliminado, se puede agregar logging con middleware) |

## Notas de Performance

- Paginado en todos los listados (page_size default: 20)
- Indices en columnas de filtrado/ordenamiento
- Lazy loading de imagenes en frontend
- Skeleton loaders en vez de spinners
- Cache de business_config y schedules (cambian poco)
- Imagenes optimizadas al subir (max 2MB, validacion de tipo)
