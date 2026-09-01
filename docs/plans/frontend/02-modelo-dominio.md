# Modelo de dominio

## Enums (serializados como `String`, `EnumType.STRING` — el valor JSON es el nombre exacto)

| Enum | Valores exactos |
|---|---|
| `RolNombre` | `ADMIN`, `ENFERMERIA`, `ALMACEN`, `CONSULTA` |
| `GrupoSanguineo` | `O_POS`, `O_NEG`, `A_POS`, `A_NEG`, `B_POS`, `B_NEG`, `AB_POS`, `AB_NEG` |
| `Sexo` | `M`, `F`, `OTRO` |
| `TipoAlergia` | `MEDICAMENTO`, `ALIMENTO`, `AMBIENTAL`, `OTRO` |
| `Severidad` | `LEVE`, `MODERADA`, `GRAVE` |
| `TipoInsumo` | `MEDICAMENTO`, `INSUMO` |
| `TipoMovimiento` | `ENTRADA`, `SALIDA`, `AJUSTE`, `MERMA` |
| `EstadoOrden` | `PENDIENTE`, `APROBADA`, `RECHAZADA`, `RECIBIDA` |
| `EstadoVisita` | `EN_ESPERA`, `EN_ATENCION`, `ATENDIDO`, `CANCELADO` |
| `EstadoCampania` | `SOLICITADA`, `ABIERTA`, `CERRADA`, `CANCELADA` |
| `AccionAuditoria` | `CREAR`, `ACTUALIZAR`, `ELIMINAR` |

Usa estos valores literales para tipos TS (`type GrupoSanguineo = "O_POS" | "O_NEG" | ...`) y para los `<select>`/enums de formularios. Al **enviar** estos valores en un request DTO, van como `string` (el backend hace `Enum.valueOf(...)` — es sensible a mayúsculas y no tolera valores fuera de la lista: da 400 o 500 si no matchea exactamente).

## Campos comunes de auditoría

Toda entidad extiende `Auditable`: `id` (Long), `createdAt` (Instant), `updatedAt` (Instant), y una columna oculta `activo` (soft delete, nunca expuesta ni filtrable vía API — los inactivos simplemente no aparecen). Algunos Response DTOs incluyen `id`; no todos exponen `createdAt`/`updatedAt` (depende del DTO — revisar cada uno en su archivo de endpoints).

## Entidades principales (vista conceptual para modelar tipos TS)

- **Usuario** — staff. `username`, `passwordHash` (nunca se expone), `nombreCompleto`, `email`, `roles: Rol[]`.
- **Estudiante** — dato puro, sin cuenta. `matricula` (única), `cedula` (única), `nombre`, `apellido`, `fechaNacimiento`, `sexo`, `grupoSanguineo`, `email`, `telefono`, `carrera: Carrera`, `seguroMedico?: SeguroMedico`.
- **Carrera**, **SeguroMedico**, **Enfermedad**, **CondicionFisica**, **Alergia** — catálogos base (algunos sin CRUD expuesto, ver [10-known-issues.md](./10-known-issues.md)).
- Asociaciones estudiante↔catálogo: **EnfermedadEstudiante**, **CondicionFisicaEstudiante**, **AlergiaEstudiante** (con `severidad`), **MedicamentoHabitual**, **MedicoReferencia**, **ContactoEstudiante** (con `parentesco`, `esPrincipal`).
- **Insumo** (base, herencia JOINED) → **Medicamento** extiende Insumo (`controlado`, `concentracion`, `viaAdministracion`, `tiposMedicamento: TipoMedicamento[]`).
- **LoteInventario** — `insumo`, `numeroLote`, `fechaVencimiento`, `cantidadDisponible`. El stock de un insumo es la **suma de `cantidadDisponible` de sus lotes activos**, no un campo directo.
- **MovimientoInventario** — historial de `ENTRADA/SALIDA/AJUSTE/MERMA` sobre un lote.
- **OrdenRequisicion** → `detalles: DetalleOrdenRequisicion[]` (insumo + cantidad pedida/recibida). Máquina de estados `EstadoOrden`.
- **VisitaDispensario** — visita walk-in de un estudiante. Máquina de estados `EstadoVisita`. Tiene sub-recursos: **AdministracionMedicamento** (con validación de alergia), **ReaccionAdversa**, **ExtraccionHospitalaria**.
- **CampaniaDonacion** — campaña de donación dirigida a un estudiante objetivo; al aprobarse dispara **NotificacionCampania** por email a donantes compatibles.
- **CarneEmergencia** — token público (UUID) asociado 1-1 a un estudiante, usado para la ficha de emergencia pública y el QR.
- **RegistroAuditoria** — log append-only de cambios en entidades sensibles.

Para el detalle exacto de campos de cada Request/Response DTO, ver el archivo de endpoints del módulo correspondiente — no repetimos aquí las columnas SQL, solo la forma que ve el frontend.
