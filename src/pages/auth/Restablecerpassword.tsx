import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { axiosClient } from "../../api/axiosClient";
import {
  IconLoader2,
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
  IconLock,
} from "@tabler/icons-react";
import logoEden from "../../assets/logo.png";

type Estado = "verificando" | "formulario" | "expirado" | "error" | "exito";

export function RestablecerPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [estado, setEstado] = useState<Estado>("verificando");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [verConf, setVerConf] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setEstado("error");
      return;
    }

    axiosClient
      .get(`/auth/verificar-reset?token=${token}`)
      .then(({ data }) => {
        setEmail(data.email ?? "");
        setEstado("formulario");
      })
      .catch((err) => {
        const msg = err.response?.data?.mensaje ?? "";
        setEstado(msg.includes("expirado") ? "expirado" : "error");
      });
  }, [token]);

  const handleRestablecer = async () => {
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
      await axiosClient.post("/auth/restablecer-password", {
        token,
        password,
        confirmarPassword: confirmar,
      });
      setEstado("exito");
    } catch (err: any) {
      setError(
        err.response?.data?.mensaje ?? "Error al restablecer la contraseña.",
      );
    } finally {
      setCargando(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900";

  // Indicador fortaleza
  const fortaleza =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : /[A-Z]/.test(password) && /[0-9]/.test(password)
            ? 4
            : 3;

  const fortalezaLabel = ["", "Muy débil", "Débil", "Buena", "Fuerte"];
  const fortalezaColor = [
    "",
    "bg-red-400",
    "bg-amber-400",
    "bg-blue-400",
    "bg-green-500",
  ];

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
          <p className="text-green-100 text-sm mt-1">Restablecer contraseña</p>
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

          {/* Éxito */}
          {estado === "exito" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconCheck size={32} className="text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Contraseña restablecida!
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Tu contraseña fue actualizada correctamente. Ya puedes iniciar
                sesión con tu nueva contraseña.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
              >
                Ir al inicio de sesión
              </button>
            </div>
          )}

          {/* Expirado */}
          {estado === "expirado" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconX size={32} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Enlace expirado
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Este enlace de recuperación expiró (1 hora). Solicita uno nuevo
                desde la pantalla de inicio de sesión.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* Error */}
          {estado === "error" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconX size={32} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Enlace no válido
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Este enlace no es válido o ya fue utilizado.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}

          {/* Formulario */}
          {estado === "formulario" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Crea una nueva contraseña
                </h2>
                <p className="text-sm text-gray-500">
                  Para la cuenta <strong>{email}</strong>
                </p>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nueva contraseña *
                </label>
                <div className="relative">
                  <IconLock
                    size={16}
                    stroke={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={verPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={`${inputClass} pl-10 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {verPass ? (
                      <IconEyeOff size={16} stroke={1.8} />
                    ) : (
                      <IconEye size={16} stroke={1.8} />
                    )}
                  </button>
                </div>
                {/* Indicador fortaleza */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            n <= fortaleza
                              ? fortalezaColor[fortaleza]
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {fortalezaLabel[fortaleza]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirmar contraseña *
                </label>
                <div className="relative">
                  <IconLock
                    size={16}
                    stroke={1.8}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={verConf ? "text" : "password"}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="Repite la contraseña"
                    className={`${inputClass} pl-10 pr-11 ${
                      confirmar && confirmar !== password
                        ? "border-red-300 bg-red-50/30"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerConf((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {verConf ? (
                      <IconEyeOff size={16} stroke={1.8} />
                    ) : (
                      <IconEye size={16} stroke={1.8} />
                    )}
                  </button>
                </div>
                {confirmar && confirmar !== password && (
                  <p className="text-red-500 text-xs mt-1">
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              {/* Error general */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleRestablecer}
                disabled={cargando}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300
                  text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {cargando ? (
                  <>
                    <IconLoader2 size={18} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar nueva contraseña"
                )}
              </button>

              <button
                onClick={() => navigate("/login")}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
