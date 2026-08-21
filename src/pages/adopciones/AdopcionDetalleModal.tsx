import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import { adopcionApi } from "../../api/adopcionesApi";
import { ESTADO_CONFIG } from "../../components/AdopcionConstants";
import type { Adopcion } from "../../types/index";

interface Props {
  adopcion: Adopcion;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-400 mb-0.5">{label}:</p>
      <p className="break-words text-sm font-medium text-gray-900 [overflow-wrap:anywhere]">
        {value || "—"}
      </p>
    </div>
  );
}

export function AdopcionDetalleModal({ adopcion, onClose }: Props) {
  const queryClient = useQueryClient();

  const { data: detalle, isLoading } = useQuery({
    queryKey: ["adopcion", adopcion.id],
    queryFn: () => adopcionApi.getById(adopcion.id),
  });

  const mutEstado = useMutation({
    mutationFn: (estado: string) =>
      adopcionApi.actualizarEstado(adopcion.id, estado),
    onSuccess: (_, estado) => {
      toast.success(`Adopción ${estado.toLowerCase()} correctamente`);
      queryClient.invalidateQueries({ queryKey: ["adopciones"] });
      queryClient.invalidateQueries({ queryKey: ["adopcion", adopcion.id] });
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as AxiosError<{ mensaje?: string }>;
      toast.error(
        error.response?.data?.mensaje ?? "Error al actualizar estado",
      );
    },
  });

  const d = detalle ?? adopcion;
  const esPendiente = d.estadoAdopcion === "Pendiente";
  const cfg = ESTADO_CONFIG[d.estadoAdopcion] ?? ESTADO_CONFIG["Pendiente"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="z-10 flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-7 sm:py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Detalles de Adopción
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar detalles de adopción"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : (
          <div className="space-y-6 p-5 sm:p-7">
            {/* Animal */}
            <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                🐾 Animal
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <Field label="Nombre" value={d.animal} />
                <Field label="Raza" value={d.raza} />
              </div>
            </div>

            {/* Adoptante */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                👤 Información del Adoptante
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
                <Field label="Nombre" value={d.nombreAdoptante} />
                <Field label="Documento" value={d.documentoIdentidad} />
                <Field label="Teléfono" value={d.telefonoAdoptante} />
                <Field label="Email" value={d.emailAdoptante} />
              </div>
              {d.direccionAdoptante && (
                <div className="mt-3">
                  <Field label="Dirección" value={d.direccionAdoptante} />
                </div>
              )}
            </div>

            {/* Adopción */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                📋 Información de Adopción
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Estado:</p>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <Field
                  label="Fecha de Adopción"
                  value={
                    d.fechaAdopcion
                      ? new Date(d.fechaAdopcion).toLocaleDateString("es-DO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : undefined
                  }
                />
                <Field label="Responsable" value={d.usuarioResponsable} />
              </div>
              {d.observaciones && (
                <div className="mt-3">
                  <Field label="Observaciones" value={d.observaciones} />
                </div>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:flex-row sm:px-7 sm:py-5">
          {esPendiente && (
            <>
              <button
                onClick={() => mutEstado.mutate("Aprobada")}
                disabled={mutEstado.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {mutEstado.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Aprobar
              </button>
              <button
                onClick={() => mutEstado.mutate("Rechazada")}
                disabled={mutEstado.isPending}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </button>
            </>
          )}
          {d.estadoAdopcion === "Aprobada" && (
            <button
              onClick={() => mutEstado.mutate("Devuelto")}
              disabled={mutEstado.isPending}
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              ↩ Marcar como Devuelto
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
