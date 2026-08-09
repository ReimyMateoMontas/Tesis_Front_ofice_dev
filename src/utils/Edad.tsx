
export interface EdadDesglosada {
  anios: number;
  meses: number;
  semanas: number;
  dias: number;
  totalDias: number;
}

// Pluraliza una unidad simple en español ("1 día" / "2 días").
function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

// Convierte una fecha (string ISO "yyyy-MM-dd", Date, o undefined) a Date.
// Devuelve null si no es válida.
function parseFecha(fecha?: string | Date | null): Date | null {
  if (!fecha) return null;
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return isNaN(d.getTime()) ? null : d;
}

// Calcula el desglose exacto de la edad usando aritmética de calendario:
// primero años y meses completos (respetando la longitud real de cada mes),
// y el resto en semanas y días.
export function desglosarEdad(
  fechaNacimiento?: string | Date | null,
  hasta: Date = new Date(),
): EdadDesglosada | null {
  const nac = parseFecha(fechaNacimiento);
  if (!nac) return null;

  // Normalizamos a medianoche para evitar errores por horas/zonas.
  const inicio = new Date(nac.getFullYear(), nac.getMonth(), nac.getDate());
  const fin = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());

  // Si la fecha de nacimiento es futura, la edad es 0.
  if (fin <= inicio) {
    return { anios: 0, meses: 0, semanas: 0, dias: 0, totalDias: 0 };
  }

  const totalDias = Math.floor((fin.getTime() - inicio.getTime()) / 86_400_000);

  // Años y meses completos, restando con calendario real.
  let anios = fin.getFullYear() - inicio.getFullYear();
  let meses = fin.getMonth() - inicio.getMonth();
  let dias = fin.getDate() - inicio.getDate();

  if (dias < 0) {
    // Pedimos prestados los días del mes anterior al "fin".
    meses -= 1;
    const mesAnterior = new Date(fin.getFullYear(), fin.getMonth(), 0);
    dias += mesAnterior.getDate();
  }
  if (meses < 0) {
    anios -= 1;
    meses += 12;
  }

  const semanas = Math.floor(dias / 7);
  const diasRestantes = dias % 7;

  return { anios, meses, semanas, dias: diasRestantes, totalDias };
}

// Devuelve la edad formateada siguiendo la progresión lógica descrita arriba.
// Ejemplos:
//   3 días        → "3 días"
//   10 días       → "1 semana 3 días"
//   2 meses       → "2 meses"
//   1 año y pico  → "1 año 2 meses 1 semana"
export function formatearEdad(
  fechaNacimiento?: string | Date | null,
  hasta: Date = new Date(),
): string {
  const e = desglosarEdad(fechaNacimiento, hasta);
  if (!e) return "Edad desconocida";

  // Etapa 1: menos de 7 días → solo días.
  if (e.totalDias < 7) {
    return e.totalDias === 0
      ? "Recién nacido"
      : plural(e.totalDias, "día", "días");
  }

  const partes: string[] = [];

  // Etapa 4: un año o más → años + meses + semanas + días.
  if (e.anios >= 1) {
    partes.push(plural(e.anios, "año", "años"));
    if (e.meses > 0) partes.push(plural(e.meses, "mes", "meses"));
    if (e.semanas > 0) partes.push(plural(e.semanas, "semana", "semanas"));
    if (e.dias > 0) partes.push(plural(e.dias, "día", "días"));
    return partes.join(" ");
  }

  // Etapa 3: al menos un mes → meses + semanas + días.
  if (e.meses >= 1) {
    partes.push(plural(e.meses, "mes", "meses"));
    if (e.semanas > 0) partes.push(plural(e.semanas, "semana", "semanas"));
    if (e.dias > 0) partes.push(plural(e.dias, "día", "días"));
    return partes.join(" ");
  }

  // Etapa 2: entre 14 días y un mes → semanas + días.
  const semanasTotales = Math.floor(e.totalDias / 7);
  const diasSueltos = e.totalDias % 7;
  partes.push(plural(semanasTotales, "semana", "semanas"));
  if (diasSueltos > 0) partes.push(plural(diasSueltos, "día", "días"));
  return partes.join(" ");
}

// Versión compacta para tablas/tarjetas (ej: "1a 2m" o "3 días").
export function formatearEdadCompacta(
  fechaNacimiento?: string | Date | null,
  hasta: Date = new Date(),
): string {
  const e = desglosarEdad(fechaNacimiento, hasta);
  if (!e) return "—";

  if (e.totalDias < 7) {
    return e.totalDias === 0 ? "0 días" : plural(e.totalDias, "día", "días");
  }
  if (e.anios >= 1) {
    return e.meses > 0 ? `${e.anios}a ${e.meses}m` : `${e.anios}a`;
  }
  if (e.meses >= 1) {
    return e.semanas > 0 ? `${e.meses}m ${e.semanas}sem` : `${e.meses}m`;
  }
  const semanasTotales = Math.floor(e.totalDias / 7);
  return `${semanasTotales} sem`;
}
