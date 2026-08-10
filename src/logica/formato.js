/*
 * FORJA · Formato de números en español.
 * Coma decimal y espacio fino como separador de millares: 96,2 kg · 2 780 kcal.
 */

const ESPACIO_FINO = " ";

/** Número con N decimales y coma decimal. Devuelve "—" si no hay dato. */
export function num(valor, decimales = 1) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toFixed(decimales).replace(".", ",");
}

/** Entero con separador de millares fino: 2780 → "2 780". */
export function entero(valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return Math.round(valor)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ESPACIO_FINO);
}

/** Peso: "96,2". Sin unidad, para poder maquetar el "kg" más pequeño. */
export const peso = (v) => num(v, 1);

/** Kilos de una serie: sin decimal si es entero (45 en vez de 45,0). */
export function kgSerie(v) {
  if (v === null || v === undefined) return "—";
  return Number.isInteger(v) ? String(v) : num(v, 1);
}

/** Número con signo delante: +2,5 / −0,4. Usa el menos tipográfico. */
export function conSigno(valor, decimales = 1) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  if (valor > 0) return `+${num(valor, decimales)}`;
  if (valor < 0) return `−${num(Math.abs(valor), decimales)}`;
  return num(0, decimales);
}

/** Entero con signo y separador de millares: +1 322 / −430. */
export function conSignoEntero(valor) {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  const signo = valor > 0 ? "+" : valor < 0 ? "−" : "";
  return `${signo}${entero(Math.abs(valor))}`;
}

/** Segundos → "12:04" (o "1:04:22" si pasa de la hora). */
export function reloj(segundos) {
  const s = Math.max(0, Math.round(segundos));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
  return `${m}:${String(seg).padStart(2, "0")}`;
}

/** Minutos → "55 min" o "1 h 12 min". */
export function duracion(minutos) {
  if (!minutos && minutos !== 0) return "—";
  const m = Math.round(minutos);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  return resto ? `${h} h ${resto} min` : `${h} h`;
}

/** Ritmo en min/km a partir de km y minutos: "6:24". */
export function ritmo(km, minutos) {
  if (!km || !minutos) return "—";
  const segPorKm = (minutos * 60) / km;
  return reloj(segPorKm);
}

/** "45×10" o "45×10/lado" o "35 s" según el tipo de ejercicio. */
export function serieTexto(kg, reps, tipo = "reps") {
  if (tipo === "tiempo") return `${reps}${ESPACIO_FINO}s`;
  const carga = kg ? `${kgSerie(kg)}×` : "";
  return `${carga}${reps}${tipo === "reps_lado" ? "/lado" : ""}`;
}
