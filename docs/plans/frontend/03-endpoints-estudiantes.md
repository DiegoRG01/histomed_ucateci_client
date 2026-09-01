# Estudiantes y ficha médica (M2)

## `EstudianteController` — `/api/v1/estudiantes`

| Método | Path | Roles | Body/Params | Response |
|---|---|---|---|---|
| POST | `` | ENFERMERIA, ADMIN | JSON `EstudianteRequest` | 201 `EstudianteResponse` |
| PUT | `/{id}` | ENFERMERIA, ADMIN | JSON `EstudianteRequest` | 200 `EstudianteResponse` |
| GET | `/{id}` | ENFERMERIA, ADMIN, CONSULTA | — | 200 `EstudianteResponse` |
| GET | `` | ENFERMERIA, ADMIN, CONSULTA | query `filtro?` (matrícula/nombre/apellido, case-insensitive, parcial), `page`, `size`, `sort` | 200 `Page<EstudianteResponse>` |
| DELETE | `/{id}` | **ADMIN** | — | 204 (soft delete) |
| GET | `/{id}/aptitud-donacion` | ENFERMERIA, ADMIN, CONSULTA | — | 200 `AptitudDonacionResponse` |
| GET | `/{id}/ficha` | ENFERMERIA, ADMIN, CONSULTA | — | 200 `FichaEmergenciaResponse` |

`EstudianteRequest` (JSON body):
```json
{
  "matricula": "2021-0123",
  "cedula": "001-1234567-8",
  "nombre": "Juan",
  "apellido": "Pérez",
  "fechaNacimiento": "2000-05-14",
  "sexo": "M",
  "grupoSanguineo": "O_POS",
  "email": "juan.perez@ucateci.edu.do",
  "telefono": "8091234567",
  "carreraId": 1,
  "seguroMedicoId": 2
}
```
Validaciones: `matricula`, `cedula`, `nombre`, `apellido`, `email` `@NotBlank`; `fechaNacimiento`, `sexo`, `grupoSanguineo`, `carreraId` `@NotNull`; `email` formato válido; `seguroMedicoId` opcional. Matrícula/cédula duplicada → 409.

`EstudianteResponse`:
```json
{
  "id": 10,
  "matricula": "2021-0123",
  "cedula": "001-1234567-8",
  "nombre": "Juan",
  "apellido": "Pérez",
  "fechaNacimiento": "2000-05-14",
  "sexo": "M",
  "grupoSanguineo": "O_POS",
  "email": "juan.perez@ucateci.edu.do",
  "telefono": "8091234567",
  "carreraId": 1,
  "carreraNombre": "Medicina",
  "seguroMedicoId": 2,
  "seguroMedicoNombre": "IHSS"
}
```

`AptitudDonacionResponse`:
```json
{ "apto": false, "motivos": ["Enfermedad crónica: Diabetes", "Condición física: Marcapasos"] }
```

`FichaEmergenciaResponse` (agregado completo para consulta rápida en emergencia):
```json
{
  "estudianteId": 10,
  "nombre": "Juan",
  "apellido": "Pérez",
  "grupoSanguineo": "O_POS",
  "email": "juan.perez@ucateci.edu.do",
  "telefono": "8091234567",
  "carrera": "Medicina",
  "seguroMedico": "IHSS",
  "alergias": ["Penicilina"],
  "condicionesFisicas": ["Marcapasos"],
  "enfermedadesCronicas": ["Diabetes"],
  "medicamentosHabituales": ["Metformina 500mg - 1 tableta cada 12h"],
  "medicoReferencia": "Dr. Carlos Gómez - Cardiología - 8091112233",
  "contactoPrincipal": "María Pérez (Madre) - 8093334455",
  "aptitudDonacion": { "apto": false, "motivos": ["Enfermedad crónica: Diabetes"] }
}
```
> Nota: `alergias`, `condicionesFisicas`, etc. son arrays de **strings ya formateados** por el backend (no objetos estructurados) — no se pueden parsear campos individuales desde ahí; son solo para mostrar texto.

## Sub-recursos de estudiante — DTOs JSON tipados

