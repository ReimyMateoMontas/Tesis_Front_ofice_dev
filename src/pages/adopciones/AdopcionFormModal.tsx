import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { adopcionApi } from "../../api/adopcionesApi";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";

interface Props {
  onClose: () => void;
  preselectedAnimalId?: number;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white";
const inputError =
  "w-full border border-red-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent bg-white";

// ── Reglas de validación por país ─────────────────────────────────────────────
// Para cada país se define: prefijo telefónico, longitud(es) válidas del número
// nacional, y las reglas de Cédula y Pasaporte (con su formato y ayuda).
type DocRule = { placeholder: string; help: string; test: (v: string) => boolean };
type Country = {
  code: string;
  name: string;
  dial: string;
  phoneLen: number[]; // dígitos válidos del número nacional
  phonePlaceholder: string;
  cedula: DocRule;
  pasaporte: DocRule;
};

const onlyDigits = (v: string) => v.replace(/\D/g, "");
// Pasaporte genérico: 6 a 9 caracteres alfanuméricos (cubre la mayoría de países)
const pasaporteGenerico: DocRule = {
  placeholder: "Ej: AB1234567",
  help: "6 a 9 caracteres (letras y números).",
  test: (v) => /^[A-Za-z0-9]{6,9}$/.test(v.trim()),
};

const COUNTRIES: Country[] = [
  {
    code: "DO",
    name: "República Dominicana",
    dial: "+1",
    phoneLen: [10],
    phonePlaceholder: "809 123 4567",
    cedula: {
      placeholder: "402-1234567-8",
      help: "11 dígitos (000-0000000-0).",
      test: (v) => onlyDigits(v).length === 11,
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "US",
    name: "Estados Unidos",
    dial: "+1",
    phoneLen: [10],
    phonePlaceholder: "212 555 0198",
    cedula: {
      placeholder: "123-45-6789",
      help: "9 dígitos (SSN).",
      test: (v) => onlyDigits(v).length === 9,
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "ES",
    name: "España",
    dial: "+34",
    phoneLen: [9],
    phonePlaceholder: "612 345 678",
    cedula: {
      placeholder: "12345678A",
      help: "DNI: 8 dígitos + 1 letra. NIE: X/Y/Z + 7 dígitos + letra.",
      test: (v) =>
        /^\d{8}[A-Za-z]$/.test(v.trim()) ||
        /^[XYZxyz]\d{7}[A-Za-z]$/.test(v.trim()),
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "MX",
    name: "México",
    dial: "+52",
    phoneLen: [10],
    phonePlaceholder: "55 1234 5678",
    cedula: {
      placeholder: "GOMC900101HDFXXX01",
      help: "CURP: 18 caracteres (letras y números).",
      test: (v) => /^[A-Za-z0-9]{18}$/.test(v.trim()),
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "CO",
    name: "Colombia",
    dial: "+57",
    phoneLen: [10],
    phonePlaceholder: "310 123 4567",
    cedula: {
      placeholder: "1012345678",
      help: "Cédula: 6 a 10 dígitos.",
      test: (v) => {
        const d = onlyDigits(v);
        return d.length >= 6 && d.length <= 10;
      },
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "VE",
    name: "Venezuela",
    dial: "+58",
    phoneLen: [10],
    phonePlaceholder: "412 123 4567",
    cedula: {
      placeholder: "V-12345678",
      help: "V o E + 6 a 9 dígitos.",
      test: (v) => /^[VEve]-?\d{6,9}$/.test(v.trim()),
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "EC",
    name: "Ecuador",
    dial: "+593",
    phoneLen: [9],
    phonePlaceholder: "99 123 4567",
    cedula: {
      placeholder: "1712345678",
      help: "Cédula: 10 dígitos.",
      test: (v) => onlyDigits(v).length === 10,
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "PE",
    name: "Perú",
    dial: "+51",
    phoneLen: [9],
    phonePlaceholder: "912 345 678",
    cedula: {
      placeholder: "12345678",
      help: "DNI: 8 dígitos.",
      test: (v) => onlyDigits(v).length === 8,
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "AR",
    name: "Argentina",
    dial: "+54",
    phoneLen: [10],
    phonePlaceholder: "11 2345 6789",
    cedula: {
      placeholder: "12345678",
      help: "DNI: 7 u 8 dígitos.",
      test: (v) => {
        const d = onlyDigits(v);
        return d.length === 7 || d.length === 8;
      },
    },
    pasaporte: pasaporteGenerico,
  },
  {
    code: "CL",
    name: "Chile",
    dial: "+56",
    phoneLen: [9],
    phonePlaceholder: "9 1234 5678",
    cedula: {
      placeholder: "12345678-9",
      help: "RUN: 7 u 8 dígitos + dígito verificador (0-9 o K).",
      test: (v) => /^\d{7,8}-?[\dkK]$/.test(v.trim()),
    },
    pasaporte: pasaporteGenerico,
  },
];

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function AdopcionFormModal({ onClose, preselectedAnimalId }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    animalId: preselectedAnimalId ? String(preselectedAnimalId) : "",
    nombreAdoptante: "",
    paisCode: "DO",
    tipoDoc: "Cedula" as "Cedula" | "Pasaporte",
    documentoIdentidad: "",
    telefonoAdoptante: "",
    emailAdoptante: "",
    direccionAdoptante: "",
    observaciones: "",
  });
  const [touched, setTouched] = useState(false);

  const pais = COUNTRIES.find((c) => c.code === form.paisCode) ?? COUNTRIES[0];
  const docRule = form.tipoDoc === "Cedula" ? pais.cedula : pais.pasaporte;

  const { data: animales = [] } = useQuery({
    queryKey: ["animales-disponibles"],
    queryFn: () =>
      axiosClient
        .get("/animal")
        .then((r) => r.data.filter((a: any) => a.estadoGeneral === "Activo")),
  });

  const mutation = useMutation({
    mutationFn: () =>
      adopcionApi.registrar({
        animalId: Number(form.animalId),
        nombreAdoptante: form.nombreAdoptante.trim(),
        // Se guarda con prefijo internacional para dejar constancia del país.
        telefonoAdoptante: `${pais.dial} ${onlyDigits(form.telefonoAdoptante)}`,
        emailAdoptante: form.emailAdoptante.trim() || undefined,
        direccionAdoptante: form.direccionAdoptante.trim() || undefined,
        // Se guarda el tipo de documento junto al número.
        documentoIdentidad: `${form.tipoDoc === "Cedula" ? "Cédula" : "Pasaporte"}: ${form.documentoIdentidad.trim()}`,
        fechaAdopcion: new Date().toISOString().split("T")[0],
        usuarioResponsableId: user!.id,
      }),
    onSuccess: () => {
      toast.success("Adopción registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["adopciones"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["animales"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["animales-activos"], refetchType: "all" });
      queryClient.invalidateQueries({ queryKey: ["dashboard"], refetchType: "all" });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.mensaje ?? "Error al registrar adopción");
    },
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Validaciones individuales
  const docValido = docRule.test(form.documentoIdentidad);
  const telValido = pais.phoneLen.includes(onlyDigits(form.telefonoAdoptante).length);
  const mailValido = emailValido(form.emailAdoptante);

  const canSubmit =
    !!form.animalId &&
    !!form.nombreAdoptante.trim() &&
    docValido &&
    telValido &&
    mailValido &&
    !!form.direccionAdoptante.trim();

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) {
      toast.error("Revisa los campos marcados en rojo.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-gray-900">
            Registrar Nueva Adopción
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Animal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Animal a Adoptar *
            </label>
            <select
              value={form.animalId}
              onChange={(e) => set("animalId", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona un animal</option>
              {animales.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                  {a.especie ? ` (${a.especie})` : ""}
                  {a.raza ? ` — ${a.raza}` : ""}
                  {` · #${a.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del Adoptante *
            </label>
            <input
              value={form.nombreAdoptante}
              onChange={(e) => set("nombreAdoptante", e.target.value)}
              placeholder="Nombre completo"
              className={inputClass}
            />
          </div>

          {/* País */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              País *
            </label>
            <select
              value={form.paisCode}
              onChange={(e) => {
                // Al cambiar de país se limpian documento y teléfono para evitar
                // mezclar formatos de países distintos.
                setForm((prev) => ({
                  ...prev,
                  paisCode: e.target.value,
                  documentoIdentidad: "",
                  telefonoAdoptante: "",
                }));
              }}
              className={inputClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.dial})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de documento + Número */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo de Documento *
              </label>
              <select
                value={form.tipoDoc}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    tipoDoc: e.target.value as "Cedula" | "Pasaporte",
                    documentoIdentidad: "",
                  }));
                }}
                className={inputClass}
              >
                <option value="Cedula">Cédula</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Número de Documento *
              </label>
              <input
                value={form.documentoIdentidad}
                onChange={(e) => set("documentoIdentidad", e.target.value)}
                placeholder={docRule.placeholder}
                className={touched && !docValido ? inputError : inputClass}
              />
              <p
                className={`text-xs mt-1 ${touched && !docValido ? "text-red-500" : "text-gray-400"}`}
              >
                {docRule.help}
              </p>
            </div>
          </div>

          {/* Teléfono + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-600">
                  {pais.dial}
                </span>
                <input
                  value={form.telefonoAdoptante}
                  onChange={(e) => set("telefonoAdoptante", e.target.value)}
                  placeholder={pais.phonePlaceholder}
                  className={`${touched && !telValido ? inputError : inputClass} rounded-l-none`}
                />
              </div>
              <p
                className={`text-xs mt-1 ${touched && !telValido ? "text-red-500" : "text-gray-400"}`}
              >
                {pais.phoneLen.join(" o ")} dígitos.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={form.emailAdoptante}
                onChange={(e) => set("emailAdoptante", e.target.value)}
                placeholder="correo@ejemplo.com"
                className={touched && !mailValido ? inputError : inputClass}
              />
              {touched && !mailValido && (
                <p className="text-xs mt-1 text-red-500">
                  Ingresa un correo válido.
                </p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Dirección *
            </label>
            <input
              value={form.direccionAdoptante}
              onChange={(e) => set("direccionAdoptante", e.target.value)}
              placeholder="Calle, número, sector, ciudad"
              className={inputClass}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
              rows={3}
              placeholder="Información adicional sobre el adoptante..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Registrar Adopción"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
