# Manual de Usuario - Panel de Administración

## Cómo ingresar

1. Abrí la web de tu negocio
2. Hacé clic en **"Ingresar"**
3. Escribí tu email y hacé clic en **"Enviar enlace de acceso"**
4. Revisá tu casilla de email (también la carpeta de spam)
5. Hacé clic en el botón **"Ingresar"** del email que recibiste
6. ¡Listo! Ya estás dentro

> No se usa contraseña. Cada vez que quieras entrar, se envía un enlace nuevo a tu email. El enlace dura 15 minutos.

---

## Navegación

Una vez logueado, vas a ver los siguientes botones:

- **Inicio** — La página principal que ven tus clientes
- **Carrito** — El carrito de compras
- **Pedidos** — Historial de pedidos (los tuyos como usuario)
- **Perfil** — Tus datos personales
- **Admin** — Panel de administración (solo visible para administradores)

---

## Panel de Administración

Hacé clic en **"Admin"** para acceder al panel. Desde ahí podés gestionar todo tu negocio.

### Dashboard

Es la pantalla principal del admin. Muestra un resumen del día:
- Pedidos pendientes, en preparación, en camino
- Pedidos entregados y cancelados hoy
- Ingresos del día
- Capacidad de cocina (cuántos pedidos activos tenés vs el límite)

---

### Categorías

Acá organizás tu menú. Cada categoría agrupa productos (ej: "Hamburguesas", "Bebidas", "Postres").

**Crear una categoría:**
1. Hacé clic en **"Nueva categoría"**
2. Escribí el nombre (ej: "Pizzas")
3. Opcionalmente agregá una descripción
4. Subí una imagen representativa (hacé clic en la zona de upload)
5. Dejá marcado "Activa" si querés que se vea en la web
6. Hacé clic en **"Crear"**

**Editar:** Hacé clic en el lápiz de la categoría que querés modificar.

**Eliminar:** Hacé clic en el tacho. Solo podés eliminar categorías que no tengan productos.

**Activar/Desactivar:** Usá el checkbox. Si desactivás una categoría, no se muestra en la web pero no se borra.

---

### Productos

Acá creás y editás los productos de tu menú.

**Crear un producto:**
1. Hacé clic en **"Nuevo Producto"**
2. Completá: nombre, precio, descripción, categoría
3. Subí una imagen del producto
4. Marcá si está **activo** y **disponible**

**Promoción:** Marcá "Promoción" y poné el porcentaje de descuento. El precio con descuento se calcula automáticamente y se muestra tachado el precio original.

**Disponibilidad:** Si un producto se agotó temporalmente, desmarcá "Disponible". Va a aparecer como "Agotado" en la web pero no se elimina.

**Variantes (ej: Empanadas):**
Si un producto tiene diferentes presentaciones (unidad, media docena, docena), marcá "Tiene variantes" y agregá cada variante con su nombre, precio y cantidad de selección.

Ejemplo para empanadas:
- Unidad → Precio: $450, Selección: 3 (mínimo 3)
- Media docena → Precio: $2400, Selección: 6
- Docena → Precio: $4500, Selección: 12

**Personalización (ej: guarniciones, ingredientes):**
Podés agregar grupos de personalización a cualquier producto:

- **Selección única** (ej: "Guarnición" → Papas / Ensalada / Arroz)
- **Selección múltiple** (ej: "Ingredientes de ensalada" → elegir 4 de 10)
- **Cantidad** (ej: "Sabores de empanada" → elegir cuántas de cada sabor)

Para cada opción podés poner un precio adicional (ej: "Extra queso +$200").

---

### Pedidos

Acá gestionás los pedidos de tus clientes. Cada pedido pasa por estos estados:

```
Pendiente → En preparación → En camino → Entregado
                ↓                 ↓
            Cancelado         Cancelado
```

**Cambiar estado:** En cada pedido vas a ver botones según el estado actual:
- **Pendiente:** "Preparar" o "Cancelar"
- **En preparación:** "Enviar" o "Cancelar"
- **En camino:** "Entregado" o "Cancelar"

**Ver detalle:** Hacé clic en la flecha para expandir y ver los productos, cantidades, dirección de entrega e historial de estados.

**Filtrar:** Usá el selector de estado para ver solo los pedidos pendientes, entregados, etc.

---

### Horarios

Configurá los días y horarios de atención.

- Cada día tiene un interruptor **Abierto/Cerrado**
- Si está abierto, configurá la hora de apertura y cierre
- Cuando el negocio está cerrado, los clientes no pueden hacer pedidos

Hacé clic en **"Guardar horarios"** después de hacer cambios.

---

### Configuración

Datos generales del negocio que se muestran en la web:

- **Nombre del negocio** — Se muestra en el header y el hero de la página
- **Teléfono y WhatsApp** — El número de WhatsApp es al que llegan los pedidos
- **Dirección** — Se muestra en la página principal
- **Logo** — Subí el logo de tu negocio (se muestra en el header y admin)
- **Favicon** — El ícono que se ve en la pestaña del navegador
- **Instagram** — Link a tu cuenta de Instagram
- **Costo de envío** — El monto que se suma a cada pedido
- **Pedidos concurrentes máx.** — Límite de pedidos activos al mismo tiempo. Poné 0 para sin límite. Si se alcanza el límite, los clientes ven un mensaje "Estamos al máximo de capacidad"
- **Email remitente** — El email desde el cual se envían los enlaces de acceso (debe estar verificado en Brevo)
- **Nombre remitente** — El nombre que aparece como remitente del email

---

### Códigos de Descuento

Creá códigos promocionales para tus clientes.

- **Código** — Lo que el cliente escribe (ej: "PROMO20")
- **Descuento %** — Porcentaje de descuento (máximo 50%)
- **Envío gratis** — Si marcás esto, el descuento incluye envío gratis
- **Activo** — Activá/desactivá el código sin eliminarlo
- **Usos máximos** — Cuántas veces se puede usar (dejá vacío para ilimitado)

El cliente ingresa el código en el checkout antes de confirmar el pedido.

---

### Alertas

Mensajes que se muestran a todos los clientes cuando entran a la web (ej: "Hoy 2x1 en pizzas").

- **Mensaje** — El texto que se muestra
- **Desde / Hasta** — Período en el que se muestra la alerta
- **Activa** — Activá/desactivá sin eliminar

---

## Cómo funciona un pedido (lo que ve el cliente)

1. El cliente entra a la web y ve el menú
2. Elige productos, los personaliza y los agrega al carrito
3. Va al carrito, revisa el total y hace clic en "Confirmar pedido"
4. Si no está logueado, se le pide que ingrese su email
5. Completa sus datos de entrega (nombre, dirección, teléfono)
6. Elige método de pago (efectivo o transferencia)
7. Opcionalmente ingresa un código de descuento
8. Confirma el pedido
9. Se le muestra el número de pedido y un botón para enviar el resumen por WhatsApp
10. El pedido llega al panel de admin como "Pendiente"
11. Vos lo gestionás cambiando los estados

---

## Consejos

- **Imágenes:** Subí fotos de buena calidad pero que no pesen más de 2MB. Los formatos aceptados son JPG, PNG y WebP.
- **Precios:** Siempre ponelos sin descuento. El descuento se aplica automáticamente si marcás "Promoción".
- **Horarios:** Si cerrás un día feriado, simplemente desactivá ese día y volvé a activarlo después.
- **WhatsApp:** Asegurate de que el número de WhatsApp esté correcto en Configuración, porque ahí llegan los pedidos.
- **Capacidad de cocina:** Si recibís muchos pedidos juntos, configurá un límite para no saturarte.
