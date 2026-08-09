import {
  IconBell,
  IconChevronDown,
  IconAlertTriangle,
  IconPackage,
  IconClipboardList,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/hooks";
import { logout } from "../../store/authSlice";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { axiosClient } from "../../api/axiosClient";

// ── Tipos de notificación ─────────────────────────────────────────────────────
interface Notificacion {
  id: string;
  tipo: "stock" | "critico" | "pendiente" | "vencimiento";
  titulo: string;
  detalle: string;
  link: string;
  leida: boolean;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Inicio",
  "/animales": "Animales",
  "/zonas": "Zonas",
  "/adopcion": "Adopciones",
  "/medico": "Médico",
  "/inventario": "Inventario",
  "/gastos": "Gastos",
  "/usuarios": "Usuarios",
};

const TIPO_CONFIG = {
  stock: { icon: IconPackage, color: "text-amber-500", bg: "bg-amber-50" },
  critico: { icon: IconAlertTriangle, color: "text-red-500", bg: "bg-red-50" },
  pendiente: {
    icon: IconClipboardList,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  vencimiento: {
    icon: IconPackage,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
};

// ── Hook de Notificaciones ──────────────────────────────────────────────────
function useNotificaciones() {
  const user = useAppSelector((s) => s.auth.user);
  const rol = user?.rol;

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => axiosClient.get("/dashboard").then((r) => r.data),
    refetchInterval: 60000,
  });

  const notificaciones: Notificacion[] = [];

  if (data?.stats) {
    const s = data.stats;
    if (s.alertasStock > 0 && rol !== "Veterinario")
      notificaciones.push({
        id: "stock",
        tipo: "stock",
        titulo: "Stock bajo",
        detalle: `${s.alertasStock} productos por debajo del mínimo`,
        link: "/inventario",
        leida: false,
      });
    if (s.criticos > 0 && rol !== "Trabajador")
      notificaciones.push({
        id: "criticos",
        tipo: "critico",
        titulo: "Casos Críticos",
        detalle: `${s.criticos} animales requieren atención`,
        link: "/medico",
        leida: false,
      });
    if (s.adopcionesPendientes > 0 && rol !== "Veterinario")
      notificaciones.push({
        id: "adopciones",
        tipo: "pendiente",
        titulo: "Adopciones",
        detalle: `${s.adopcionesPendientes} solicitudes pendientes`,
        link: "/adopcion",
        leida: false,
      });
  }
  return notificaciones;
}

// ── Componente Topbar ─────────────────────────────────────────────────────────
export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [leidasIds, setLeidasIds] = useState<Set<string>>(new Set());

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const notificaciones = useNotificaciones();
  const sinLeer = notificaciones.filter((n) => !leidasIds.has(n.id));
  const title = pageTitles[location.pathname] ?? "El Edén";

  // Cierre de dropdowns al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node))
        setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const marcarTodas = () =>
    setLeidasIds(new Set(notificaciones.map((n) => n.id)));

  const handleNotifClick = (n: Notificacion) => {
    setLeidasIds((prev) => new Set([...prev, n.id]));
    setBellOpen(false);
    navigate(n.link);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between flex-shrink-0 z-30 shadow-sm">
      {/* Lado Izquierdo: Título Dinámico */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">
          {title}
        </h1>
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-bold mt-1">
          Gestión de Refugio
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Campanita de Notificaciones */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => {
              setBellOpen(!bellOpen);
              setMenuOpen(false);
            }}
            className={`p-2.5 rounded-full transition-all duration-200 relative group ${
              bellOpen
                ? "bg-green-50 text-green-600"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            }`}
          >
            <IconBell size={20} stroke={1.8} />
            {sinLeer.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <span className="text-sm font-bold text-gray-900">
                  Notificaciones
                </span>
                {sinLeer.length > 0 && (
                  <button
                    onClick={marcarTodas}
                    className="text-xs text-green-600 hover:text-green-700 font-bold"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {notificaciones.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <IconBell
                        size={24}
                        stroke={1.5}
                        className="text-gray-200"
                      />
                    </div>
                    <p className="text-sm text-gray-400">
                      Sin alertas por ahora
                    </p>
                  </div>
                ) : (
                  notificaciones.map((n) => {
                    const cfg = TIPO_CONFIG[n.tipo];
                    const Icon = cfg.icon;
                    const leida = leidasIds.has(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full flex items-start gap-4 px-5 py-4 text-left border-b border-gray-50 transition-colors hover:bg-gray-50/80 ${
                          leida ? "opacity-50" : ""
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon size={20} stroke={1.8} className={cfg.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {n.titulo}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.detalle}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-8 w-px bg-gray-100" />

        {/* Avatar y Menú de Usuario */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setBellOpen(false);
            }}
            className={`flex items-center gap-3 p-1 pr-3 rounded-full transition-all duration-200 group border ${
              menuOpen
                ? "bg-gray-50 border-gray-200 shadow-inner"
                : "bg-white border-transparent hover:border-gray-200 hover:shadow-sm"
            }`}
          >
            {/* Avatar con foto o inicial */}
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-md border-2 border-white transform group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
              {user?.fotoPerfilUrl ? (
                <img
                  src={user.fotoPerfilUrl}
                  alt={user.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center text-white font-bold">
                  {user?.nombre ? (
                    user.nombre.charAt(0).toUpperCase()
                  ) : (
                    <IconUser size={20} />
                  )}
                </div>
              )}
            </div>

            {/* Info Usuario */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-bold text-gray-800 leading-tight group-hover:text-green-700 transition-colors">
                {user?.nombre}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {user?.rol}
              </span>
            </div>

            {/* Flecha mejorada */}
            <div
              className={`ml-1 transition-all duration-300 ${menuOpen ? "rotate-180 text-green-600" : "text-gray-300"}`}
            >
              <IconChevronDown size={18} stroke={3} />
            </div>
          </button>

          {/* Dropdown Menú */}
          {menuOpen && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
                  Cuenta
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="w-[calc(100%-16px)] mx-2 flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold"
              >
                <IconLogout size={16} stroke={2.5} />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
