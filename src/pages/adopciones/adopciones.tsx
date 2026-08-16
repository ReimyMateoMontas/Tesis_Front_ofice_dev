import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { adopcionApi } from "../../api/adopcionesApi";
import { AdopcionFormModal } from "./AdopcionFormModal";
import { AdopcionDetalleModal } from "./AdopcionDetalleModal";
import { ESTADO_CONFIG } from "../../components/AdopcionConstants";
import { useAppSelector } from "../../hooks/hooks";
import { ActionButton } from "../../components/ActionButton";
import type { Adopcion } from "../../types/index";
import toast from "react-hot-toast";

export function Adopciones() {
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [preselectedAnimalId, setPreselectedAnimalId] = useState<number | undefined>();
  const [selected, setSelected] = useState<Adopcion | null>(null);

  const user = useAppSelector((s) => s.auth.user);
  const isAdmin = user?.rol === "Administrador";
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as any;
    if (state?.openAdopcion && state?.preselectedAnimalId) {
      setPreselectedAnimalId(state.preselectedAnimalId);
      setShowForm(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const { data: adopciones = [], isLoading } = useQuery<Adopcion[]>({
    queryKey: ["adopciones"],
    queryFn: adopcionApi.getAll,
  });

  const mutEstado = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: string }) =>
      adopcionApi.actualizarEstado(id, estado),
    onSuccess: (_, { estado }) => {
      toast.success(`Adopción ${estado.toLowerCase()} correctamente`);
      queryClient.invalidateQueries({ queryKey: ["adopciones"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.mensaje ?? "Error al actualizar estado");
    },
  });

  const filtered = adopciones.filter((a) => {
    const matchSearch =
      a.animal.toLowerCase().includes(search.toLowerCase()) ||
      a.nombreAdoptante.toLowerCase().includes(search.toLowerCase()) ||
      (a.emailAdoptante ?? "").toLowerCase().includes(search.toLowerCase());
    const matchEstado = estadoFiltro ? a.estadoAdopcion === estadoFiltro : true;
    return matchSearch && matchEstado;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0 flex-1 basis-full min-[560px]:basis-auto">
          <h2 className="text-xl font-semibold text-gray-900">
            Gestión de Adopciones
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {adopciones.length} solicitudes de adopción
          </p>
        </div>
        {isAdmin && (
          <ActionButton
            onClick={() => setShowForm(true)}
            className="w-full min-[560px]:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Registrar Adopción</span>
            <span className="sm:hidden">Registrar</span>
          </ActionButton>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por adoptante, animal o email..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-600"
        >
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Aprobada">Aprobada</option>
          <option value="Rechazada">Rechazada</option>
          <option value="Devuelto">Devuelto</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No se encontraron adopciones</p>
          </div>
        ) : (
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  "Animal",
                  "Adoptante",
                  "Contacto",
                  "Fecha Adopción",
                  "Estado",
                  "Acciones",
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
              {filtered.map((a) => {
                const cfg =
                  ESTADO_CONFIG[a.estadoAdopcion] ?? ESTADO_CONFIG["Pendiente"];
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    {/* Animal */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm"></span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {a.animal}
                          </p>
                          {a.raza && (
                            <p className="text-xs text-gray-400">{a.raza}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Adoptante */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 text-sm">👤</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {a.nombreAdoptante}
                          </p>
                          {a.documentoIdentidad && (
                            <p className="text-xs text-gray-400">
                              {a.documentoIdentidad}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        {a.telefonoAdoptante && (
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <span className="text-xs">📞</span>{" "}
                            {a.telefonoAdoptante}
                          </p>
                        )}
                        {a.emailAdoptante && (
                          <p className="text-sm text-gray-600 flex items-center gap-1.5">
                            <span className="text-xs">✉</span>{" "}
                            {a.emailAdoptante}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-600">
                        {a.fechaAdopcion
                          ? new Date(a.fechaAdopcion).toLocaleDateString(
                              "es-DO",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </p>
                    </td>

                    {/* Estado */}
                    <td className="px-5 py-4 min-w-[120px] whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none ${cfg.badge}`}
                      >
                        <span className="flex-shrink-0">{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 min-w-[112px] whitespace-nowrap">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {/* Ver detalle */}
                        <button
                          onClick={() => setSelected(a)}
                          title="Ver detalle"
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Aprobar (solo Pendiente) */}
                        {isAdmin && a.estadoAdopcion === "Pendiente" && (
                          <button
                            onClick={() =>
                              mutEstado.mutate({ id: a.id, estado: "Aprobada" })
                            }
                            title="Aprobar"
                            className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Rechazar (solo Pendiente) */}
                        {isAdmin && a.estadoAdopcion === "Pendiente" && (
                          <button
                            onClick={() =>
                              mutEstado.mutate({
                                id: a.id,
                                estado: "Rechazada",
                              })
                            }
                            title="Rechazar"
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Devolver (solo Aprobada) */}
                        {isAdmin && a.estadoAdopcion === "Aprobada" && (
                          <button
                            onClick={() =>
                              mutEstado.mutate({ id: a.id, estado: "Devuelto" })
                            }
                            title="Marcar como devuelto"
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modales */}
      {showForm && (
        <AdopcionFormModal
          preselectedAnimalId={preselectedAnimalId}
          onClose={() => {
            setShowForm(false);
            setPreselectedAnimalId(undefined);
          }}
        />
      )}
      {selected && (
        <AdopcionDetalleModal
          adopcion={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
