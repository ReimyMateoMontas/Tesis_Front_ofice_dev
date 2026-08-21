import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import {
  IconCrop,
  IconX,
  IconLoader2,
  IconUpload,
  IconLink,
} from "@tabler/icons-react";
import { animalApi } from "../../api/animalApi";
import { useAppSelector } from "../../hooks/hooks";
import { axiosClient } from "../../api/axiosClient";
import { formatearEdad } from "../../utils/Edad";
import { ImageCropperModal } from "../../components/ImageCropperModal";
import { isClinicalZone } from "../../components/ZonaConstants";

const schema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  especieId: z.coerce.number().min(1, "Selecciona una especie"),
  raza: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  fechaNacimientoEstimada: z.boolean().optional(),
  fechaIngreso: z.string().min(1, "La fecha de ingreso es requerida"),
  sexo: z.string().min(1, "El sexo es requerido"),
  zonaActualId: z.coerce.number().min(1, "Selecciona una zona"),
  color: z.string().optional(),
  fotografiaUrl: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface RegistrationZone {
  id: number;
  nombre: string;
}

interface RawZone {
  Id?: number;
  id?: number;
  Name?: string;
  name?: string;
  Nombre?: string;
  nombre?: string;
}

export function AnimalFormModal({ onClose, onSuccess }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<
    number | null | undefined
  >(undefined);

  const { data: zonas = [] } = useQuery<RegistrationZone[]>({
    queryKey: ["zonas"],
    queryFn: async () => {
      const { data } = await axiosClient.get("/zone");
      const rawZones: RawZone[] = Array.isArray(data) ? data : [];
      return rawZones.reduce<RegistrationZone[]>((result, zone) => {
        const id = zone.Id ?? zone.id;
        if (typeof id !== "number") return result;

        result.push({
          id,
          nombre:
            zone.Name ??
            zone.name ??
            zone.Nombre ??
            zone.nombre ??
            "Sin nombre",
        });
        return result;
      }, []);
    },
  });

  const { data: especie = [] } = useQuery({
    queryKey: ["especie"],
    queryFn: async () => {
      try {
        const { data } = await axiosClient.get("/animal/especie");
        return data;
      } catch {
        return [];
      }
    },
  });

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { fechaIngreso: new Date().toISOString().split("T")[0] },
  });

  const clinicalZone = zonas.find((zone) => isClinicalZone(zone.nombre));

  useEffect(() => {
    if (Number(getValues("zonaActualId")) > 0) return;

    if (clinicalZone) {
      setValue("zonaActualId", clinicalZone.id, { shouldValidate: true });
    }
  }, [clinicalZone, getValues, setValue]);

  const effectiveZoneId =
    selectedZoneId === undefined ? clinicalZone?.id : selectedZoneId;
  const selectedZoneIndex = zonas.findIndex(
    (zone) => zone.id === effectiveZoneId,
  );
  const selectedZone = zonas[selectedZoneIndex];
  const zoneRegistration = register("zonaActualId");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("La imagen original no puede superar 15MB");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSource(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const applyCrop = (croppedImage: string) => {
    setPreview(croppedImage);
    setValue("fotografiaUrl", croppedImage, { shouldDirty: true });
    setCropSource(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const cancelCrop = () => {
    setCropSource(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreview(e.target.value);
    setValue("fotografiaUrl", e.target.value);
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      animalApi.create({ ...data, usuarioRegistroId: user!.id }),
    onSuccess: () => {
      toast.success("Animal registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["animales"] });
      onSuccess();
    },
    onError: (err: any) =>
      toast.error(
        err.response?.data?.mensaje ?? "Error al registrar el animal",
      ),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div
          className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4
          flex items-center justify-between rounded-t-2xl z-10"
        >
          <h2 className="text-base font-semibold text-gray-900">
            Registrar Animal
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IconX size={20} stroke={1.8} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d as FormData))}
          className="p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Nombre *" error={errors.nombre?.message}>
                <input
                  {...register("nombre")}
                  placeholder="Ej: Max"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Especie *" error={errors.especieId?.message}>
              <select {...register("especieId")} className={inputClass}>
                <option value="">Selecciona especie</option>
                {especie.length > 0 ? (
                  especie.map((e: any) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1">Perro</option>
                    <option value="2">Gato</option>
                    <option value="3">Ave</option>
                    <option value="4">Otro</option>
                  </>
                )}
              </select>
            </Field>

            <Field label="Raza" error={errors.raza?.message}>
              <input
                {...register("raza")}
                placeholder="Ej: Labrador"
                className={inputClass}
              />
            </Field>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha de nacimiento
              </label>
              <input
                {...register("fechaNacimiento")}
                type="date"
                max={new Date().toISOString().split("T")[0]}
                className={inputClass}
              />
              <label className="flex items-center gap-2 mt-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("fechaNacimientoEstimada")}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                La fecha es estimada (no se conoce la exacta)
              </label>
              {watch("fechaNacimiento") && (
                <p className="text-xs text-green-600 mt-1.5">
                  Edad actual: {formatearEdad(watch("fechaNacimiento"))}
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                La edad se calcula automáticamente y se mantiene actualizada con
                el tiempo.
              </p>
            </div>

            <Field label="Sexo *" error={errors.sexo?.message}>
              <select {...register("sexo")} className={inputClass}>
                <option value="">Selecciona sexo</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </Field>

            <Field
              label="Fecha de ingreso *"
              error={errors.fechaIngreso?.message}
            >
              <input
                {...register("fechaIngreso")}
                type="date"
                className={inputClass}
              />
            </Field>

            <Field label="Zona actual *" error={errors.zonaActualId?.message}>
              <select
                {...zoneRegistration}
                onChange={(event) => {
                  zoneRegistration.onChange(event);
                  const zoneId = Number(event.target.value);
                  setSelectedZoneId(zoneId > 0 ? zoneId : null);
                }}
                className={inputClass}
              >
                <option value="">Selecciona zona</option>
                {zonas.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.nombre}
                  </option>
                ))}
              </select>
              {selectedZone && isClinicalZone(selectedZone.nombre) && (
                <p className="mt-1.5 text-[11px] text-blue-600">
                  Área clínica seleccionada automáticamente.
                </p>
              )}
            </Field>

            <Field label="Color" error={errors.color?.message}>
              <input
                {...register("color")}
                placeholder="Ej: Blanco con marrón"
                className={inputClass}
              />
            </Field>

            {/* Fotografía */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fotografía
              </label>
              {preview && (
                <div className="relative mb-3 aspect-[16/7] overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreview("")}
                  />
                  <button
                    type="button"
                    onClick={() => setCropSource(preview)}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/65 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                  >
                    <IconCrop size={15} />
                    Ajustar
                  </button>
                </div>
              )}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center
                  cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors mb-3"
              >
                <IconUpload
                  size={24}
                  stroke={1.5}
                  className="text-gray-300 mx-auto mb-1"
                />
                <p className="text-sm text-gray-400">
                  Haz clic para subir una imagen
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  PNG, JPG o WEBP — máx 15MB
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">o pegar URL</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="relative">
                <IconLink
                  size={16}
                  stroke={1.8}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  type="url"
                  placeholder="https://..."
                  className={`${inputClass} pl-9`}
                  onChange={handleUrlChange}
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Field
                label="Observaciones"
                error={errors.observaciones?.message}
              >
                <textarea
                  {...register("observaciones")}
                  rows={3}
                  placeholder="Notas adicionales sobre el animal..."
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200
                rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600
                hover:bg-green-700 disabled:bg-green-400 rounded-xl transition-colors
                flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <IconLoader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Animal"
              )}
            </button>
          </div>
        </form>
      </div>

      {cropSource && (
        <ImageCropperModal
          imageSrc={cropSource}
          onCancel={cancelCrop}
          onConfirm={applyCrop}
        />
      )}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 " +
  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
