import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconX,
  IconLoader2,
  IconAlertTriangle,
  IconShield,
  IconStethoscope,
  IconUser,
  IconSend,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { axiosClient } from "../../../api/axiosClient";
import { useAppSelector } from "../../../hooks/hooks";

const inputClass =
  "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white";

const ROL_CONFIG: Record<
  string,
  { label: string; badge: string; avatar: string; icon: React.ReactNode }
> = {
  Administrador: {
    label: "Administrador",
    badge: "bg-purple-100 text-purple-700",
    avatar: "bg-purple-500",
    icon: <IconShield size={16} stroke={1.8} />,
  },
  Veterinario: {
    label: "Veterinario",
    badge: "bg-blue-100 text-blue-700",
    avatar: "bg-blue-500",
    icon: <IconStethoscope size={16} stroke={1.8} />,
  },
  Trabajador: {
    label: "Trabajador",
    badge: "bg-green-100 text-green-700",
    avatar: "bg-green-500",
    icon: <IconUser size={16} stroke={1.8} />,
  },
};

interface UsuarioData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  activo?: boolean;
  emailVerificado?: boolean;
  fotoPerfilUrl?: string;
  fechaCreacion?: string;
}

// ── Avatar con fallback robusto ───────────────────────────────────────────────
function Avatar({
  src,
  nombre,
  className,
  avatarBg,
}: {
  src?: string;
  nombre: string;
  className?: string;
  avatarBg?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const tieneImg = !!src && !imgError;

  return (
    <div className={className}>
      {tieneImg ? (
        <img
          src={src}
          alt={nombre}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center
          ${avatarBg ?? "bg-gradient-to-br from-green-500 to-emerald-600"}
          text-white font-bold`}
        >
          {nombre.charAt(0).toUpperCase() || "?"}
        </div>
      )}
    </div>
  );
}

// ── Modal confirmar desactivar ────────────────────────────────────────────────
function ConfirmarEliminarModal({
  usuario,
  onClose,
  onConfirm,
  isPending,
}: {
  usuario: UsuarioData;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-red-100 bg-red-50 rounded-t-2xl">
          <IconAlertTriangle
            size={20}
            stroke={1.8}
            className="text-red-500 flex-shrink-0"
          />
          <h3 className="font-semibold text-red-700">Desactivar Usuario</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-700">
            ¿Estás seguro de desactivar a{" "}
            <strong>
              {usuario.nombre} {usuario.apellido}
            </strong>
            ?
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 mt-3">
            <p className="text-xs text-gray-500">{usuario.email}</p>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${ROL_CONFIG[usuario.rol]?.badge ?? "bg-gray-100 text-gray-600"}`}
            >
              {usuario.rol}
            </span>
          </div>
          <p className="text-xs text-amber-600 mt-3">
            El usuario quedará inactivo y no podrá iniciar sesión. Sus registros
            se conservan.
          </p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <IconLoader2 size={16} className="animate-spin" />
                Desactivando...
              </>
            ) : (
              "Desactivar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal crear / editar usuario ──────────────────────────────────────────────
function UsuarioModal({
  usuario,
  onClose,
}: {
  usuario?: UsuarioData;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? "",
    apellido: usuario?.apellido ?? "",
    email: usuario?.email ?? "",
    rol: usuario?.rol ?? "Trabajador",
    password: "",
    activo: usuario?.activo ?? true,
    fotoPerfilUrl: usuario?.fotoPerfilUrl ?? "",
  });

  const set = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));

  const mutation = useMutation({
    mutationFn: () =>
      usuario
        ? axiosClient
            .put(`/auth/${usuario.id}`, {
              nombre: form.nombre || undefined,
              apellido: form.apellido || undefined,
              email: form.email || undefined,
              rol: form.rol || undefined,
              password: form.password || undefined,
              activo: form.activo,
              fotoPerfilUrl: form.fotoPerfilUrl || undefined,
            })
            .then((r) => r.data)
        : axiosClient
            .post("/auth/Registro", {
              nombre: form.nombre,
              apellido: form.apellido,
              email: form.email,
              rol: form.rol,
              fotoPerfilUrl: form.fotoPerfilUrl || undefined,
              // sin password — el usuario lo crea al activar su cuenta
            })
            .then((r) => r.data),
    onSuccess: () => {
      toast.success(
        usuario
          ? "Usuario actualizado"
          : "Usuario creado. Se envió email de activación.",
      );
      queryClient.invalidateQueries({
        queryKey: ["usuarios"],
        refetchType: "all",
      });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al guardar usuario"),
  });

  const canSubmit = !!(form.nombre && form.apellido && form.email);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-900">
            {usuario ? "Editar Usuario" : "Nuevo Usuario"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <IconX size={20} stroke={1.8} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre *
              </label>
              <input
                value={form.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                placeholder="Ej: Juan"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Apellido *
              </label>
              <input
                value={form.apellido}
                onChange={(e) => set("apellido", e.target.value)}
                placeholder="Ej: Pérez"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="correo@ejemplo.com"
              className={inputClass}
            />
          </div>

          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Foto de perfil{" "}
              <span className="text-gray-400 font-normal text-xs">
                opcional
              </span>
            </label>

            {/* Preview rectangular cuando hay imagen */}
            {form.fotoPerfilUrl ? (
              <div className="mb-3 rounded-xl overflow-hidden h-36 bg-gray-100 relative">
                <img
                  src={form.fotoPerfilUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => set("fotoPerfilUrl", "")}
                />
                <button
                  type="button"
                  onClick={() => {
                    set("fotoPerfilUrl", "");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                >
                  <IconX size={14} />
                </button>
              </div>
            ) : (
              /* Zona de carga — sin imagen */
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center
                  cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors mb-3"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <IconUser size={22} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">
                  Haz clic para subir una foto
                </p>
                <p className="text-xs text-gray-300 mt-0.5">
                  PNG, JPG — máx 800KB
                </p>
              </div>
            )}

            {/* Input file oculto */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) {
                  toast.error("El archivo debe ser una imagen");
                  return;
                }
                if (file.size > 800 * 1024) {
                  toast.error(
                    "Máximo 800KB. Usa una URL para fotos más grandes.",
                  );
                  return;
                }
                const reader = new FileReader();
                reader.onloadend = () =>
                  set("fotoPerfilUrl", reader.result as string);
                reader.readAsDataURL(file);
                e.target.value = "";
              }}
            />

            {/* URL manual */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">o pegar URL</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <input
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={form.fotoPerfilUrl}
              onChange={(e) => set("fotoPerfilUrl", e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg"
              className={inputClass}
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rol *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Administrador", "Veterinario", "Trabajador"] as const).map(
                (rol) => {
                  const cfg = ROL_CONFIG[rol];
                  return (
                    <button
                      key={rol}
                      type="button"
                      onClick={() => set("rol", rol)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all text-xs font-medium ${
                        form.rol === rol
                          ? "border-green-400 bg-green-50 text-green-700"
                          : "border-gray-100 hover:border-gray-200 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          form.rol === rol
                            ? cfg.avatar + " text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {cfg.icon}
                      </span>
                      {cfg.label}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          {/* Contraseña — solo al editar */}
          {usuario ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña{" "}
                <span className="text-gray-400 font-normal text-xs">
                  dejar vacío para no cambiar
                </span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Nueva contraseña (opcional)"
                className={inputClass}
              />
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700 font-medium">
                Email de activación
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                El usuario recibirá un correo para activar su cuenta y crear su
                propia contraseña.
              </p>
            </div>
          )}

          {usuario && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => set("activo", e.target.checked)}
                className="w-4 h-4 accent-green-600"
              />
              <span className="text-sm text-gray-700">Usuario activo</span>
            </label>
          )}
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
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-xl flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <IconLoader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : usuario ? (
              "Guardar Cambios"
            ) : (
              "Crear Usuario"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export function Usuarios() {
  const user = useAppSelector((s) => s.auth.user);
  const queryClient = useQueryClient();
  const [showNuevo, setShowNuevo] = useState(false);
  const [editando, setEditando] = useState<UsuarioData | null>(null);
  const [eliminando, setEliminando] = useState<UsuarioData | null>(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const { data: usuarios = [], isLoading } = useQuery<UsuarioData[]>({
    queryKey: ["usuarios"],
    queryFn: () => axiosClient.get("/auth/usuarios").then((r) => r.data),
  });

  const mutDesactivar = useMutation({
    mutationFn: (id: number) =>
      axiosClient.delete(`/auth/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success("Usuario desactivado correctamente");
      queryClient.invalidateQueries({
        queryKey: ["usuarios"],
        refetchType: "all",
      });
      setEliminando(null);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al desactivar"),
  });

  const mutReactivar = useMutation({
    mutationFn: (id: number) =>
      axiosClient.put(`/auth/${id}`, { activo: true }).then((r) => r.data),
    onSuccess: () => {
      toast.success("Usuario reactivado");
      queryClient.invalidateQueries({
        queryKey: ["usuarios"],
        refetchType: "all",
      });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al reactivar"),
  });

  const mutReenviar = useMutation({
    mutationFn: (id: number) =>
      axiosClient.post(`/auth/reenviar-activacion/${id}`).then((r) => r.data),
    onSuccess: () => toast.success("Email de activación reenviado"),
    onError: (err: any) =>
      toast.error(err.response?.data?.mensaje ?? "Error al reenviar"),
  });

  const activos = usuarios.filter((u) => u.activo !== false);
  const inactivos = usuarios.filter((u) => u.activo === false);
  const visibles = mostrarInactivos ? usuarios : activos;
  const porRol = (rol: string) => visibles.filter((u) => u.rol === rol);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {activos.length} usuario{activos.length !== 1 ? "s" : ""} activo
            {activos.length !== 1 ? "s" : ""}
            {inactivos.length > 0 &&
              ` · ${inactivos.length} inactivo${inactivos.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {inactivos.length > 0 && (
            <button
              onClick={() => setMostrarInactivos((p) => !p)}
              className={`text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${
                mostrarInactivos
                  ? "bg-gray-100 text-gray-700 border-gray-200"
                  : "text-gray-400 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {mostrarInactivos
                ? "Ocultar inactivos"
                : `Mostrar inactivos (${inactivos.length})`}
            </button>
          )}
          <button
            onClick={() => setShowNuevo(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <IconPlus size={16} stroke={2} />
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {(["Administrador", "Veterinario", "Trabajador"] as const).map(
            (rol) => {
              const grupo = porRol(rol);
              if (grupo.length === 0) return null;
              const cfg = ROL_CONFIG[rol];
              return (
                <div key={rol}>
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-7 h-7 rounded-lg ${cfg.avatar} text-white flex items-center justify-center`}
                    >
                      {cfg.icon}
                    </div>
                    <h3 className="font-semibold text-gray-700 text-sm">
                      {cfg.label}s
                    </h3>
                    <span className="text-xs text-gray-400">
                      ({grupo.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grupo.map((u) => {
                      const esInactivo = u.activo === false;
                      return (
                        <div
                          key={u.id}
                          className={`bg-white rounded-2xl border p-5 transition-all ${
                            esInactivo
                              ? "border-gray-100 opacity-60"
                              : "border-gray-100"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <Avatar
                                src={u.fotoPerfilUrl}
                                nombre={u.nombre}
                                className={`w-11 h-11 rounded-full flex-shrink-0 overflow-hidden border-2 border-white shadow-sm text-sm ${esInactivo ? "opacity-50" : ""}`}
                                avatarBg={
                                  esInactivo ? "bg-gray-300" : cfg.avatar
                                }
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">
                                  {u.nombre} {u.apellido}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap ${
                                  esInactivo
                                    ? "bg-gray-100 text-gray-400"
                                    : cfg.badge
                                }`}
                              >
                                {esInactivo ? "Inactivo" : cfg.label}
                              </span>
                              {!u.emailVerificado && u.activo !== false && (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {esInactivo ? (
                              <button
                                onClick={() => mutReactivar.mutate(u.id)}
                                disabled={mutReactivar.isPending}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors disabled:opacity-50"
                              >
                                {mutReactivar.isPending ? (
                                  <IconLoader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  "✓ Reactivar"
                                )}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditando(u)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                  <IconEdit size={14} stroke={1.8} />
                                  Editar
                                </button>
                                {!u.emailVerificado && (
                                  <button
                                    onClick={() => mutReenviar.mutate(u.id)}
                                    disabled={mutReenviar.isPending}
                                    title="Reenviar email de activación"
                                    className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-50 border border-gray-200 rounded-xl transition-colors disabled:opacity-50"
                                  >
                                    <IconSend size={15} stroke={1.8} />
                                  </button>
                                )}
                                {u.id !== user?.id && (
                                  <button
                                    onClick={() => setEliminando(u)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 border border-gray-200 rounded-xl transition-colors"
                                  >
                                    <IconTrash size={16} stroke={1.8} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            },
          )}

          {visibles.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <IconUser
                size={48}
                stroke={1.2}
                className="text-gray-200 mx-auto mb-3"
              />
              <p className="text-gray-400">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      )}

      {showNuevo && <UsuarioModal onClose={() => setShowNuevo(false)} />}
      {editando && (
        <UsuarioModal usuario={editando} onClose={() => setEditando(null)} />
      )}
      {eliminando && (
        <ConfirmarEliminarModal
          usuario={eliminando}
          onClose={() => setEliminando(null)}
          onConfirm={() => mutDesactivar.mutate(eliminando.id)}
          isPending={mutDesactivar.isPending}
        />
      )}
    </div>
  );
}
