# Rules - Lo de Luna

## Arquitectura
- Backend: .NET 8, 3 proyectos (API, Core, Infra). No crear más proyectos.
- Frontend: Angular 19 con standalone components. No usar módulos NgModule.
- Base de datos: PostgreSQL vía EF Core. Migraciones en LosDeLuna.Infra.
- Toda entidad nueva va en Core/Entities, todo servicio en Infra/Services.

## Código Backend
- Controllers en LosDeLuna.API/Controllers (público) o Controllers/Admin (admin con policy "AdminOnly").
- DTOs en LosDeLuna.API/DTOs/{Feature}/. Nunca exponer entidades directamente.
- Precios SIEMPRE se calculan en backend. Nunca confiar en valores del frontend.
- Fechas en UTC internamente. Conversión a Argentina solo para display/validación de horarios.
- TimeZoneInfo.FindSystemTimeZoneById("Argentina Standard Time") para zona horaria.
- Usar BusinessException para errores de negocio (se mapean a 400 automáticamente).

## Código Frontend
- Standalone components con lazy loading en app.routes.ts.
- Signals para estado reactivo (no BehaviorSubject en componentes nuevos).
- Servicios en core/services/, modelos en core/models/, guards en core/guards/.
- Todo componente que use routerLink DEBE importar RouterLink explícitamente.
- Inline templates solo para componentes admin simples. Archivos separados para páginas de cliente.
- FormsModule para formularios admin, ReactiveFormsModule si se necesita validación compleja.

## UI/UX
- Mobile-first. Diseñar para 360px primero, luego escalar a desktop.
- Breakpoint principal: 768px (mobile vs desktop).
- Toda tabla admin debe estar envuelta en div.table-wrapper con overflow-x: auto.
- Columna ACCIONES siempre primera a la izquierda en tablas.
- Botones de acción (Crear/Actualizar/Cancelar) siempre alineados a la derecha (justify-content: flex-end).
- Eliminaciones con ConfirmDialogComponent, NUNCA window.confirm.
- Formularios admin con patrón toggle: botón "Nuevo X" muestra/oculta el formulario.
- Skeleton loaders para carga, no spinners (excepto en acciones puntuales).
- Padding lateral mínimo 16px en mobile para todas las páginas.
- Imágenes: upload via zona click, preview con cambiar/eliminar, max 2MB, JPG/PNG/WebP.

## Seguridad
- .env para datos sensibles. Nunca hardcodear secrets.
- JWT en localStorage (access token), refresh token con rotación.
- Rate limiting en endpoints de auth (5/min) y general (60/min).
- Validar tamaño y tipo de archivos en upload (backend + frontend).
- CORS estricto: solo FRONTEND_URL permitido.

## Base de Datos
- Nombres de tabla en snake_case (configurado en AppDbContext).
- Seed data con fechas estáticas (new DateTime(2026, 1, 1, ..., DateTimeKind.Utc)), nunca DateTime.UtcNow.
- Índices en columnas de filtrado frecuente.
- Soft delete via IsActive cuando aplique (nunca DELETE de productos con pedidos).

## Imágenes
- Storage local: ./storage/, servido en /uploads/.
- Al cambiar imagen, eliminar la anterior del servidor (DELETE /api/admin/upload?url=).
- URLs relativas (/uploads/archivo.jpg), independientes del dominio.
- Railway: mismo path montado como Volume persistente.

## Testing Local
- Backend: puerto 5050 (http://localhost:5050).
- Frontend: puerto 4200 con proxy a 5050 (proxy.conf.json).
- PostgreSQL: puerto 5433, user: postgres, pass: QuoteFlow2026, db: lodeluna.
- Magic links en dev: no se envían emails, consultar token en BD.
