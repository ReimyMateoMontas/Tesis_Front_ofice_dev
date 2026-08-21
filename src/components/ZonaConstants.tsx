export const ZONE_COLORS = [
  {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    bar: "bg-amber-500",
    border: "border-amber-300",
    selected: "border-amber-400 bg-amber-50",
    dot: "bg-amber-500",
    optionText: "#b45309",
  },
  {
    bg: "bg-green-50",
    icon: "bg-green-100 text-green-600",
    bar: "bg-green-500",
    border: "border-green-300",
    selected: "border-green-400 bg-green-50",
    dot: "bg-green-500",
    optionText: "#15803d",
  },
  {
    bg: "bg-red-50",
    icon: "bg-red-100 text-red-500",
    bar: "bg-red-500",
    border: "border-red-300",
    selected: "border-red-400 bg-red-50",
    dot: "bg-red-500",
    optionText: "#b91c1c",
  },
  {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    bar: "bg-blue-500",
    border: "border-blue-300",
    selected: "border-blue-400 bg-blue-50",
    dot: "bg-blue-500",
    optionText: "#1d4ed8",
  },
  {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-600",
    bar: "bg-purple-500",
    border: "border-purple-300",
    selected: "border-purple-400 bg-purple-50",
    dot: "bg-purple-500",
    optionText: "#7e22ce",
  },
  {
    bg: "bg-pink-50",
    icon: "bg-pink-100 text-pink-600",
    bar: "bg-pink-500",
    border: "border-pink-300",
    selected: "border-pink-400 bg-pink-50",
    dot: "bg-pink-500",
    optionText: "#be185d",
  },
];

function normalizeZoneName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Mantiene el color de cada zona ligado a su nombre, aunque la API cambie
 * el orden de la lista. Las zonas sin un color en el nombre conservan el
 * color de respaldo asignado por su posición.
 */
export function getZoneColor(name: string, fallbackIndex = 0) {
  const normalizedName = normalizeZoneName(name);

  if (normalizedName.includes("amarill")) return ZONE_COLORS[0];
  if (normalizedName.includes("verde")) return ZONE_COLORS[1];
  if (normalizedName.includes("roj")) return ZONE_COLORS[2];
  if (
    normalizedName.includes("azul") ||
    normalizedName.includes("celeste") ||
    normalizedName.includes("clinic")
  )
    return ZONE_COLORS[3];
  if (
    normalizedName.includes("morad") ||
    normalizedName.includes("violeta") ||
    normalizedName.includes("purpura")
  )
    return ZONE_COLORS[4];
  if (normalizedName.includes("rosad") || normalizedName.includes("rosa"))
    return ZONE_COLORS[5];

  return ZONE_COLORS[
    Math.abs(fallbackIndex) % ZONE_COLORS.length
  ];
}

export function isClinicalZone(name: string) {
  return normalizeZoneName(name).includes("clinic");
}

export const ESTADO_BADGE: Record<string, string> = {
  Saludable: "bg-green-100 text-green-700",
  EnTratamiento: "bg-yellow-100 text-yellow-700",
  Critico: "bg-red-100 text-red-700",
  Recuperado: "bg-blue-100 text-blue-700",
};

export const PLACEHOLDER_ANIMAL =
  "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=80&h=80&fit=crop";
