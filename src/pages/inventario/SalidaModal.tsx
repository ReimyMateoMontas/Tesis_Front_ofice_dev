import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, ArrowDownLeft } from "lucide-react";
import toast from "react-hot-toast";
import { inventarioApi } from "../../api/inventarioApi";
import { useAppSelector } from "../../hooks/hooks";
import type { Alimento } from "../../types/index";

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

const MOTIVOS = [
  "Consumo diario",
  "Donación",
  "Vencimiento",
  "Pérdida",
  "Transferencia",
  "Otro",
];

interface Props {
  alimentos: Alimento[];
  onClose: () => void;
}

export function SalidaModal({ alimentos, onClose }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    alimentoId: "",
    cantidad: "",
    motivo: "Consumo diario",
    observaciones: "",
  });

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const selectedAlimento = alimentos.find(
    (a) => a.id === Number(form.alimentoId),
  );
  const nuevaCantidad = selectedAlimento
    ? selectedAlimento.cantidadDisponible - Number(form.cantidad)
    : null;
  const sobreStock = nuevaCantidad !== null && nuevaCantidad < 0;

  const mutation = useMutation({
    mutationFn: () =>
      inventarioApi.registrarSalida(Number(form.alimentoId), {
        cantidad: Number(form.cantidad),
        motivo: form.motivo,
        observaciones: form.observaciones || undefined,
        usuarioResponsableId: user!.id,
      }),
    onSuccess: () => {
      toast.success("Salida registrada correctamente");
      queryClient.invalidateQueries({ queryKey: ["inventario"] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al registrar salida"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Registrar Salida
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Producto *
            </label>
            <select
              value={form.alimentoId}
              onChange={(e) => set("alimentoId", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecciona un producto</option>
              {alimentos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} — {a.cantidadDisponible} {a.unidadMedida}{" "}
                  disponibles
                </option>
              ))}
            </select>
          </div>

          {selectedAlimento && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <span className="text-gray-500">Stock actual: </span>
              <span className="font-bold">
                {selectedAlimento.cantidadDisponible}{" "}
                {selectedAlimento.unidadMedida}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cantidad *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.cantidad}
                onChange={(e) => set("cantidad", e.target.value)}
                placeholder="Ej: 10"
                className={`${inputClass} ${sobreStock ? "border-red-300" : ""}`}
              />
              {sobreStock && (
                <p className="text-xs text-red-500 mt-1">
                  Excede el stock disponible
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Motivo *
              </label>
              <select
                value={form.motivo}
                onChange={(e) => set("motivo", e.target.value)}
                className={inputClass}
              >
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedAlimento && form.cantidad && !sobreStock && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-sm">
              <span className="text-gray-500">Stock resultante: </span>
              <span
                className={`font-bold ${nuevaCantidad! <= selectedAlimento.stockMinimo ? "text-red-600" : "text-orange-600"}`}
              >
                {nuevaCantidad!.toFixed(1)} {selectedAlimento.unidadMedida}
              </span>
              {nuevaCantidad! <= selectedAlimento.stockMinimo && (
                <span className="ml-2 text-red-500 text-xs">
                  ⚠ Por debajo del mínimo
                </span>
              )}
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
              placeholder="Notas..."
            />
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              !form.alimentoId ||
              !form.cantidad ||
              sobreStock ||
              mutation.isPending
            }
            className="flex-1 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Registrar Salida"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
