export const ESTADO_CONFIG: Record<
  string,
  { label: string; badge: string; icon: string }
> = {
  Pendiente: {
    label: "Pendiente",
    badge: "bg-amber-100 text-amber-700",
    icon: "🗓",
  },
  Aprobada: {
    label: "Aprobada",
    badge: "bg-green-100 text-green-700",
    icon: "✅",
  },
  Rechazada: {
    label: "Rechazada",
    badge: "bg-red-100 text-red-700",
    icon: "❌",
  },
  Devuelto: {
    label: "Devuelto",
    badge: "bg-gray-100 text-gray-600",
    icon: "↩",
  },
};