# Frontend: catálogo Unidades de Medida + migración de Medicamento a `unidadMedidaId`

## Contexto

El backend (`plan-13-unidad-medida.md`) agrega un catálogo `UnidadMedida` (`/api/v1/unidades-medida`, CRUD completo, campos `id`/`nombre`/`abreviatura`/`descripcion`) y migra `Insumo`/`Medicamento` de `unidadMedida: String` libre a `unidadMedidaId: Long` (FK), manteniendo en la respuesta tanto `unidadMedida` (nombre, string, solo lectura) como `unidadMedidaId` (para preseleccionar en formularios). Este plan cubre ambos lados en el frontend: (1) la pantalla CRUD del catálogo nuevo, análoga a la ya existente de Tipos de Medicamento, y (2) actualizar `MedicamentoForm`/`MedicamentoListPage` para dejar de enviar texto libre y usar el combobox de unidades.

Decisiones tomadas:
- El catálogo se clona **al pie de la letra** del patrón `TipoMedicamento` (mismo tipo de CRUD, mismo estilo de página, misma factory de hooks) — es el catálogo mejor implementado hoy en el frontend.
- El selector de unidad en `MedicamentoForm` usa el componente `Combobox` (`src/components/ui/combobox.tsx`, ya implementado) — mismo patrón que `insumoId` en `LoteForm.tsx`.
- El campo `unidadMedida` (string) desaparece de los formularios editables; el request de creación/edición solo envía `unidadMedidaId`. La tabla de Medicamentos sigue mostrando el nombre (`row.unidadMedida`), que el backend sigue devolviendo.
- En el menú, "Catálogos" pasa de ítem directo a ítem padre con submenú (mismo patrón que "Inventario" en `nav-config.ts`), con hijos "Tipos de Medicamento" y "Unidades de Medida".
- Backend y frontend se dan por disponibles/en paralelo — no hay que esperar ni mockear.

## Parte 1 — Catálogo `UnidadMedida` (nuevo, CRUD completo)

Clonar el patrón `TipoMedicamento` (`src/features/catalogos/`):

1. **`src/features/catalogos/types.ts`** — agregar:
   ```ts
   export type UnidadMedida = { id: number; nombre: string; abreviatura: string; descripcion: string; activo: boolean }
   export type CreateUnidadMedidaRequest = { nombre: string; abreviatura: string; descripcion: string }
   ```
2. **`src/features/catalogos/hooks/useUnidadesMedida.ts`** (nuevo) — clon exacto de `useTiposMedicamento.ts`:
   ```ts
   const unidadesMedidaApi = createResourceApi<UnidadMedida, CreateUnidadMedidaRequest>('/unidades-medida')
   export const {
     useList: useUnidadesMedida,
     useGetById: useUnidadMedida,
     useCreate: useCreateUnidadMedida,
     useUpdate: useUpdateUnidadMedida,
     useRemove: useRemoveUnidadMedida,
   } = createCrudHooks<UnidadMedida, CreateUnidadMedidaRequest, CreateUnidadMedidaRequest, PageResponse<UnidadMedida>>(
     'unidades-medida',
     unidadesMedidaApi,
   )
   ```
3. **`src/features/catalogos/components/UnidadMedidaListPage.tsx`** (nuevo) — clon de `TipoMedicamentoListPage.tsx` (ver ese archivo como referencia exacta de estructura: `DataTable` + `FormDialog` + `ConfirmDeleteDialog`, form inline con `useForm`/zod, `mapApiErrorToForm` en el catch). Diferencias:
   - Schema: `z.object({ nombre: z.string().min(1, 'El nombre es obligatorio'), abreviatura: z.string().min(1, 'La abreviatura es obligatoria'), descripcion: z.string() })`.
   - Columnas: ID, Nombre, Abreviatura, Descripción, Estado (Badge).
   - Form del diálogo: 3 campos (`Input` nombre, `Input` abreviatura, `Input` descripción — sin validación de longitud mínima en descripción, es opcional pero el backend la modela como string libre).
   - Textos: título "Unidades de Medida", botón "Nueva", diálogo "Nueva/Editar unidad de medida", confirmación de borrado "¿Está seguro que desea desactivar la unidad "{nombre}"?".
4. **`src/app/routes.tsx`** — importar `UnidadMedidaListPage` y agregar, junto a la ruta de `tipos-medicamento` (mismo bloque, mismo `RoleGuard`):
   ```tsx
   <Route
     path="/catalogos/unidades-medida"
     element={
       <RoleGuard allow={["ADMIN", "ALMACEN"]}>
         <UnidadMedidaListPage />
       </RoleGuard>
     }
   />
   ```
5. **`src/app/layout/nav-config.ts`** — convertir el ítem "Catálogos" (línea ~76) en padre con `children`, mismo shape que el ítem "Inventario":
   ```ts
   {
     label: 'Catálogos', icon: LayoutGrid, roles: ['ADMIN', 'ALMACEN'],
     children: [
       { label: 'Tipos de Medicamento', path: '/catalogos/tipos-medicamento', roles: ['ADMIN', 'ALMACEN'] },
       { label: 'Unidades de Medida', path: '/catalogos/unidades-medida', roles: ['ADMIN', 'ALMACEN'] },
     ],
   },
   ```

