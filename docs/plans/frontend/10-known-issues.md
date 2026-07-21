# Known issues / divergencias respecto al plan original

Esta lista compara lo que describían los planes de diseño (`docs/planes/*.md`) contra lo que **realmente** implementa el código en `src/main/java/...` a fecha 2026-07-19. El resto de esta guía documenta el comportamiento real (columna "Estado actual"); esta página explica **por qué** puede diferir de lo que alguien esperaría leyendo solo los planes, y qué implica para el frontend.

## 1. Catálogos clínicos sin CRUD expuesto

**Plan**: `Enfermedad`, `CondicionFisica`, `Alergia`, `SeguroMedico` tendrían endpoints `/api/v1/enfermedades`, `/condiciones-fisicas`, `/alergias`, `/seguros-medicos` (ADMIN escribe, cualquier autenticado lee).

**Estado actual**: no existe ningún controller para estos 4 catálogos. Solo se siembran vía `CatalogosDataLoader` (`CommandLineRunner`) al arrancar la app. El único catálogo con controller real es `Carrera` (`/api/v1/catalogos/carreras`).

**Impacto en frontend**: para poblar selects de "tipo de alergia a agregar", "condición física a agregar" o "seguro médico" en el formulario de estudiante, no hay endpoint que los liste. Los ids semillados en dev son fijos (ver `CatalogosDataLoader`: Enfermedades — Diabetes, Hipertensión, Asma, Hepatitis B; Condiciones — Marcapasos, Prótesis; Alergias — Penicilina, Polen, Mariscos; Seguros — IHSS, Privado, Ninguno), pero **no son fiables entre entornos** sin un endpoint de lectura. Hay que pedir que se agregue el controller antes de poder construir esos formularios correctamente, o hardcodear temporalmente contra Swagger/BD.

## 2. Sub-recursos de estudiante usan query params, no JSON body

**Plan**: `AlergiaEstudianteRequest`, `CondicionFisicaEstudianteRequest`, etc. como DTOs JSON.

**Estado actual**: `AlergiaEstudianteController`, `CondicionFisicaEstudianteController`, `ContactoEstudianteController`, `MedicamentoHabitualController`, `MedicoReferenciaController`, `ContactoController`, `CarreraController` reciben todos los datos como `@RequestParam` (query string), y responden `Map<String,Object>` o tipo sin especificar en vez de un DTO tipado. Ver [03-endpoints-estudiantes.md](./03-endpoints-estudiantes.md) para el detalle exacto de cada uno.

**Impacto en frontend**: no se puede usar un cliente HTTP genérico que siempre mande JSON body — hay que construir la query string para estos endpoints específicamente, y tratar la respuesta como forma no garantizada (probar contra el backend real antes de tipar en TS).

## 3. `nombreCompleto` siempre vacío en respuestas de auth

`AuthServiceImpl.login()` y `.me()` construyen `JwtAuthResponse` con `nombreCompleto` hardcodeado a `""`, sin leerlo de la entidad `Usuario`. Nunca refleja el valor real. Ver [01-autenticacion.md](./01-autenticacion.md).

## 4. `recibir` orden de requisición no actualiza inventario

**Plan**: `POST /ordenes-requisicion/{id}/recibir` recibiría un body con lote/cantidad por línea, crearía `LoteInventario` y registraría movimientos `ENTRADA`, soportando recepción parcial.

**Estado actual**: el endpoint no acepta body. Solo marca `cantidadRecibida = cantidadPedida` en cada detalle y cambia el estado a `RECIBIDA` — **no crea lotes ni movimientos de inventario**. El stock real de los insumos pedidos no cambia al recibir una orden.

**Impacto en frontend**: si el flujo de negocio requiere que el stock suba al recibir, el frontend debe orquestar pasos adicionales manualmente (crear lote + registrar movimiento `ENTRADA`) después de llamar a `/recibir`, o coordinar con el equipo de backend para implementar la lógica faltante. Ver [05-endpoints-requisiciones.md](./05-endpoints-requisiciones.md).

## 5. Restricciones de rol no aplicadas en `MovimientoInventarioController` y `CampaniaDonacionController`

**Plan**: matrices de rol por tipo de operación (ej. solo ALMACEN/ADMIN pueden ENTRADA/AJUSTE/MERMA; solo ADMIN aprueba/rechaza campañas de donación).

**Estado actual**: ninguno de los métodos de `MovimientoInventarioController` ni de `CampaniaDonacionController` tiene anotación `@PreAuthorize` — solo aplica la regla global `anyRequest().authenticated()`. Cualquier usuario autenticado (de cualquier rol) puede hoy registrar cualquier tipo de movimiento de inventario o aprobar/rechazar/cerrar/cancelar una campaña de donación.

**Impacto en frontend**: no confiar en que el backend bloqueará estas acciones por rol — si se quiere restringir la UI según el rol, debe hacerse **solo a nivel de frontend** (ocultar botones), sabiendo que hoy no hay enforcement real del lado servidor para estos dos controllers específicos. Vale la pena reportarlo al equipo de backend.

## 6. Duplicados no dan un 409 explícito y consistente

`GlobalExceptionHandler` no tiene un `@ExceptionHandler` para `DataIntegrityViolationException` (constraint `unique` violado — matrícula, cédula, username, código de carrera duplicados). Cae al handler genérico `Exception` → **500** con mensaje oculto `"Error interno del servidor"`, no un 409 informativo.

**Impacto en frontend**: no se puede distinguir "duplicado" de "error interno real" solo por el status code. Si se necesita UX específica para "esa matrícula ya existe", puede que haya que validar duplicados client-side (ej. buscar antes de crear) o pedir que se agregue el handler en backend.

## 7. Endpoints `DELETE` prácticamente inexistentes

Solo `DELETE /api/v1/estudiantes/{id}` existe. Ningún otro módulo (insumos, medicamentos, visitas, órdenes, campañas, usuarios, catálogos) tiene endpoint de eliminación/desactivación, pese a que todas las entidades soportan soft-delete a nivel de modelo (`@SoftDelete` en `Auditable`). No hay forma de "borrar" nada más vía API hoy.
