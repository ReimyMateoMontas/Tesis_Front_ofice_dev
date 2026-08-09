
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { axiosClient } from "../../api/axiosClient";
import { useAppDispatch } from "../../hooks/hooks";
import { setAuth } from "../../store/authSlice";
import {
  IconLoader2,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import logoEden from "../../assets/logo.png";

type Estado = "verificando" | "formulario" | "expirado" | "error" | "yaActivo";

export function ActivarCuenta() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = params.get("token") ?? "";

  const [estado, setEstado] = useState<Estado>("verificando");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [verConf, setVerConf] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Al cargar verificar que el token sea válido
  useEffect(() => {
    if (!token) {
      setEstado("error");
      return;
    }

    axiosClient
      .get(`/auth/activar?token=${token}`)
      .then(({ data }) => {
        if (data.yaActivo) {
          setEstado("yaActivo");
          return;
        }
        setNombre(data.nombre ?? "");
        setEmail(data.email ?? "");
        setEstado("formulario");
      })
      .catch((err) => {
        const msg = err.response?.data?.mensaje ?? "";
        setEstado(msg.includes("expirado") ? "expirado" : "error");
      });
  }, [token]);

  const handleActivar = async () => {
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    try {
      const { data } = await axiosClient.post("/auth/activar", {
        token,
        password,
        confirmarPassword: confirmar,
      });

      // Guardar sesión automáticamente
      dispatch(
        setAuth({
          token: data.token,
          user: {
            id: data.usuario.id,
            nombre: data.usuario.nombre,
            email: data.usuario.email,
            rol: data.usuario.rol,
          },
        }),
      );

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.mensaje ?? "Error al activar la cuenta.");
    } finally {
      setCargando(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-8 py-6 text-center">
          <img
            src={logoEden}
            alt="FunEdén"
            className="w-14 h-14 object-contain mx-auto mb-3"
          />
          <h1 className="text-white font-bold text-xl">Fundación El Edén</h1>
          <p className="text-green-100 text-sm mt-1">Activación de cuenta</p>
        </div>

        <div className="p-8">
          {/* Verificando */}
          {estado === "verificando" && (
            <div className="text-center py-8">
              <IconLoader2
                size={40}
                className="animate-spin text-green-600 mx-auto mb-4"
              />
              <p className="text-gray-600">Verificando enlace...</p>
            </div>
          )}

          {/* Ya activo */}
          {estado === "yaActivo" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconCheck size={32} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Cuenta ya activada
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Tu cuenta ya está activa. Puedes iniciar sesión normalmente.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}

          {/* Token expirado */}
          {estado === "expirado" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconX size={32} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Enlace expirado
              </h2>
              <p className="text-gray-500 text-sm">
                Este enlace de activación ya expiró (24 horas). Contacta al
                administrador para que te reenvíe uno nuevo.
              </p>
            </div>
          )}

          {/* Error genérico */}
          {estado === "error" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconX size={32} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Enlace no válido
              </h2>
              <p className="text-gray-500 text-sm">
                Este enlace de activación no existe o ya fue utilizado.
              </p>
            </div>
          )}

          {/* Formulario para crear contraseña */}
          {estado === "formulario" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Hola, {nombre}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Crea tu contraseña para activar tu cuenta en el sistema.
              </p>

              <div className="space-y-4">
                {/* Email (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    value={email}
                    readOnly
                    className={`${inputClass} bg-gray-50 text-gray-500 cursor-default`}
                  />
                </div>

                {/* Nueva contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nueva contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={verPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => setVerPass((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {verPass ? (
                        <IconEyeOff size={18} stroke={1.8} />
                      ) : (
                        <IconEye size={18} stroke={1.8} />
                      )}
                    </button>
                  </div>
                  {/* Indicador de fortaleza */}
                  {password.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            password.length >= n * 3
                              ? "bg-green-500"
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirmar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={verConf ? "text" : "password"}
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      placeholder="Repite la contraseña"
                      className={`${inputClass} ${confirmar && confirmar !== password ? "border-red-300 ring-red-200" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setVerConf((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {verConf ? (
                        <IconEyeOff size={18} stroke={1.8} />
                      ) : (
                        <IconEye size={18} stroke={1.8} />
                      )}
                    </button>
                  </div>
                  {confirmar && confirmar !== password && (
                    <p className="text-red-500 text-xs mt-1">
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Botón */}
                <button
                  onClick={handleActivar}
                  disabled={cargando}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300
                    text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {cargando ? (
                    <>
                      <IconLoader2 size={18} className="animate-spin" />
                      Activando...
                    </>
                  ) : (
                    "Activar mi cuenta"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
