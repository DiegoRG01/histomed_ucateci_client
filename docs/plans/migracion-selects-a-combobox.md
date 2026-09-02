# Migrar los `Select` de shadcn/ui a un `Combobox` buscable

## Contexto

El proyecto ya usa shadcn/ui correctamente (no hay Radix "crudo" en el código de negocio: se descartó esa hipótesis inicial). El pedido real es de UX: los `<Select>` actuales (dropdown simple) deben comportarse como un **combobox buscable** — patrón oficial shadcn de Popover + Command (`cmdk`) — para que listas largas de catálogo (medicamentos, insumos, carreras, seguros médicos) sean filtrables por texto en vez de scrollear.

Decisiones ya validadas con el usuario:
- Alcance: **todos** los usos de `Select` migran a `Combobox`, incluidos los de listas cortas estáticas (no solo los catálogos dinámicos), para unificar comportamiento en toda la app.
- Se construye **un componente reutilizable** `Combobox` (no wrappers ad-hoc por formulario).
- Comportamiento: solo búsqueda/filtrado **client-side** sobre las opciones ya cargadas (sin botón de limpiar selección, sin carga asíncrona/server-side).

## Inventario verificado: 12 instancias de `<Select>` en 6 archivos

| Archivo | Campo(s) | Opciones |
|---|---|---|
| `src/features/estudiantes/components/EstudianteForm.tsx` | Sexo, Grupo sanguíneo, Carrera, Seguro médico | 2 estáticas + 2 dinámicas (`useCarreras()`, `useSegurosMedicos()`) |
| `src/features/estudiantes/components/MedicamentoHabitualForm.tsx` | Medicamento | dinámica (`useMedicamentos.useList({ size: 100 })`) |
| `src/features/estudiantes/components/AlergiaForm.tsx` | Tipo de alergia, Medicamento (condicional) | 1 estática + 1 dinámica |
| `src/features/inventario/components/LoteForm.tsx` | Insumo | dinámica (`useInsumos.useList()`) |
| `src/features/inventario/components/MedicamentoForm.tsx` | Tipo (Medicamento/Insumo) | estática (2 opts) |
| `src/features/inventario/components/MovimientoForm.tsx` | Insumo, **Lote** (dependiente, `disabled` si no hay insumo), Tipo de Movimiento | 2 dinámicas + 1 estática |

Todos siguen el **mismo patrón manual** de integración con react-hook-form (sin `Controller`/`FormField`, que existe en `src/components/ui/form.tsx` pero no se usa en ninguno de estos 6 formularios):

```tsx
<Select
  value={form.watch('insumoId') ? String(form.watch('insumoId')) : ''}
  onValueChange={(value) => form.setValue('insumoId', Number(value))}
>
  <SelectTrigger className="w-full"><SelectValue placeholder="..." /></SelectTrigger>
  <SelectContent>{items.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.nombre}</SelectItem>)}</SelectContent>
</Select>
```
IDs numéricos siempre viajan como string (`String(id)` / `Number(value)`), porque Radix Select solo soporta valores string.

## Estado de dependencias

- `cmdk` **no está instalado** → agregar (`^1.1.1`, compatible con React 19).
- `src/components/ui/popover.tsx` **ya existe** (Popover/PopoverTrigger/PopoverContent sobre el paquete unificado `radix-ui`). Su `PopoverContent` trae `w-72` fijo por defecto — el combobox debe sobreescribirlo.
- `src/components/ui/command.tsx` **no existe** → crear.
- No existe ningún `combobox.tsx` previo.

## Diseño del componente `src/components/ui/combobox.tsx`

```ts
export type ComboboxOption = {
  value: string
  label: string
  keywords?: string[]   // términos extra para que cmdk filtre por texto, no solo por `value`
  disabled?: boolean
}

type ComboboxProps = {
  options: ComboboxOption[]
  value: string                       // '' = sin selección, misma convención que Select hoy
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string          // default "Buscar..."
  emptyText?: string                  // default "Sin resultados."
  disabled?: boolean
  className?: string                  // aplica al trigger (uso típico: "w-full")
  id?: string
  "aria-invalid"?: boolean
}
```

Estructura: `Popover` → `PopoverTrigger asChild` con un `<button type="button" role="combobox" aria-expanded={open}>` que replica 1:1 las clases de `SelectTrigger` (mismo `border-input`, `focus-visible:ring-ring/50`, `dark:bg-input/30`, `disabled:opacity-50`, etc., para paridad visual) → `PopoverContent` (con `className` sobreescribiendo el `w-72` por defecto, usando `w-[var(--radix-popper-anchor-width)]` para igualar el ancho al trigger — validar en navegador; Radix Popper expone esa custom property en todo content basado en Popper aunque el wrapper no la referencie explícitamente) → `Command` → `CommandInput` + `CommandList` + `CommandEmpty` + `CommandGroup` + `CommandItem` (con `keywords={[option.label]}` para que el filtro busque por texto visible, no por el id numérico que es el `value`) + ícono `Check` cuando `option.value === value`.

