import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Heart,
  DollarSign,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Target,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { donacionApi } from "../../api/donacionApi";
import { useAppSelector } from "../../hooks/hooks";
import type { Donacion, Objetivo } from "../../types/index";

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

const ESTADO_OBJETIVO: Record<
  string,
  { label: string; badge: string; bar: string }
> = {
  Activo: {
    label: "Activo",
    badge: "bg-blue-100 text-blue-700",
    bar: "bg-blue-500",
  },
  Completado: {
    label: "Completado",
    badge: "bg-green-100 text-green-700",
    bar: "bg-green-500",
  },
  Pausado: {
    label: "Pausado",
    badge: "bg-gray-100 text-gray-600",
    bar: "bg-gray-400",
  },
};

// ── Modal registrar donación ──────────────────────────────────────────────────
function RegistrarDonacionModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    tipoDonacionId: "",
    fechaDonacion: new Date().toISOString().split("T")[0],
    donanteId: "",
    nombreDonante: "",
    emailDonante: "",
    telefonoDonante: "",
    montoDinero: "",
    valorEstimado: "",
    cantidadArticulos: "",
    descripcionDonacion: "",
    formaPago: "Efectivo",
    numeroTransaccion: "",
    objetivoId: "",
    observaciones: "",
    esNuevoDonante: false,
  });

  const { data: tipos = [] } = useQuery({
    queryKey: ["tipos-donacion"],
    queryFn: donacionApi.getTipos,
  });
  const { data: donantes = [] } = useQuery({
    queryKey: ["donantes"],
    queryFn: donacionApi.getDonantes,
  });
  const { data: objetivos = [] } = useQuery<Objetivo[]>({
    queryKey: ["objetivos"],
    queryFn: donacionApi.getObjetivos,
  });

  const tipoSeleccionado = tipos.find(
    (t: any) => t.id === Number(form.tipoDonacionId),
  );
  const esDinero = tipoSeleccionado?.nombre === "Dinero";
  const set = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      donacionApi.registrar({
        tipoDonacionId: Number(form.tipoDonacionId),
        fechaDonacion: form.fechaDonacion,
        donanteId:
          !form.esNuevoDonante && form.donanteId
            ? Number(form.donanteId)
            : undefined,
        nombreDonante:
          form.esNuevoDonante && form.nombreDonante
            ? form.nombreDonante
            : undefined,
        emailDonante: form.esNuevoDonante
          ? form.emailDonante || undefined
          : undefined,
        telefonoDonante: form.esNuevoDonante
          ? form.telefonoDonante || undefined
          : undefined,
        montoDinero: form.montoDinero ? Number(form.montoDinero) : undefined,
        valorEstimado: form.valorEstimado
          ? Number(form.valorEstimado)
          : undefined,
        cantidadArticulos: form.cantidadArticulos
          ? Number(form.cantidadArticulos)
          : undefined,
        descripcionDonacion: form.descripcionDonacion || undefined,
        formaPago: esDinero ? form.formaPago : undefined,
        numeroTransaccion: form.numeroTransaccion || undefined,
        objetivoId:
          esDinero && form.objetivoId ? Number(form.objetivoId) : undefined,
        observaciones: form.observaciones || undefined,
      }),
    onSuccess: () => {
      toast.success("Donación registrada correctamente");
      queryClient.invalidateQueries({
        queryKey: ["donaciones"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["objetivos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["resumen-donacion"],
        refetchType: "all",
      });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al registrar"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Registrar Donación
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Tipo de donación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de donación *
            </label>
            <select
              value={form.tipoDonacionId}
              onChange={(e) => set("tipoDonacionId", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona el tipo</option>
              {tipos.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Fecha *
            </label>
            <input
              type="date"
              value={form.fechaDonacion}
              onChange={(e) => set("fechaDonacion", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Donante */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Donante
              </label>
              <button
                type="button"
                onClick={() => set("esNuevoDonante", !form.esNuevoDonante)}
                className="text-xs text-green-600 hover:underline"
              >
                {form.esNuevoDonante
                  ? "← Seleccionar existente"
                  : "+ Nuevo donante"}
              </button>
            </div>
            {form.esNuevoDonante ? (
              <div className="space-y-3">
                <input
                  value={form.nombreDonante}
                  onChange={(e) => set("nombreDonante", e.target.value)}
                  placeholder="Nombre del donante"
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.emailDonante}
                    onChange={(e) => set("emailDonante", e.target.value)}
                    placeholder="Email (opcional)"
                    className={inputClass}
                  />
                  <input
                    value={form.telefonoDonante}
                    onChange={(e) => set("telefonoDonante", e.target.value)}
                    placeholder="Teléfono (opcional)"
                    className={inputClass}
                  />
                </div>
              </div>
            ) : (
              <select
                value={form.donanteId}
                onChange={(e) => set("donanteId", e.target.value)}
                className={inputClass}
              >
                <option value="">Anónimo</option>
                {donantes.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Monto / Valor */}
          {esDinero ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Monto (RD$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.montoDinero}
                    onChange={(e) => set("montoDinero", e.target.value)}
                    placeholder="Ej: 5000"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Forma de pago
                  </label>
                  <select
                    value={form.formaPago}
                    onChange={(e) => set("formaPago", e.target.value)}
                    className={inputClass}
                  >
                    {["Efectivo", "Transferencia", "Tarjeta", "Cheque"].map(
                      (f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  N° Transacción
                </label>
                <input
                  value={form.numeroTransaccion}
                  onChange={(e) => set("numeroTransaccion", e.target.value)}
                  placeholder="Opcional"
                  className={inputClass}
                />
              </div>
              {/* Asignar a objetivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asignar a objetivo{" "}
                  <span className="text-gray-400 font-normal text-xs">
                    opcional
                  </span>
                </label>
                <select
                  value={form.objetivoId}
                  onChange={(e) => set("objetivoId", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sin objetivo específico</option>
                  {(objetivos as Objetivo[])
                    .filter((o) => o.estado === "Activo")
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre} — {Math.round(o.progreso)}% completado
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Valor estimado (RD$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valorEstimado}
                  onChange={(e) => set("valorEstimado", e.target.value)}
                  placeholder="Ej: 2000"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cantidad de artículos
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.cantidadArticulos}
                  onChange={(e) => set("cantidadArticulos", e.target.value)}
                  placeholder="Ej: 10"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              value={form.descripcionDonacion}
              onChange={(e) => set("descripcionDonacion", e.target.value)}
              rows={2}
              placeholder="Describe la donación..."
              className={`${inputClass} resize-none`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.tipoDonacionId || mutation.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Registrar Donación"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal crear/editar objetivo ───────────────────────────────────────────────
function ObjetivoModal({
  objetivo,
  onClose,
}: {
  objetivo?: Objetivo;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nombre: objetivo?.nombre ?? "",
    descripcion: objetivo?.descripcion ?? "",
    montoObjetivo: objetivo?.montoObjetivo
      ? String(objetivo.montoObjetivo)
      : "",
    fechaLimite: objetivo?.fechaLimite ?? "",
    estado: objetivo?.estado ?? "Activo",
    observaciones: objetivo?.observaciones ?? "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      objetivo
        ? donacionApi.editarObjetivo(objetivo.id, {
            nombre: form.nombre || undefined,
            descripcion: form.descripcion || undefined,
            montoObjetivo: form.montoObjetivo
              ? Number(form.montoObjetivo)
              : undefined,
            fechaLimite: form.fechaLimite || undefined,
            estado: form.estado,
            observaciones: form.observaciones || undefined,
          })
        : donacionApi.crearObjetivo({
            nombre: form.nombre,
            descripcion: form.descripcion || undefined,
            montoObjetivo: Number(form.montoObjetivo),
            fechaLimite: form.fechaLimite || undefined,
            observaciones: form.observaciones || undefined,
          }),
    onSuccess: () => {
      toast.success(objetivo ? "Objetivo actualizado" : "Objetivo creado");
      queryClient.invalidateQueries({
        queryKey: ["objetivos"],
        refetchType: "all",
      });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.mensaje ?? "Error"),
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {objetivo ? "Editar Objetivo" : "Nuevo Objetivo"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre *
            </label>
            <input
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Construcción área para gatos"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => set("descripcion", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Describe el objetivo..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Monto objetivo (RD$) *
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.montoObjetivo}
                onChange={(e) => set("montoObjetivo", e.target.value)}
                placeholder="Ej: 50000"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha límite
              </label>
              <input
                type="date"
                value={form.fechaLimite}
                onChange={(e) => set("fechaLimite", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {objetivo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Estado
              </label>
              <select
                value={form.estado}
                onChange={(e) => set("estado", e.target.value)}
                className={inputClass}
              >
                <option value="Activo">Activo</option>
                <option value="Pausado">Pausado</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observaciones
            </label>
            <textarea
              value={form.observaciones}
              onChange={(e) => set("observaciones", e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.nombre || !form.montoObjetivo || mutation.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: Aportar a un objetivo ─────────────────────────────────────────────
function AportarObjetivoModal({
  objetivo,
  onClose,
}: {
  objetivo: Objetivo;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    monto: "",
    formaPago: "Efectivo",
    numeroTransaccion: "",
    nombreDonante: "",
    observaciones: "",
  });

  const { data: tipos = [] } = useQuery({
    queryKey: ["tipos-donacion"],
    queryFn: donacionApi.getTipos,
  });
  const tipoDineroId = (tipos as any[]).find((t) => t.nombre === "Dinero")?.id;

  const falta = objetivo.montoObjetivo - objetivo.montoRecaudado;

  const mutation = useMutation({
    mutationFn: () =>
      donacionApi.registrar({
        tipoDonacionId: tipoDineroId,
        fechaDonacion: new Date().toISOString().split("T")[0],
        nombreDonante: form.nombreDonante || undefined,
        montoDinero: Number(form.monto),
        formaPago: form.formaPago,
        numeroTransaccion: form.numeroTransaccion || undefined,
        objetivoId: objetivo.id,
        observaciones: form.observaciones || undefined,
      }),
    onSuccess: () => {
      toast.success("Aporte registrado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["donaciones"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["objetivos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["resumen-donacion"],
        refetchType: "all",
      });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al registrar aporte"),
  });

  const monto = Number(form.monto);
  const nuevoTotal = objetivo.montoRecaudado + monto;
  const nuevoPct =
    objetivo.montoObjetivo > 0
      ? Math.min(100, Math.round((nuevoTotal / objetivo.montoObjetivo) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Aportar al Objetivo
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
              {objetivo.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Progreso actual */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progreso actual</span>
              <span className="font-semibold">
                {Math.round(objetivo.progreso)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, objetivo.progreso)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600 font-medium">
                ${objetivo.montoRecaudado.toLocaleString("es-DO")} recaudado
              </span>
              <span className="text-gray-500">
                Falta: ${falta.toLocaleString("es-DO")}
              </span>
            </div>
          </div>

          {/* Monto del aporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Monto del aporte (RD$) *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.monto}
              onChange={(e) =>
                setForm((p) => ({ ...p, monto: e.target.value }))
              }
              placeholder="Ej: 5000"
              className={inputClass}
            />
            {/* Preview del progreso con el nuevo aporte */}
            {monto > 0 && (
              <div className="mt-2 space-y-1">
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-all"
                    style={{ width: `${nuevoPct}%` }}
                  />
                </div>
                <p className="text-xs text-green-600">
                  Con este aporte el objetivo llegaría al{" "}
                  <strong>{nuevoPct}%</strong>
                  {nuevoTotal >= objetivo.montoObjetivo &&
                    " 🎉 ¡Objetivo completado!"}
                </p>
              </div>
            )}
          </div>

          {/* Forma de pago */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Forma de pago
              </label>
              <select
                value={form.formaPago}
                onChange={(e) =>
                  setForm((p) => ({ ...p, formaPago: e.target.value }))
                }
                className={inputClass}
              >
                {["Efectivo", "Transferencia", "Tarjeta", "Cheque"].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                N° Transacción
              </label>
              <input
                value={form.numeroTransaccion}
                onChange={(e) =>
                  setForm((p) => ({ ...p, numeroTransaccion: e.target.value }))
                }
                placeholder="Opcional"
                className={inputClass}
              />
            </div>
          </div>

          {/* Donante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre del donante{" "}
              <span className="text-gray-400 font-normal text-xs">
                opcional
              </span>
            </label>
            <input
              value={form.nombreDonante}
              onChange={(e) =>
                setForm((p) => ({ ...p, nombreDonante: e.target.value }))
              }
              placeholder="Anónimo si se deja vacío"
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
              onChange={(e) =>
                setForm((p) => ({ ...p, observaciones: e.target.value }))
              }
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              !form.monto || monto <= 0 || !tipoDineroId || mutation.isPending
            }
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Confirmar Aporte"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export function Donaciones() {
  const [tab, setTab] = useState<"donaciones" | "objetivos">("donaciones");
  const [showDonacion, setShowDonacion] = useState(false);
  const [showObjetivo, setShowObjetivo] = useState(false);
  const [editarObjetivo, setEditarObjetivo] = useState<Objetivo | null>(null);
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<number | null>(
    null,
  );
  const [aportarObjetivo, setAportarObjetivo] = useState<Objetivo | null>(null);

  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.rol === "Administrador";
  const queryClient = useQueryClient();

  const { data: donaciones = [], isLoading: loadingD } = useQuery<Donacion[]>({
    queryKey: ["donaciones"],
    queryFn: donacionApi.getAll,
  });
  const { data: resumen } = useQuery({
    queryKey: ["resumen-donacion"],
    queryFn: donacionApi.getResumen,
  });
  const { data: objetivos = [], isLoading: loadingO } = useQuery<Objetivo[]>({
    queryKey: ["objetivos"],
    queryFn: donacionApi.getObjetivos,
  });

  const mutEliminarDon = useMutation({
    mutationFn: (id: number) => donacionApi.eliminar(id),
    onSuccess: () => {
      toast.success("Donación eliminada");
      queryClient.invalidateQueries({
        queryKey: ["donaciones"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["objetivos"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["resumen-donacion"],
        refetchType: "all",
      });
      setConfirmarEliminarId(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al eliminar"),
  });

  const mutEliminarObj = useMutation({
    mutationFn: (id: number) => donacionApi.eliminarObjetivo(id),
    onSuccess: () => {
      toast.success("Objetivo eliminado");
      queryClient.invalidateQueries({
        queryKey: ["objetivos"],
        refetchType: "all",
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.mensaje ?? "Error"),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Donaciones y Objetivos
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Control de aportes y metas del refugio
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && tab === "objetivos" && (
            <button
              onClick={() => setShowObjetivo(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Target className="w-4 h-4" />
              Nuevo Objetivo
            </button>
          )}
          <button
            onClick={() => setShowDonacion(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Donación
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Recaudado</p>
            <p className="text-2xl font-bold text-gray-900">
              ${(resumen?.totalDinero ?? 0).toLocaleString("es-DO")}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              En donaciones de dinero
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Donaciones Monetarias</p>
            <p className="text-2xl font-bold text-gray-900">
              {donaciones.filter((d) => d.esMonetaria).length}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Transacciones registradas
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Donaciones</p>
            <p className="text-2xl font-bold text-gray-900">
              {resumen?.totalDonaciones ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">Todas las registradas</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 w-fit mb-5">
        <button
          onClick={() => setTab("donaciones")}
          className={`px-5 py-2 text-sm font-medium rounded-xl transition-colors ${tab === "donaciones" ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"}`}
        >
          Donaciones ({donaciones.length})
        </button>
        <button
          onClick={() => setTab("objetivos")}
          className={`px-5 py-2 text-sm font-medium rounded-xl transition-colors ${tab === "objetivos" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
        >
          Objetivos ({objetivos.length})
        </button>
      </div>

      {/* Tab donaciones */}
      {tab === "donaciones" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          {loadingD ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : donaciones.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Sin donaciones registradas</p>
            </div>
          ) : (
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-50">
                  {[
                    "Fecha",
                    "Tipo",
                    "Donante",
                    "Descripción",
                    "Valor",
                    "Objetivo",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {donaciones.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {new Date(d.fechaDonacion).toLocaleDateString("es-DO")}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${d.esMonetaria ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {d.tipoDonacion}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-900">
                      {d.donante}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {d.descripcionDonacion ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {d.esMonetaria
                        ? `$${d.montoDinero?.toLocaleString("es-DO")}`
                        : d.valorEstimado
                          ? `~$${d.valorEstimado.toLocaleString("es-DO")}`
                          : "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500">
                      {d.objetivo ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      {isAdmin && (
                        <button
                          onClick={() => setConfirmarEliminarId(d.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab objetivos */}
      {tab === "objetivos" && (
        <div>
          {loadingO ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : objetivos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">Sin objetivos creados</p>
              {isAdmin && (
                <button
                  onClick={() => setShowObjetivo(true)}
                  className="mt-3 text-sm text-green-600 hover:underline"
                >
                  Crear primer objetivo →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {objetivos.map((o) => {
                const cfg =
                  ESTADO_OBJETIVO[o.estado] ?? ESTADO_OBJETIVO["Activo"];
                const pct = Math.min(100, o.progreso);
                const diasRestantes = o.fechaLimite
                  ? Math.ceil(
                      (new Date(o.fechaLimite).getTime() - Date.now()) /
                        86400000,
                    )
                  : null;

                return (
                  <div
                    key={o.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {o.nombre}
                        </h3>
                        {o.descripcion && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {o.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-2">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}
                        >
                          {cfg.label}
                        </span>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditarObjetivo(o)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs"
                            >
                              ✏
                            </button>
                            <button
                              onClick={() => mutEliminarObj.mutate(o.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-500">Progreso</span>
                        <span className="font-semibold text-gray-900">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${cfg.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Montos */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Recaudado</p>
                        <p className="font-bold text-green-600">
                          ${o.montoRecaudado.toLocaleString("es-DO")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Objetivo</p>
                        <p className="font-bold text-gray-900">
                          ${o.montoObjetivo.toLocaleString("es-DO")}
                        </p>
                      </div>
                    </div>

                    {/* Footer tarjeta */}
                    <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>
                          {o.totalDonaciones} donación
                          {o.totalDonaciones !== 1 ? "es" : ""}
                        </span>
                        {diasRestantes !== null && (
                          <span
                            className={
                              diasRestantes < 0
                                ? "text-red-500"
                                : diasRestantes <= 7
                                  ? "text-amber-500"
                                  : ""
                            }
                          >
                            {diasRestantes < 0
                              ? "Vencido"
                              : `${diasRestantes}d restantes`}
                          </span>
                        )}
                      </div>
                      {o.estado === "Activo" && (
                        <button
                          onClick={() => setAportarObjetivo(o)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Aportar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modales */}
      {showDonacion && (
        <RegistrarDonacionModal onClose={() => setShowDonacion(false)} />
      )}
      {(showObjetivo || editarObjetivo) && (
        <ObjetivoModal
          objetivo={editarObjetivo ?? undefined}
          onClose={() => {
            setShowObjetivo(false);
            setEditarObjetivo(null);
          }}
        />
      )}

      {aportarObjetivo && (
        <AportarObjetivoModal
          objetivo={aportarObjetivo}
          onClose={() => setAportarObjetivo(null)}
        />
      )}

      {/* Confirmar eliminar donación */}
      {confirmarEliminarId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmarEliminarId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Eliminar Donación</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              ¿Estás seguro? Si esta donación estaba asignada a un objetivo, se
              descontará del monto recaudado.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarEliminarId(null)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => mutEliminarDon.mutate(confirmarEliminarId)}
                disabled={mutEliminarDon.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl flex items-center justify-center gap-2"
              >
                {mutEliminarDon.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
