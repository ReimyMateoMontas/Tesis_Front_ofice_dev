// Ubicación: src/pages/auth/login.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import logoEden from "../../assets/logo.png";
import toast, { Toaster } from "react-hot-toast";
import { authApi } from "../../api/authApi.tsx";
import { setAuth } from "../../store/authSlice";
import { extractUserFromToken } from "../../utils/tokenUtils";
import { useAppDispatch } from "../../hooks/hooks.ts";
import {
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconMail,
  IconAlertCircle,
  IconLock,
  IconSend,
  IconArrowLeft,
} from "@tabler/icons-react";
import { axiosClient } from "../../api/axiosClient";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});
type LoginForm = z.infer<typeof loginSchema>;

// ── Mensajes de error específicos ─────────────────────────────────────────────
function getErrorMessage(err: any): {
  message: string;
  field?: "email" | "password" | "general";
} {
  const status = err.response?.status;
  const mensaje =
    err.response?.data?.mensaje ?? err.response?.data?.message ?? "";

  if (!err.response) {
    return {
      message: "No se pudo conectar al servidor. Verifica tu conexión.",
      field: "general",
    };
  }

  if (status === 401) {
    if (
      mensaje.includes("no existe") ||
      mensaje.includes("no encontrado") ||
      mensaje.includes("Credenciales inválidas")
    ) {
      // Podría ser email o contraseña — el backend dirá cuál
      if (
        mensaje.includes("correo") ||
        mensaje.includes("email") ||
        mensaje.includes("usuario")
      )
        return {
          message: "El correo electrónico no está registrado en el sistema.",
          field: "email",
        };
      if (mensaje.includes("contraseña") || mensaje.includes("password"))
        return {
          message: "La contraseña es incorrecta. Verifica e intenta de nuevo.",
          field: "password",
        };
      return { message: "Correo o contraseña incorrectos.", field: "general" };
    }
    if (mensaje.includes("desactivada") || mensaje.includes("inactiv"))
      return {
        message: "Tu cuenta está desactivada. Contacta al administrador.",
        field: "general",
      };
    if (
      mensaje.includes("activar") ||
      mensaje.includes("verificar") ||
      mensaje.includes("pendiente")
    )
      return {
        message:
          "Debes activar tu cuenta primero. Revisa tu correo electrónico.",
        field: "general",
      };
    return {
      message: "Acceso denegado. Verifica tus credenciales.",
      field: "general",
    };
  }
  if (status === 429)
    return {
      message: "Demasiados intentos fallidos. Espera unos minutos.",
      field: "general",
    };
  if (status >= 500)
    return {
      message: "Error en el servidor. Intenta más tarde.",
      field: "general",
    };

  return { message: mensaje || "Error al iniciar sesión.", field: "general" };
}