## Parte 2 — Migrar `Medicamento` a `unidadMedidaId`

1. **`src/features/inventario/types.ts`**:
   ```ts
   export type Insumo = {
     id: number
     nombre: string
     tipo: TipoInsumo
     unidadMedida: string      // nombre, solo lectura (lo sigue devolviendo el backend)
     unidadMedidaId: number    // FK, editable
     stockMinimo: number
     activo: boolean
   }
   export type CreateMedicamentoRequest = Omit<Medicamento, 'id' | 'activo' | 'unidadMedida'>
   ```
   (`unidadMedida` se excluye del request de creación/edición porque ya no se edita como texto; `unidadMedidaId`, heredado de `Insumo`, queda incluido y es obligatorio.)

2. **`src/features/inventario/components/MedicamentoForm.tsx`**:
   - `MedicamentoFormValues`: reemplazar `unidadMedida: string` por `unidadMedidaId: number`.
   - Reemplazar el bloque `<Input id="unidadMedida" ...>` por un `Combobox`, replicando el patrón de `insumoId` en `LoteForm.tsx`:
     ```tsx
     const { data: unidadesData } = useUnidadesMedida()
     const unidadOptions: ComboboxOption[] = (unidadesData?.content ?? []).map(u => ({ value: String(u.id), label: `${u.nombre} (${u.abreviatura})` }))
     ...
     <Label>Unidad de Medida</Label>
     <Combobox
       options={unidadOptions}
       value={form.watch('unidadMedidaId') ? String(form.watch('unidadMedidaId')) : ''}
       onChange={(value) => form.setValue('unidadMedidaId', Number(value))}
       placeholder="Seleccione una unidad"
       className="w-full"
     />
     {form.formState.errors.unidadMedidaId && <p className="text-sm text-destructive">{form.formState.errors.unidadMedidaId.message}</p>}
     ```
   - Importar `useUnidadesMedida` desde `@/features/catalogos/hooks/useUnidadesMedida` (mismo import que ya hace con `useTiposMedicamento`).

3. **`src/features/inventario/components/MedicamentoListPage.tsx`**:
   - Schema: reemplazar `unidadMedida: z.string().min(1, ...)` por `unidadMedidaId: z.number().min(1, 'La unidad de medida es obligatoria')`.
   - `defaultValues` (en `useForm` y en `openCreate`): `unidadMedidaId: 0` en vez de `unidadMedida: ''`.
   - `openEdit`: `unidadMedidaId: row.unidadMedidaId` en vez de `unidadMedida: row.unidadMedida`.
   - Columna de tabla: **sin cambios** — sigue siendo `{ header: 'Unidad Medida', cell: (row) => row.unidadMedida }` (nombre, de solo lectura).

## Verificación

No hay test runner configurado. Verificación:
1. `pnpm lint` y `pnpm build` (`tsc -b`) — valida que los tipos de `unidadMedidaId` cuadren en `types.ts`, `MedicamentoForm.tsx` y `MedicamentoListPage.tsx`, y que no queden imports/campos `unidadMedida` string sueltos en los formularios.
2. `pnpm dev`, con el backend de Plan 13 corriendo:
   - **Catálogo**: entrar a Catálogos → Unidades de Medida (verificar que aparece en el submenú), crear una unidad, editarla, desactivarla (soft delete), confirmar duplicado por nombre y por abreviatura → error mostrado en el form (vía `mapApiErrorToForm`, debe mapear el 409 del backend).
   - **Medicamentos**: crear un medicamento nuevo seleccionando una unidad del combobox (confirmar que filtra por texto), guardar y confirmar que la tabla muestra el nombre de la unidad; editar un medicamento existente y confirmar que el combobox preselecciona la unidad correcta (`unidadMedidaId` resuelto desde `row`); confirmar que el payload enviado a `POST`/`PUT` no incluye `unidadMedida` (string), solo `unidadMedidaId`.
   - Confirmar visibilidad del ítem "Catálogos" y sus hijos solo para roles `ADMIN`/`ALMACEN` (probar con un usuario `CONSULTA`/`ENFERMERIA`, no debe verlo ni poder acceder por URL directa — `RoleGuard` redirige a `/`).

### Archivos críticos
- `src/features/catalogos/components/TipoMedicamentoListPage.tsx` (plantilla a clonar)
- `src/features/catalogos/hooks/useTiposMedicamento.ts` (plantilla a clonar)
- `src/features/catalogos/types.ts`
- `src/features/inventario/components/MedicamentoForm.tsx`
- `src/features/inventario/components/MedicamentoListPage.tsx`
- `src/features/inventario/types.ts`
- `src/app/routes.tsx`
- `src/app/layout/nav-config.ts`
