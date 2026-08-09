import { NavLink } from "react-router-dom";
import logoEden from "../../assets/logo.png";
import {
  IconLayoutDashboard,
  IconPaw,
  IconMapPin,
  IconStethoscope,
  IconShoppingCart,
  IconCurrencyDollar,
  IconUsers,
  IconHeartHandshake,
  IconChevronLeft,
  IconChevronRight,
  IconUser,
  IconHome,
} from "@tabler/icons-react";
import { useAppSelector } from "../../hooks/hooks";
import { useState } from "react";

const navItems = [
  {
    path: "/dashboard",
    label: "Inicio",
    icon: IconLayoutDashboard,
    roles: ["Administrador", "Veterinario", "Trabajador"],
  },
  {
    path: "/animales",
    label: "Animales",
    icon: IconPaw,
    roles: ["Administrador", "Veterinario", "Trabajador"],
  },
  {
    path: "/zonas",
    label: "Zonas",
    icon: IconMapPin,
    roles: ["Administrador", "Veterinario", "Trabajador"],
  },
  {
    path: "/adopcion",
    label: "Adopciones",
    icon: IconHome,
    roles: ["Administrador", "Trabajador"],
  },
  {
    path: "/medico",
    label: "Médico",
    icon: IconStethoscope,
    roles: ["Administrador", "Veterinario"],
  },
  {
    path: "/inventario",
    label: "Inventario",
    icon: IconShoppingCart,
    roles: ["Administrador", "Trabajador"],
  },
  {
    path: "/gastos",
    label: "Gastos",
    icon: IconCurrencyDollar,
    roles: ["Administrador"],
  },
  {
    path: "/donaciones",
    label: "Donaciones",
    icon: IconHeartHandshake,
    roles: ["Administrador"],
  },
  {
    path: "/usuarios",
    label: "Usuarios",
    icon: IconUsers,
    roles: ["Administrador"],
  },
];

export function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const [collapsed, setCollapsed] = useState(false);

  const visible = navItems.filter(
    (item) => user && item.roles.includes(user.rol),
  );

  return (
    <aside
      className={`group/sidebar relative flex flex-col flex-shrink-2 bg-white border-r border-gray-100
        transition-all duration-300 ease-in-out z-40
        ${collapsed ? "w-[76px]" : "w-60"}`}
    >
      {/* Botón de Colapso */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        className="absolute -right-3 top-6 z-50 w-6 h-6 bg-white border border-gray-200
          rounded-full flex items-center justify-center shadow-md
          text-gray-400 hover:text-green-600 hover:border-green-300 
          transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100"
      >
        {collapsed ? (
          <IconChevronRight size={14} stroke={2.5} />
        ) : (
          <IconChevronLeft size={14} stroke={2.5} />
        )}
      </button>

      {/* Header / Logo */}
      <div
        className={`flex items-center gap-3 transition-all duration-300 border-b border-gray-50
          ${collapsed ? "justify-center px-3 py-4" : "px-4 py-4"}`}
      >
        <div
          className={`relative flex-shrink-0 transition-all duration-500 
            ${collapsed ? "w-11 h-11" : "w-14 h-14"}`}
        >
          <img
            src={logoEden}
            alt="FunEdén"
            className="w-full h-full object-contain"
            style={{ mixBlendMode: "multiply" }}
          />
        </div>

        {!collapsed && (
          <div className="min-w-0 animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-xl font-black text-gray-900 leading-tight tracking-tight">
              FUNEDÉN
            </h2>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-0.5">
              Albergue
            </p>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-none">
        {visible.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg text-sm transition-all duration-300 ease-out group relative
              ${collapsed ? "justify-center h-11" : "gap-3 px-3 h-10"}
              ${
                isActive
                  ? "bg-green-50 text-green-700 font-semibold shadow-sm scale-[1.02]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.01] hover:shadow-sm"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && !collapsed && (
                  <div className="absolute left-0 w-1 h-5 bg-green-600 rounded-r-full animate-in slide-in-from-left duration-300" />
                )}

                <Icon
                  size={collapsed ? 22 : 20}
                  stroke={isActive ? 2 : 1.7}
                  className={`flex-shrink-0 transition-all duration-300 ease-out
                    ${isActive ? "text-green-600 scale-110" : "text-gray-500 group-hover:text-gray-700 group-hover:scale-110"}`}
                />

                {!collapsed && (
                  <span className="truncate transition-all duration-300">
                    {label}
                  </span>
                )}

                {/* Efecto de brillo sutil en hover */}
                <div
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/20 to-transparent 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sección Usuario */}
      <div
        className={`mt-auto border-t border-gray-50 transition-all duration-300 bg-gray-50/40
          ${collapsed ? "p-3 flex justify-center" : "p-3"}`}
      >
        <div
          className={`flex items-center gap-2.5 ${collapsed ? "flex-col" : "flex-row"}`}
        >
          <div
            className={`rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center
              text-white shadow-sm border-2 border-white transition-all duration-300
              ${collapsed ? "w-9 h-9" : "w-9 h-9"}`}
          >
            {user?.nombre ? (
              <span className="text-xs font-bold">
                {user.nombre.charAt(0).toUpperCase()}
              </span>
            ) : (
              <IconUser size={16} stroke={1.8} />
            )}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 animate-in fade-in duration-300">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.nombre}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                {user?.rol}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