Cerrar el popover (`setOpen(false)`) al seleccionar un item, igual que `Select` hoy.

## Pasos de implementación

1. **`pnpm add cmdk`** y crear `src/components/ui/command.tsx` a mano (copiar el template oficial de shadcn: `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`; **omitir `CommandDialog`**, que depende de `dialog.tsx` y no se necesita, para evitar tocar ese archivo).
2. Crear `src/components/ui/combobox.tsx` según el diseño anterior. Probarlo aislado en un formulario simple antes de propagar (ver orden abajo).
3. Migrar los 6 formularios, reemplazando el import `@/components/ui/select` por `@/components/ui/combobox` y el bloque `<Select>...</Select>` por `<Combobox options={...} value={...} onChange={...} placeholder="..." />`. El bloque de error (`form.formState.errors.x && <p>...`) no cambia. Orden sugerido (de más simple a más delicado, usando cada paso para validar el componente antes del siguiente):
   1. `LoteForm.tsx` — 1 combobox dinámico simple (smoke test).
   2. `MedicamentoForm.tsx` y `MedicamentoHabitualForm.tsx` — casos simples adicionales (estático y dinámico).
   3. `AlergiaForm.tsx` — combobox condicional (Medicamento solo si tipo = MEDICAMENTO).
   4. `MovimientoForm.tsx` — 3 comboboxes; el de **Lote** depende del insumo seleccionado (`disabled={!selectedInsumoId}`) y se resetea (`form.setValue('loteId', null)`) al cambiar de insumo — preservar exactamente esa lógica en el `onChange` del combobox de Insumo.
   5. `EstudianteForm.tsx` — 4 comboboxes; el de **Seguro médico** incluye un item `{ value: '', label: 'Sin seguro médico' }` al inicio de `options` con `onChange`: `value === '' ? null : Number(value)` — confirmar que ese item sigue siendo encontrable al buscar "sin" gracias a `keywords`.
4. Verificar que ningún archivo quede con imports de `Select` sin usar.

## Riesgos / edge cases a vigilar

- **Filtrado por `value` en vez de `label`**: sin `keywords`, cmdk filtraría por el id numérico (`"42"`) y buscar por nombre no encontraría nada. Ya cubierto por `keywords={[option.label]}` — verificar en cada migración.
- **Ancho del popover**: `PopoverContent` trae `w-72` fijo; el combobox debe forzar ancho = ancho del trigger. Validar visualmente en el primer formulario migrado (`LoteForm.tsx`); si `--radix-popper-anchor-width` no resuelve, usar `ResizeObserver` sobre el trigger como fallback.
- **Label no resuelto en el primer render (modo editar)**: si el `value` llega poblado antes de que la query del catálogo resuelva, el trigger mostrará el placeholder hasta que `options` se puebla — mismo comportamiento que hoy tiene `Select`/`SelectValue`, no es regresión, pero probar el flujo de edición (no solo creación) de cada formulario.
- **`MovimientoForm.tsx`**: confirmar que el combobox de Lote no abre estando `disabled`, y que se resetea visualmente al cambiar de insumo.

## Verificación

No hay test runner configurado. Verificación:
1. `pnpm install` (tras añadir `cmdk`), `pnpm lint`, `pnpm build` (valida tipos de las conversiones `String(id)`/`Number(value)` y los casts a tipos literales como `Sexo`, `TipoMovimiento`).
2. `pnpm dev` y probar manualmente cada uno de los 6 formularios en modo **crear** y **editar**: abrir el combobox, filtrar por texto parcial, seleccionar, confirmar label correcto en el trigger y check en el item activo al reabrir, enviar el formulario y confirmar tipos correctos en el payload. Casos puntuales: "Sin seguro médico" en `EstudianteForm`, dependencia Insumo→Lote en `MovimientoForm`, navegación por teclado (flechas/Enter/Escape), y modo oscuro (`dark:bg-input/30`).

### Archivos críticos
- `src/components/ui/select.tsx` (referencia de estilos/API)
- `src/components/ui/popover.tsx` (base del combobox)
- `src/components/ui/combobox.tsx` (nuevo)
- `src/components/ui/command.tsx` (nuevo)
- `package.json` (añadir `cmdk`)
- Los 6 formularios listados arriba
