# 04 - Estudiantes y ficha médica

## Contexto y objetivo

Módulo más grande del sistema: `Estudiante` (core) y su ficha médica completa como sub-recursos anidados:
`ContactoEstudiante`, `MedicoReferencia`, `EnfermedadEstudiante`, `CondicionFisicaEstudiante`,
`AlergiaEstudiante`, `MedicamentoHabitual`. Incluye también el servicio de **aptitud para donar** y la **ficha de
emergencia consolidada** (ambos de solo lectura, no CRUD).

**Prerrequisito:** `00-fundamentos-crud.md`. Depende de `03-inventario.md` (M3 se construye antes que M2 en el
backend porque `Alergia.medicamento` y `MedicamentoHabitual.medicamento` son FK reales a `Medicamento`) y de
`01-catalogos-base.md` (`Carrera` con endpoint propio; `SeguroMedico` semillado).

Referencia backend: `docs/02-modelo-dominio.md` (bloque Estudiantes y ficha médica) y
`docs/planes/plan-02-estudiantes-ficha-medica.md` del repo `histomed_ucateci`.

## Estado backend

`EstudianteController` confirmado en el repo (explorado en detalle esta sesión, ver
`histomed-core-src/EstudianteController.java`):

| Método | Path | Roles | Notas |
|---|---|---|---|
| POST | `/api/v1/estudiantes` | ENFERMERIA, ADMIN | Crear |
| PUT | `/api/v1/estudiantes/{id}` | ENFERMERIA, ADMIN | Actualizar |
| GET | `/api/v1/estudiantes/{id}` | ENFERMERIA, ADMIN, CONSULTA | Obtener uno |
| GET | `/api/v1/estudiantes?filtro=&page=&size=` | ENFERMERIA, ADMIN, CONSULTA | Búsqueda paginada (`Page<EstudianteResponse>`) |
| DELETE | `/api/v1/estudiantes/{id}` | ADMIN | Desactivar (204) |
| GET | `/api/v1/estudiantes/{id}/aptitud-donacion` | ENFERMERIA, ADMIN, CONSULTA | Solo lectura — `AptitudDonacionResponse` |
| GET | `/api/v1/estudiantes/{id}/ficha` | ENFERMERIA, ADMIN, CONSULTA | Solo lectura — `FichaEmergenciaResponse` |

Los 6 sub-recursos (`ContactoEstudiante`, `MedicoReferencia`, `EnfermedadEstudiante`, `CondicionFisicaEstudiante`,
`AlergiaEstudiante`, `MedicamentoHabitual`) tienen controllers REST confirmados con DTOs JSON tipados, anidados bajo
`/api/v1/estudiantes/{id}/...` (contratos completos en
[03-endpoints-estudiantes.md](../plans/frontend/03-endpoints-estudiantes.md)). Enfermedades y Medicamentos
habituales figuran *en construcción* en el backend.

## Endpoints consumidos

Ver tabla de `Estudiante` arriba (confirmada). Sub-recursos anidados bajo `/api/v1/estudiantes/{id}/...`
(salvo el catálogo plano `/contactos`), todos con request/response JSON tipados:

