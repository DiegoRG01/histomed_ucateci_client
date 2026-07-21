# 04 - Estudiantes y ficha médica

## Contexto y objetivo

Módulo más grande del sistema: `Estudiante` (core) y su ficha médica completa como sub-recursos anidados:
`ContactoEstudiante`, `MedicoReferencia`, `EnfermedadEstudiante`, `CondicionFisicaEstudiante`,
`AlergiaEstudiante`, `MedicamentoHabitual`. Incluye también el servicio de **aptitud para donar** y la **ficha de
emergencia consolidada** (ambos de solo lectura, no CRUD).

**Prerrequisito:** `00-fundamentos-crud.md`. Depende de `03-inventario.md` (M3 se construye antes que M2 en el
backend porque `Alergia.medicamento` y `MedicamentoHabitual.medicamento` son FK reales a `Medicamento`) y de
`01-catalogos-base.md` (`Carrera`, `SeguroMedico` si tienen endpoint propio).

Referencia backend: `docs/02-modelo-dominio.md` (bloque Estudiantes y ficha médica) y
`docs/planes/plan-02-estudiantes-ficha-medica.md` del repo `histomed_ucateci`.

**Nota de tamaño:** si al implementar este módulo la cantidad de pantallas (Estudiante + 6 sub-recursos) resulta
inmanejable en un solo esfuerzo, dividir en `04a-estudiantes-core.md` (Estudiante + aptitud + ficha de emergencia)
y `04b-estudiantes-ficha-clinica.md` (los 6 sub-recursos). Esta decisión se toma al implementar, no de antemano.

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

Los sub-recursos (`ContactoEstudiante`, `MedicoReferencia`, `EnfermedadEstudiante`, `CondicionFisicaEstudiante`,
`AlergiaEstudiante`, `MedicamentoHabitual`) tienen repositorios confirmados en el repo pero **sus controllers no se
exploraron en esta sesión** — confirmar paths reales (se asume anidados bajo `/estudiantes/{id}/...`) y roles antes
de implementar.

## Endpoints consumidos

Ver tabla de `Estudiante` arriba (confirmada). Para sub-recursos, patrón esperado (a confirmar):

| Sub-recurso | Método | Path esperado |
|---|---|---|
| ContactoEstudiante | GET/POST/PUT/DELETE | `/api/v1/estudiantes/{estudianteId}/contactos` |
| MedicoReferencia | GET/POST/PUT/DELETE | `/api/v1/estudiantes/{estudianteId}/medicos-referencia` |
| EnfermedadEstudiante | GET/POST/PUT/DELETE | `/api/v1/estudiantes/{estudianteId}/enfermedades` |
| CondicionFisicaEstudiante | GET/POST/PUT/DELETE | `/api/v1/estudiantes/{estudianteId}/condiciones-fisicas` |
| AlergiaEstudiante | GET/POST/PUT/DELETE | `/api/v1/estudiantes/{estudianteId}/alergias` |
| MedicamentoHabitual | GET/POST/PUT/DELETE | `/api/v1/estudiantes/{estudianteId}/medicamentos-habituales` |

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

export type AptitudDonacionResponse = { apto: boolean; motivos: string[] } // confirmar shape real
export type FichaEmergenciaResponse = { /* confirmar shape real al implementar */ }
```

Tipos de sub-recursos (`ContactoEstudiante`, etc.) se definen igual, en `src/features/estudiantes/types.ts` o
archivos separados si crecen mucho — decidir al implementar según volumen.

## Rutas frontend nuevas

- `/estudiantes` (lista paginada + búsqueda por `filtro`) — `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}`
- `/estudiantes/nuevo` — `RoleGuard allow={['ADMIN','ENFERMERIA']}`
- `/estudiantes/:id` (detalle: datos core + tabs de sub-recursos + aptitud donación + ficha emergencia) —
  `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}`
- `/estudiantes/:id/editar` — `RoleGuard allow={['ADMIN','ENFERMERIA']}`

Los sub-recursos no tienen ruta propia — se gestionan como tabs/secciones dentro de `/estudiantes/:id` (edición
inline vía `FormDialog`, no navegación a otra página).

## Componentes a crear

`src/features/estudiantes/components/`:
- `EstudianteListPage.tsx` — `PageHeader` + búsqueda (`filtro`) + `DataTable` paginado + `Pagination`.
- `EstudianteForm.tsx` — selector de `Carrera`/`SeguroMedico` (de `01-catalogos-base.md` si tienen endpoint, si no,
  input libre temporal), selects para `Sexo`/`GrupoSanguineo` (enums estáticos).
- `EstudianteDetailPage.tsx` — datos core (solo lectura + botón editar) + tabs: Contactos, Médico de referencia,
  Enfermedades, Condiciones físicas, Alergias, Medicamentos habituales, Aptitud para donar (read-only), Ficha de
  emergencia (read-only).
- Un componente por sub-recurso dentro de `components/ficha/`: `ContactosTab.tsx`, `MedicosReferenciaTab.tsx`,
  `EnfermedadesTab.tsx`, `CondicionesFisicasTab.tsx`, `AlergiasTab.tsx`, `MedicamentosHabitualesTab.tsx` — cada uno
  con su propia mini-tabla + `FormDialog` de alta/edición, reusando `DataTable`/`ConfirmDeleteDialog`.
- `AptitudDonacionCard.tsx`, `FichaEmergenciaCard.tsx` — solo lectura, sin acciones.

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
- `AlergiaEstudiante.impideDonacionOverride` y equivalentes en `EnfermedadEstudiante`/`CondicionFisicaEstudiante`:
  mostrar en el form como override opcional del default del catálogo (`impideDonacionSangre`), con texto explicando
  que es una excepción caso-por-caso, no el valor por defecto.
- `AptitudDonacionCard`: mostrar de forma prominente si el estudiante NO es apto (regla de negocio agregada del
  backend), no requiere lógica adicional en frontend.
- Alergia con `tipoAlergia = MEDICAMENTO` requiere seleccionar un `Medicamento` (de `03-inventario.md`); otros tipos
  de alergia no.

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. `03-inventario.md` (FK real a `Medicamento` en `Alergia`/`MedicamentoHabitual`).
3. `01-catalogos-base.md` si `Carrera`/`SeguroMedico` tienen endpoint propio confirmado.
4. Orden interno: `Estudiante` CRUD core → tabs de sub-recursos (cualquier orden entre ellos) → cards de solo
   lectura (aptitud, ficha emergencia) al final (son las más simples, dependen de que el estudiante ya exista).

## Pendientes / preguntas abiertas

- Confirmar paths reales de los 6 controllers de sub-recursos (no explorados en detalle esta sesión, solo se
  confirmó que existen los repositorios).
- Confirmar shape real de `AptitudDonacionResponse` y `FichaEmergenciaResponse`.
- Decidir si este doc se divide en `04a`/`04b` una vez visto el tamaño real al implementar.
