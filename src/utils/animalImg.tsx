// Imágenes por defecto (caricaturas) — se usan cuando el animal no tiene foto propia.
import perroImg from "../assets/Perro.jpg";
import gatoImg from "../assets/Gato.png";

/**
 * Devuelve la caricatura por defecto según la especie del animal.
 * Gato -> caricatura de gato. Perro (y cualquier otro caso) -> caricatura de perro.
 */
export function especieImg(especie?: string | null): string {
  const e = (especie ?? "").toLowerCase();
  if (e.startsWith("gat")) return gatoImg; // "Gato"
  return perroImg; // "Perro" y valores desconocidos
}

/**
 * Devuelve la foto real del animal si existe; en caso contrario, la caricatura
 * correspondiente a su especie.
 */
export function animalImg(
  fotografiaUrl?: string | null,
  especie?: string | null,
): string {
  const url = fotografiaUrl?.trim();
  return url ? url : especieImg(especie);
}