| Recurso | Path | Verbos | Request | Response |
|---|---|---|---|---|
| Alergia | `/estudiantes/{id}/alergias` | POST / GET / GET`{id}` / PUT / DELETE | `{nombre, tipoAlergia, medicamentoId?}` | `{id, nombre, tipoAlergia, medicamentoId\|null}` |
| Condición física | `/estudiantes/{id}/condiciones` | POST / GET / GET`{id}` / PUT / DELETE | `{nombre, descripcion?, impideDonacionSangre}` | `{id, nombre, descripcion\|null, impideDonacionSangre}` |
| Enfermedad | `/estudiantes/{id}/enfermedades` | POST / GET / GET`{id}` / PUT / DELETE *(en construcción)* | `{nombre, esCronica, impideDonacionSangre}` | `{id, nombre, esCronica, impideDonacionSangre}` |
| Medicamento habitual | `/estudiantes/{id}/medicamentos` | POST / GET / GET`{id}` / PUT / DELETE *(en construcción)* | `{medicamentoId, dosis?, frecuencia?}` | `{id, estudianteId, medicamentoId, medicamentoNombre, dosis\|null, frecuencia\|null}` |
| Contacto (catálogo) | `/contactos` | POST / GET / GET`{id}` | `{nombre, telefono, email?}` | `{id, nombre, telefono, email\|null}` |
| ContactoEstudiante | `/estudiantes/{id}/contactos` | POST / GET / GET`{id}` / PUT / DELETE | POST: `{contactoId, parentesco?, esPrincipal?}` · PUT: `{parentesco?, esPrincipal}` | `{id, estudianteId, contactoId, contactoNombre, contactoTelefono, contactoEmail\|null, parentesco\|null, esPrincipal}` |
| Médico de referencia (singleton) | `/estudiantes/{id}/medico-referencia` | POST (upsert) / GET (404 si no hay) | `{nombre, especialidad?, telefono?, hospitalClinica?}` | `{id, nombre, especialidad\|null, telefono\|null, hospitalClinica\|null, estudianteId}` |

Notas:
- `TipoAlergia = 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'OTRO'`; `medicamentoId` solo aplica cuando el tipo es `MEDICAMENTO`.
- Un solo contacto principal por estudiante: el backend desmarca automáticamente el anterior.
- `MedicoReferencia` es singleton por estudiante (POST hace upsert; GET responde 404 si no existe).

## Modelo de datos frontend (types.ts)

`src/features/estudiantes/types.ts` (confirmado contra `EstudianteRequest`/`EstudianteResponse` reales, explorados
esta sesión):

```ts
export type Sexo = 'M' | 'F' | 'OTRO'
export type GrupoSanguineo = 'O_POS' | 'O_NEG' | 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG'

export type Estudiante = {
  id: number; matricula: string; cedula: string; nombre: string; apellido: string
  fechaNacimiento: string; sexo: Sexo; grupoSanguineo: GrupoSanguineo
  email: string; telefono: string | null
  carreraId: number; carreraNombre: string
  seguroMedicoId: number | null; seguroMedicoNombre: string | null
}

export type CreateEstudianteRequest = {
  matricula: string; cedula: string; nombre: string; apellido: string
  fechaNacimiento: string; sexo: Sexo; grupoSanguineo: GrupoSanguineo
  email: string; telefono?: string; carreraId: number; seguroMedicoId?: number
}

export type AptitudDonacionResponse = { apto: boolean; motivos: string[] } // confirmado
// FichaEmergenciaResponse: shape completo confirmado — ver src/features/estudiantes/types.ts
// y el JSON de ejemplo en 03-endpoints-estudiantes.md
```

Los tipos request/response de los sub-recursos están definidos en `src/features/estudiantes/types.ts`.

## Rutas frontend

- `/estudiantes` (lista paginada + búsqueda por `filtro`) — `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}`
- `/estudiantes/nuevo` — página completa `EstudianteFormPage` — `RoleGuard allow={['ADMIN','ENFERMERIA']}`
- `/estudiantes/:id` — ficha de solo lectura (`EstudianteFichaPage`: datos core, historial clínico,
  contacto/referencia y aptitud de donación a partir de `GET /{id}/ficha`) —
  `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}`
- `/estudiantes/:id/editar` — página completa `EstudianteFormPage` con Tabs ("Datos personales" /
  "Referencias" / "Historial clínico") — `RoleGuard allow={['ADMIN','ENFERMERIA']}`

Al crear, las tabs de sub-recursos permanecen bloqueadas (con tooltip) hasta guardar "Datos personales";
el `POST /estudiantes` redirige con `replace` a `/estudiantes/:id/editar`.