Todos anidados bajo `/api/v1/estudiantes/{estudianteId}/...`, salvo el catálogo plano `/contactos`.
Los payloads request/response son DTOs JSON tipados.

| Recurso | Path | Verbos | Request | Response |
|---|---|---|---|---|
| Alergia | `/estudiantes/{id}/alergias` | POST / GET / GET`{id}` / PUT / DELETE | `{nombre, tipoAlergia, medicamentoId?}` | `{id, nombre, tipoAlergia, medicamentoId\|null}` |
| Condición física | `/estudiantes/{id}/condiciones` | POST / GET / GET`{id}` / PUT / DELETE | `{nombre, descripcion?, impideDonacionSangre}` | `{id, nombre, descripcion\|null, impideDonacionSangre}` |
| Enfermedad | `/estudiantes/{id}/enfermedades` | POST / GET / GET`{id}` / PUT / DELETE *(en construcción)* | `{nombre, esCronica, impideDonacionSangre}` | `{id, nombre, esCronica, impideDonacionSangre}` |
| Medicamento habitual | `/estudiantes/{id}/medicamentos` | POST / GET / GET`{id}` / PUT / DELETE *(en construcción)* | `{medicamentoId, dosis?, frecuencia?}` | `{id, estudianteId, medicamentoId, medicamentoNombre, dosis\|null, frecuencia\|null}` |
| Contacto (catálogo) | `/contactos` | POST / GET / GET`{id}` | `{nombre, telefono, email?}` | `{id, nombre, telefono, email\|null}` |
| ContactoEstudiante | `/estudiantes/{id}/contactos` | POST / GET / GET`{id}` / PUT / DELETE | POST: `{contactoId, parentesco?, esPrincipal?}` · PUT: `{parentesco?, esPrincipal}` | `{id, estudianteId, contactoId, contactoNombre, contactoTelefono, contactoEmail\|null, parentesco\|null, esPrincipal}` |
| Médico de referencia (singleton) | `/estudiantes/{id}/medico-referencia` | POST (upsert) / GET (404 si no hay) | `{nombre, especialidad?, telefono?, hospitalClinica?}` | `{id, nombre, especialidad\|null, telefono\|null, hospitalClinica\|null, estudianteId}` |

Ejemplo: `POST /api/v1/estudiantes/10/alergias` con body `{"nombre":"Penicilina","tipoAlergia":"MEDICAMENTO","medicamentoId":3}`.

Notas:
- `TipoAlergia = 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'OTRO'`; `medicamentoId` en Alergia solo aplica cuando `tipoAlergia === 'MEDICAMENTO'`.
- El backend garantiza **un solo contacto principal por estudiante** (desmarca el anterior automáticamente).
- `MedicoReferencia` es relación 1:1 con el estudiante: el POST hace upsert y no hay lista ni DELETE.
- Los datos de `Enfermedad`, `CondicionFisica` y `Alergia` viajan inline en estos payloads (no requieren endpoints de catálogo propios); `medicamentoId` referencía al catálogo de `Medicamento` (M3).

## `ContactoController` — `/api/v1/contactos` (catálogo plano)

Catálogo de contactos independiente de la asociación con el estudiante; contratos en la tabla de
sub-recursos arriba (`POST` / `GET` / `GET {id}`, sin PUT/DELETE). La asociación
(`ContactoEstudiante`) se gestiona vía `/estudiantes/{id}/contactos`.

## `CarreraController` — `/api/v1/catalogos/carreras`

| Método | Path | Roles | Params |
|---|---|---|---|
| POST | `` | **ADMIN** | query `nombre`, `codigo` |
| GET | `` | ENFERMERIA, ADMIN, CONSULTA | — |

Es el **único** catálogo base con CRUD completo propio (además del catálogo plano de `Contactos`, ver tabla de sub-recursos). `Enfermedad`, `CondicionFisica` y `Alergia` no tienen endpoints de catálogo — sus datos se gestionan inline vía los sub-recursos de estudiante. `SeguroMedico` sigue sin controller — solo semillado por `CommandLineRunner`. Ver [10-known-issues.md](./10-known-issues.md).