// ── Modal recuperar contraseña ────────────────────────────────────────────────
function RecuperarPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleEnviar = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setCargando(true);
    try {
      await axiosClient.post("/auth/recuperar-password", { email });
      setEnviado(true);
    } catch (err: any) {
      // Por seguridad no revelar si el correo existe o no
      setEnviado(true); // siempre mostrar éxito
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 px-8 py-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <IconMail size={28} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-lg">Recuperar contraseña</h2>
          <p className="text-green-100 text-sm mt-1">
            Te enviaremos un enlace a tu correo
          </p>
        </div>

        <div className="p-8">
          {enviado ? (
            /* Estado: email enviado */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconSend size={28} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¡Revisa tu correo!
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Si <strong>{email}</strong> está registrado, recibirás un enlace
                para restablecer tu contraseña.
              </p>
              <p className="text-xs text-gray-400 mb-6">
                El enlace expira en 1 hora. Revisa también tu carpeta de spam.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          ) : (
            /* Estado: formulario */
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa el correo electrónico con el que te registraste y te
                enviaremos un enlace para crear una nueva contraseña.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
                  placeholder="correo@ejemplo.com"
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                />
                {error && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <IconAlertCircle size={14} />
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleEnviar}
                disabled={cargando}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-300
                  text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {cargando ? (
                  <>
                    <IconLoader2 size={18} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <IconSend size={16} />
                    Enviar enlace
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <IconArrowLeft size={15} />
                Volver al inicio de sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principal LoginPage ────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorField, setErrorField] = useState<
    "email" | "password" | "general" | ""
  >("");
  const [showRecuperar, setShowRecuperar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  // Extraemos los onChange de RHF para no sobrescribirlos
  const emailReg = register("email");
  const passwordReg = register("password");

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMessage("");
    setErrorField("");
    clearErrors();
    try {
      const response = await authApi.login(data);
      const user = extractUserFromToken(response.token);
      if (!user) throw new Error("Token inválido");
      dispatch(
        setAuth({
          token: response.token,
          user: { ...user, fotoPerfilUrl: response.fotoPerfilUrl },
        }),
      );
      toast.success(`¡Bienvenido, ${response.nombre}!`);
      navigate("/dashboard");
    } catch (err: any) {
      const { message, field } = getErrorMessage(err);
      setErrorMessage(message);
      setErrorField(field ?? "general");
      // Marcar campo en rojo si aplica
      if (field === "email") setError("email", { message: "" });
      if (field === "password") setError("password", { message: "" });
    } finally {
      setLoading(false);
    }
  };

  const inputBase =
    "w-full border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition";
  const inputNormal = `${inputBase} border-gray-200 focus:ring-green-500`;
  const inputError = `${inputBase} border-red-300 focus:ring-red-400 bg-red-50/30`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Toaster position="top-right" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-10 py-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 flex items-center justify-center mb-3">
            <img
              src={logoEden}
              alt="Logo Fundación El Edén"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-sm text-gray-400">
            Sistema de Gestión de Albergue
          </p>
        </div>

        {/* Banner de error general */}
        {errorMessage && errorField === "general" && (
          <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <IconAlertCircle
              size={18}
              className="text-red-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <IconMail
                size={16}
                stroke={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                {...emailReg}
                type="email"
                placeholder="usuario@albergue.com"
                onChange={(e) => {
                  emailReg.onChange(e); // mantiene sincronizado a RHF
                  setErrorMessage("");
                  setErrorField("");
                }}
                className={`${
                  errors.email || errorField === "email"
                    ? inputError
                    : inputNormal
                } pl-10`}
              />
            </div>
            {errors.email?.message && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <IconAlertCircle size={13} />
                {errors.email.message}
              </p>
            )}
            {errorField === "email" && errorMessage && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <IconAlertCircle size={13} />
                {errorMessage}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => setShowRecuperar(true)}
                className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <IconLock
                size={16}
                stroke={1.8}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                {...passwordReg}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                onChange={(e) => {
                  passwordReg.onChange(e); // mantiene sincronizado a RHF
                  setErrorMessage("");
                  setErrorField("");
                }}
                className={`${
                  errors.password || errorField === "password"
                    ? inputError
                    : inputNormal
                } pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <IconEyeOff size={16} stroke={1.8} />
                ) : (
                  <IconEye size={16} stroke={1.8} />
                )}
              </button>
            </div>
            {errors.password?.message && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <IconAlertCircle size={13} />
                {errors.password.message}
              </p>
            )}
            {errorField === "password" && errorMessage && (
              <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                <IconAlertCircle size={13} />
                {errorMessage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400
              text-white font-semibold py-3 rounded-xl transition-colors
              flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <IconLoader2 size={18} className="animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            ¿Problemas para acceder? Contacta al administrador del sistema.
          </p>
        </div>
      </div>

      {/* Modal recuperar contraseña */}
      {showRecuperar && (
        <RecuperarPasswordModal onClose={() => setShowRecuperar(false)} />
      )}
    </div>
  );
}
