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
  "alergias": ["Penicilina (severidad: GRAVE)"],
  "condicionesFisicas": ["Marcapasos"],
  "enfermedadesCronicas": ["Diabetes"],
  "medicamentosHabituales": ["Metformina 500mg - 1 tableta cada 12h"],
  "medicoReferencia": "Dr. Carlos Gómez - Cardiología - 8091112233",
  "contactoPrincipal": "María Pérez (Madre) - 8093334455",
  "aptitudDonacion": { "apto": false, "motivos": ["Enfermedad crónica: Diabetes"] }
}
```
> Nota: `alergias`, `condicionesFisicas`, etc. son arrays de **strings ya formateados** por el backend (no objetos estructurados) — no se pueden parsear campos individuales desde ahí; son solo para mostrar texto.

## Sub-recursos de estudiante — ⚠️ reciben **query params**, no JSON body

Todos anidados bajo `/api/v1/estudiantes/{estudianteId}/...`. El backend responde con `Map<String,Object>` genérico en el POST (no un DTO tipado) y con tipo sin especificar (`?`) en el GET — tratar como `unknown`/`any` en el cliente hasta inspeccionar la forma real en runtime (usar Swagger UI o probar contra el backend corriendo).

| Recurso | Método/Path | Roles | Query params |
|---|---|---|---|
| Alergias | `POST /alergias` | ENFERMERIA, ADMIN | `alergiaId` (Long), `severidad` (string: `LEVE`\|`MODERADA`\|`GRAVE`) |
| Alergias | `GET /alergias` | ENFERMERIA, ADMIN, CONSULTA | — |
| Condiciones físicas | `POST /condiciones` | ENFERMERIA, ADMIN | `condicionId` (Long) |
| Condiciones físicas | `GET /condiciones` | ENFERMERIA, ADMIN, CONSULTA | — |
| Contactos | `POST /contactos` | ENFERMERIA, ADMIN | `contactoId` (Long), `parentesco` (string), `esPrincipal` (boolean, default `false`) |
| Contactos | `GET /contactos` | ENFERMERIA, ADMIN, CONSULTA | — |
| Medicamentos habituales | `POST /medicamentos` | ENFERMERIA, ADMIN | `medicamentoId` (Long), `dosis` (string) |
| Medicamentos habituales | `GET /medicamentos` | ENFERMERIA, ADMIN, CONSULTA | — |
| Médico de referencia | `POST /medico-referencia` | ENFERMERIA, ADMIN | `nombre`, `especialidad`, `telefono` (strings) — crea o **reemplaza** el único médico de referencia del estudiante (relación 1:1 de hecho) |
| Médico de referencia | `GET /medico-referencia` | ENFERMERIA, ADMIN, CONSULTA | — |

Ejemplo de llamada (fetch/axios): `POST /api/v1/estudiantes/10/alergias?alergiaId=3&severidad=GRAVE` (sin body, o body vacío — los params van en la query string).

> ⚠️ Para crear una alergia con `tipoAlergia=MEDICAMENTO`, el catálogo `Alergia` requiere una FK a `Medicamento` — pero **no hay forma de leer el catálogo `Alergia` vía API** (ver known issues). Los `alergiaId`/`condicionId` a usar deben obtenerse de otra fuente (semilla conocida, Swagger, o solicitar que se exponga el catálogo).

## `ContactoController` — `/api/v1/contactos` (catálogo de contactos, independiente de la asociación)

| Método | Path | Roles | Params |
|---|---|---|---|
| POST | `` | ENFERMERIA, ADMIN | query `nombre`, `telefono`, `email?` |
| GET | `` | ENFERMERIA, ADMIN | — |

## `CarreraController` — `/api/v1/catalogos/carreras`

| Método | Path | Roles | Params |
|---|---|---|---|
| POST | `` | **ADMIN** | query `nombre`, `codigo` |
| GET | `` | ENFERMERIA, ADMIN, CONSULTA | — |

Es el **único** catálogo base con endpoint CRUD propio. `Enfermedad`, `CondicionFisica`, `Alergia`, `SeguroMedico` **no tienen controller** — solo existen semillados por `CommandLineRunner`. Ver [10-known-issues.md](./10-known-issues.md).
