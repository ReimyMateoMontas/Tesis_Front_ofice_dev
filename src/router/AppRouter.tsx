import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ControlRoute } from "./ControlRoute";
import { Layout } from "../components/Nav/nav";
import { LoginPage } from "../pages/auth/login";
import { DashboardPage } from "../pages/dashboard/dashboard";
import { Animales } from "../pages/animales/Animales";
import { Zonas } from "../pages/zona/zone";
import { Adopciones } from "../pages/adopciones/adopciones";
import { Medico } from "../pages/medico/Medico";
import { Inventario } from "../pages/inventario/inventario";
import { Gastos } from "../pages/gastos/gastos";
import { Donaciones } from "../pages/donaciones/donaciones";
import { Usuarios } from "../pages/auth/Usuario/usuario";
import { ActivarCuenta } from "../pages/auth/ActivarCuenta";
import { RestablecerPassword } from "../pages/auth/Restablecerpassword";

function Wip({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <p className="text-4xl mb-3">🚧</p>
        <p className="text-gray-500 font-medium">{title}</p>
        <p className="text-gray-400 text-sm mt-1">Próximamente</p>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activar" element={<ActivarCuenta />} />
        <Route path="/restablecer" element={<RestablecerPassword />} />
        <Route path="/unauthorized" element={<Wip title="Acceso denegado" />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Todos los roles */}
        <Route
          element={
            <ControlRoute
              allowedRoles={["Administrador", "Veterinario", "Trabajador"]}
            />
          }
        >
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/animales" element={<Animales />} />
            <Route path="/animal" element={<Animales />} />
            <Route path="/zonas" element={<Zonas />} />
            <Route path="/adopcion" element={<Adopciones />} />
            <Route path="/medico" element={<Medico />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/gastos" element={<Gastos />} />
            <Route path="/donaciones" element={<Donaciones />} />
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>

        {/* Admin + Veterinario */}
        <Route
          element={
            <ControlRoute allowedRoles={["Administrador", "Veterinario"]} />
          }
        >
          <Route element={<Layout />}>
            <Route path="/medico" element={<Wip title="Control Médico" />} />
          </Route>
        </Route>

        {/* Admin + Trabajador */}
        <Route
          element={
            <ControlRoute allowedRoles={["Administrador", "Trabajador"]} />
          }
        >
          <Route element={<Layout />}>
            <Route path="/inventario" element={<Wip title="Inventario" />} />
          </Route>
        </Route>

        {/* Solo Admin */}
        <Route element={<ControlRoute allowedRoles={["Administrador"]} />}>
          <Route element={<Layout />}>
            <Route path="/gastos" element={<Wip title="Gastos" />} />
            <Route path="/usuarios" element={<Wip title="Usuarios" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
