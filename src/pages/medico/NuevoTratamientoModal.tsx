import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { medicoApi } from "../../api/medicoApi";
import { axiosClient } from "../../api/axiosClient";
import { useAppSelector } from "../../hooks/hooks";

interface Props {
  onClose: () => void;

  preselectedAnimalId?: number | null;
}

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

function MedicamentoSelector({
  value,
  onChange,
}: {
  value: { id: number | null; nombre: string };
  onChange: (v: { id: number | null; nombre: string }) => void;
}) {
  const [query, setQuery] = useState(value.nombre);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: medicamentos = [] } = useQuery({
    queryKey: ["medicamentos"],
    queryFn: medicoApi.getMedicamentos,
  });

  const filtrados = medicamentos.filter((m: any) =>
    m.nombre.toLowerCase().includes(query.toLowerCase()),
  );
  const exactMatch = medicamentos.find(
    (m: any) => m.nombre.toLowerCase() === query.toLowerCase(),
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const seleccionar = (m: any) => {
    onChange({ id: m.id, nombre: m.nombre });
    setQuery(m.nombre);
    setOpen(false);
  };

  const crearNuevo = () => {
    onChange({ id: null, nombre: query.trim() });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Tratamiento / Medicamento *
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ id: null, nombre: e.target.value });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Busca o escribe un tratamiento nuevo..."
          className={`${inputClass} pl-9`}
        />
      </div>

      {value.nombre && (
        <p className="text-xs mt-1">
          {value.id !== null ? (
            <span className="text-green-600">✓ Seleccionado del catálogo</span>
          ) : (
            <span className="text-amber-600">
              ⚠ Se creará como nuevo: <strong>{value.nombre}</strong>
            </span>
          )}
        </p>
      )}

      {open && query.trim().length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {filtrados.map((m: any) => (
            <button
              key={m.id}
              type="button"
              onClick={() => seleccionar(m)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors"
            >
              <span className="font-medium text-gray-900">{m.nombre}</span>
              {m.concentracion && (
                <span className="text-gray-400 text-xs ml-2">
                  {m.concentracion}
                </span>
              )}
            </button>
          ))}
          {!exactMatch && query.trim().length >= 2 && (
            <button
              type="button"
              onClick={crearNuevo}
              className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 border-t border-gray-50 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear nuevo: <strong className="ml-1">"{query.trim()}"</strong>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Modal principal ───────────────────────────────────────────────────────────
export function NuevoTratamientoModal({ onClose, preselectedAnimalId }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"historial" | "tratamiento">("historial");
  const [historialId, setHistorialId] = useState<number | null>(null);

  const submittingRef = useRef(false);

  const [form, setForm] = useState({
    // Si se abre desde la ficha de un animal, viene ya seleccionado
    animalId: preselectedAnimalId != null ? String(preselectedAnimalId) : "",
    diagnostico: "",
    sintomas: "",
    peso: "",
    temperatura: "",
    observaciones: "",
  });

  const [tForm, setTForm] = useState({
    medicamento: { id: null as number | null, nombre: "" },
    dosis: "",
    frecuencia: "",
    viaAdministracion: "Oral",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    observaciones: "",
  });

  const { data: animales = [] } = useQuery({
    queryKey: ["animales-activos"],
    queryFn: () =>
      axiosClient
        .get("/animal")
        .then((r) => r.data.filter((a: any) => a.estadoGeneral === "Activo")),
  });

  // Paso 1 — registrar historial
  const mutHistorial = useMutation({
    mutationFn: () => {
      const pesoNum = parseFloat(form.peso);
      const tempNum = parseFloat(form.temperatura);
      return medicoApi.registrarHistorial({
        animalId: Number(form.animalId),
        diagnostico: form.diagnostico,
        sintomas: form.sintomas || undefined,
        peso: !isNaN(pesoNum) && pesoNum > 0 ? pesoNum : undefined,
        temperatura:
          !isNaN(tempNum) && tempNum >= 35 && tempNum <= 42
            ? tempNum
            : undefined,
        veterinarioId: user!.id,
        observaciones: form.observaciones || undefined,
      });
    },
    onSuccess: (data) => {
      submittingRef.current = false;
      setHistorialId(data.id);
      setStep("tratamiento");
      toast.success("Consulta registrada. Ahora añade el tratamiento.");
    },
    onError: (err: any) => {
      submittingRef.current = false;
      toast.error(
        err.response?.data?.mensaje ??
          err.response?.data?.error ??
          "Error al registrar consulta",
      );
    },
  });

  // Paso 2 — registrar tratamiento
  const mutTratamiento = useMutation({
    mutationFn: async () => {
      let medicamentoId = tForm.medicamento.id;
      if (medicamentoId === null) {
        const nuevo = await medicoApi.crearMedicamento(
          tForm.medicamento.nombre,
        );
        medicamentoId = nuevo.id;
        queryClient.invalidateQueries({ queryKey: ["medicamentos"] });
      }
      return medicoApi.registrarTratamiento({
        historialMedicoId: historialId!,
        medicamentoId,
        dosis: tForm.dosis,
        frecuencia: tForm.frecuencia,
        viaAdministracion: tForm.viaAdministracion,
        fechaInicio: tForm.fechaInicio,
        fechaFin: tForm.fechaFin,
        veterinarioId: user!.id,
        observaciones: tForm.observaciones || undefined,
      });
    },
    onSuccess: () => {
      submittingRef.current = false;
      toast.success("Tratamiento registrado correctamente");
      // refetchType: "all" fuerza refetch aunque el query no esté montado
      queryClient.invalidateQueries({
        queryKey: ["tratamientos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["animales"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["historial-completo"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
        refetchType: "all",
      });
      onClose();
    },
    onError: (err: any) => {
      submittingRef.current = false;
      toast.error(
        err.response?.data?.mensaje ??
          err.response?.data?.error ??
          "Error al registrar tratamiento",
      );
    },
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const pesoNum = parseFloat(form.peso);
  const tempNum = parseFloat(form.temperatura);
  const pesoError = form.peso !== "" && (isNaN(pesoNum) || pesoNum <= 0);
  const tempError =
    form.temperatura !== "" && (isNaN(tempNum) || tempNum < 35 || tempNum > 42);

  const step1Valid =
    form.animalId !== "" &&
    form.diagnostico.trim() !== "" &&
    !pesoError &&
    !tempError;
  const step2Valid =
    tForm.medicamento.nombre.trim().length >= 2 &&
    tForm.dosis.trim() !== "" &&
    tForm.frecuencia.trim() !== "" &&
    tForm.fechaFin !== "";

  // FIX: handler con protección anti-doble disparo
  const handleSiguiente = () => {
    if (submittingRef.current || mutHistorial.isPending) return;
    submittingRef.current = true;
    mutHistorial.mutate();
  };

  const handleRegistrar = () => {
    if (submittingRef.current || mutTratamiento.isPending) return;
    submittingRef.current = true;
    mutTratamiento.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay — NO cierra el modal para evitar clics accidentales durante el flujo */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Nuevo Tratamiento
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${step === "historial" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
              >
                1 · Consulta
              </span>
              <span className="text-gray-300 text-xs">→</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${step === "tratamiento" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
              >
                2 · Tratamiento
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {step === "historial" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Animal *
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Diagnóstico *
                </label>
                <input
                  value={form.diagnostico}
                  onChange={(e) => set("diagnostico", e.target.value)}
                  placeholder="Ej: Infección respiratoria"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Síntomas
                </label>
                <input
                  value={form.sintomas}
                  onChange={(e) => set("sintomas", e.target.value)}
                  placeholder="Ej: Tos, fiebre, decaimiento"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Peso (kg){" "}
                    <span className="text-gray-400 font-normal text-xs">
                      opcional
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={form.peso}
                    onChange={(e) => set("peso", e.target.value)}
                    placeholder="Ej: 4.5"
                    className={`${inputClass} ${pesoError ? "border-red-300" : ""}`}
                  />
                  {pesoError && (
                    <p className="text-xs text-red-500 mt-1">
                      Debe ser mayor a 0
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Temperatura °C{" "}
                    <span className="text-gray-400 font-normal text-xs">
                      35–42
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="35"
                    max="42"
                    value={form.temperatura}
                    onChange={(e) => set("temperatura", e.target.value)}
                    placeholder="Ej: 38.5"
                    className={`${inputClass} ${tempError ? "border-red-300" : ""}`}
                  />
                  {tempError && (
                    <p className="text-xs text-red-500 mt-1">Entre 35 y 42°C</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Observaciones
                </label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => set("observaciones", e.target.value)}
                  rows={2}
                  placeholder="Notas adicionales..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </>
          ) : (
            <>
              <MedicamentoSelector
                value={tForm.medicamento}
                onChange={(v) => setTForm((p) => ({ ...p, medicamento: v }))}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dosis *
                  </label>
                  <input
                    value={tForm.dosis}
                    onChange={(e) =>
                      setTForm((p) => ({ ...p, dosis: e.target.value }))
                    }
                    placeholder="Ej: 250mg / 2 sesiones"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vía
                  </label>
                  <select
                    value={tForm.viaAdministracion}
                    onChange={(e) =>
                      setTForm((p) => ({
                        ...p,
                        viaAdministracion: e.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="Oral">Oral</option>
                    <option value="Inyectable">Inyectable</option>
                    <option value="Tópico">Tópico</option>
                    <option value="Subcutánea">Subcutánea</option>
                    <option value="Intravenosa">Intravenosa</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Cirugía">Cirugía</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Frecuencia *
                </label>
                <input
                  value={tForm.frecuencia}
                  onChange={(e) =>
                    setTForm((p) => ({ ...p, frecuencia: e.target.value }))
                  }
                  placeholder="Ej: Cada 12 horas / 3 veces por semana"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fecha inicio *
                  </label>
                  <input
                    type="date"
                    value={tForm.fechaInicio}
                    onChange={(e) =>
                      setTForm((p) => ({ ...p, fechaInicio: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fecha fin *
                  </label>
                  <input
                    type="date"
                    value={tForm.fechaFin}
                    onChange={(e) =>
                      setTForm((p) => ({ ...p, fechaFin: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Observaciones
                </label>
                <textarea
                  value={tForm.observaciones}
                  onChange={(e) =>
                    setTForm((p) => ({ ...p, observaciones: e.target.value }))
                  }
                  rows={2}
                  placeholder="Notas adicionales..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={
              step === "historial" ? onClose : () => setStep("historial")
            }
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {step === "historial" ? "Cancelar" : "← Atrás"}
          </button>

          {step === "historial" ? (
            <button
              onClick={handleSiguiente}
              disabled={!step1Valid || mutHistorial.isPending}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {mutHistorial.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Siguiente →"
              )}
            </button>
          ) : (
            <button
              onClick={handleRegistrar}
              disabled={!step2Valid || mutTratamiento.isPending}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {mutTratamiento.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Registrar Tratamiento"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
