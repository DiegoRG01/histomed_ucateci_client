import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  type ComboboxOption,
} from "@/components/ui/combobox";
import { useCarreras } from "@/features/catalogos/hooks/useCarreras";
import { useSegurosMedicos } from "@/features/catalogos/hooks/useSegurosMedicos";
import type { GrupoSanguineo, Sexo } from "../types";

type EstudianteFormValues = {
  matricula: string;
  cedula: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  sexo: "" | Sexo;
  grupoSanguineo: "" | GrupoSanguineo;
  email: string;
  telefono: string;
  carreraId: number;
  seguroMedicoId: number | null;
};

export type { EstudianteFormValues };

type EstudianteFormProps = {
  form: UseFormReturn<EstudianteFormValues, object, EstudianteFormValues>;
  onSubmit: (values: EstudianteFormValues) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
};

const SEXOS: { label: string; value: Sexo }[] = [
  { label: "Masculino", value: "M" },
  { label: "Femenino", value: "F" },
  { label: "Otro", value: "OTRO" },
];
const GRUPOS_SANGUINEOS: GrupoSanguineo[] = [
  "O_POS",
  "O_NEG",
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
];

export function EstudianteForm({
  form,
  onSubmit,
  onCancel,
  isPending,
}: EstudianteFormProps) {
  const { data: carrerasData } = useCarreras();
  const carreras = carrerasData ?? [];
  const { data: segurosData } = useSegurosMedicos();
  const seguros = segurosData ?? [];

  const sexoOptions: ComboboxOption[] = SEXOS.map((sexo) => ({
    value: sexo.value,
    label: sexo.label,
  }));

  const grupoSanguineoOptions: ComboboxOption[] = GRUPOS_SANGUINEOS.map(
    (grupo) => ({
      value: grupo,
      label: grupo,
    }),
  );

  const carreraOptions: ComboboxOption[] = carreras.map((carrera) => ({
    value: String(carrera.id),
    label: carrera.nombre,
  }));

  const seguroMedicoOptions: ComboboxOption[] = [
    { value: "", label: "Sin seguro médico" },
    ...seguros.map((seguro) => ({
      value: String(seguro.id),
      label: seguro.nombre,
    })),
  ];

  return (
    <form
      onSubmit={form.handleSubmit((v) => onSubmit(v as EstudianteFormValues))}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            id="matricula"
            {...form.register("matricula")}
            placeholder="Matrícula"
          />
          {form.formState.errors.matricula && (
            <p className="text-sm text-destructive">
              {form.formState.errors.matricula.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cedula">Cédula</Label>
          <Input
            id="cedula"
            {...form.register("cedula")}
            placeholder="Cédula"
          />
          {form.formState.errors.cedula && (
            <p className="text-sm text-destructive">
              {form.formState.errors.cedula.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            {...form.register("nombre")}
            placeholder="Nombre"
          />
          {form.formState.errors.nombre && (
            <p className="text-sm text-destructive">
              {form.formState.errors.nombre.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input
            id="apellido"
            {...form.register("apellido")}
            placeholder="Apellido"
          />
          {form.formState.errors.apellido && (
            <p className="text-sm text-destructive">
              {form.formState.errors.apellido.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaNacimiento">
            Fecha de nacimiento (DD/MM/AAAA)
          </Label>
          <Input
            id="fechaNacimiento"
            type="date"
            {...form.register("fechaNacimiento")}
          />
          {form.formState.errors.fechaNacimiento && (
            <p className="text-sm text-destructive">
              {form.formState.errors.fechaNacimiento.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Sexo</Label>
          <Combobox
            options={sexoOptions}
            value={form.watch("sexo")}
            onChange={(value) => form.setValue("sexo", value as Sexo)}
            placeholder="Seleccione un sexo"
          />
          {form.formState.errors.sexo && (
            <p className="text-sm text-destructive">
              {form.formState.errors.sexo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Grupo sanguíneo</Label>
          <Combobox
            options={grupoSanguineoOptions}
            value={form.watch("grupoSanguineo")}
            onChange={(value) =>
              form.setValue("grupoSanguineo", value as GrupoSanguineo)
            }
            placeholder="Seleccione un grupo sanguíneo"
          />
          {form.formState.errors.grupoSanguineo && (
            <p className="text-sm text-destructive">
              {form.formState.errors.grupoSanguineo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="correo@ejemplo.com"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            {...form.register("telefono")}
            placeholder="Teléfono (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label>Carrera</Label>
          <Combobox
            options={carreraOptions}
            value={
              form.watch("carreraId") ? String(form.watch("carreraId")) : ""
            }
            onChange={(value) => form.setValue("carreraId", Number(value))}
            placeholder="Seleccione una carrera"
          />
          {form.formState.errors.carreraId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.carreraId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Seguro médico</Label>
          <Combobox
            options={seguroMedicoOptions}
            value={
              form.watch("seguroMedicoId")
                ? String(form.watch("seguroMedicoId"))
                : ""
            }
            onChange={(value) =>
              form.setValue(
                "seguroMedicoId",
                value === "" ? null : Number(value),
              )
            }
            placeholder="Sin seguro médico"
          />
          {form.formState.errors.seguroMedicoId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.seguroMedicoId.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