## Componentes

`src/features/estudiantes/components/`:
- `EstudianteListPage.tsx` — `PageHeader` + búsqueda (`filtro`) + `DataTable` paginado + `Pagination`.
- `EstudianteFormPage.tsx` — orquesta las rutas nuevo/editar: Tabs "Datos personales" / "Referencias" /
  "Historial clínico", con bloqueo de sub-recursos hasta guardar datos core.
- `DatosPersonalesTab.tsx` — reutiliza `EstudianteForm.tsx` (selector de `Carrera`/`SeguroMedico`,
  selects `Sexo`/`GrupoSanguineo`).
- `ReferenciasTab.tsx` — compone `MedicoReferenciaSection` + `ContactosSection`.
- `HistorialClinicoTab.tsx` — compone `AlergiasSection`, `CondicionesSection`, `EnfermedadesSection`,
  `MedicamentosHabitualesSection`.
- Un `*Form.tsx` + `*Section.tsx` por sub-recurso (mini-tabla + diálogo de alta/edición, reusando
  `DataTable`/`ConfirmDeleteDialog`); `ContactoForm` soporta modo crear/editar (flujo "crear y vincular":
  `POST /contactos` + `POST /estudiantes/{id}/contactos`).
- `EstudianteFichaPage.tsx` — ficha de solo lectura en `/estudiantes/:id` (botón Editar para
  ADMIN/ENFERMERIA, Desactivar solo ADMIN).

## Hooks a crear

- `createCrudHooks` completo para `estudiantes` (paginado, vía `createResourceApi`).
- `useAptitudDonacion(estudianteId)` y `useFichaEmergencia(estudianteId)` — `useQuery` simples, sin factory (son
  endpoints de solo lectura ad-hoc, no CRUD).
- Un `createCrudHooks` por sub-recurso, con `basePath` parametrizado por `estudianteId`:
  ```ts
  export function useAlergiasEstudiante(estudianteId: number) {
    const api = createResourceApi<AlergiaEstudiante, CreateAlergiaEstudianteRequest>(
      `/estudiantes/${estudianteId}/alergias`,
    )
    return createCrudHooks(`estudiantes/${estudianteId}/alergias`, api)
  }
  ```
  (patrón repetido para los 6 sub-recursos — es la primera prueba real de que `createCrudHooks` funciona bien con
  `basePath` dinámico; si no encaja, ajustar la factory en `00-fundamentos-crud.md`, no bifurcar aquí).

## Casos especiales / reglas de negocio UI

- Borrado de `Estudiante` = desactivar, rol `ADMIN` únicamente (distinto de crear/editar que permite `ENFERMERIA`).
- `impideDonacionSangre` es un campo directo del formulario en Condiciones físicas y Enfermedades (checkbox);
  alimenta el cálculo de aptitud de donación del backend.
- Un solo contacto principal por estudiante: al marcar uno como principal, el backend desmarca automáticamente
  el anterior (sin lógica extra en frontend).
- Aptitud de donación en la ficha (`EstudianteFichaPage`): mostrar de forma prominente si el estudiante NO es apto
  (regla de negocio agregada del backend), no requiere lógica adicional en frontend.
- Alergias: `tipoAlergia` ∈ {MEDICAMENTO, ALIMENTO, AMBIENTAL, OTRO}; `medicamentoId` (de `03-inventario.md`)
  solo aplica cuando el tipo es `MEDICAMENTO`.

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. `03-inventario.md` (FK real a `Medicamento` en `Alergia`/`MedicamentoHabitual`).
3. `01-catalogos-base.md` (`Carrera` tiene endpoint propio confirmado; `SeguroMedico` sigue semillado).
4. Orden interno: `Estudiante` CRUD core → tabs de sub-recursos (cualquier orden entre ellos) → cards de solo
   lectura (aptitud, ficha emergencia) al final (son las más simples, dependen de que el estudiante ya exista).
