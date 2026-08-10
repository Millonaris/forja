/*
 * FORJA · Fechas.
 *
 * Norma de la app: una fecha es SIEMPRE la cadena "YYYY-MM-DD" en hora local.
 * Nunca se usa toISOString() (convierte a UTC y en España nos come un día
 * entero durante el horario de verano). Todo se construye a mano.
 */

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const DIAS_CORTO = ["D", "L", "M", "X", "J", "V", "S"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const dosDigitos = (n) => String(n).padStart(2, "0");

/** Date → "YYYY-MM-DD" en hora local. */
export function aISO(fecha) {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** "YYYY-MM-DD" → Date a mediodía local (mediodía evita saltos por horario de verano). */
export function deISO(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d, 12, 0, 0, 0);
}

/** La fecha de hoy en formato ISO local. */
export function hoyISO() {
  return aISO(new Date());
}

/** Suma (o resta, con n negativo) días a una fecha ISO. */
export function sumarDias(iso, n) {
  const f = deISO(iso);
  f.setDate(f.getDate() + n);
  return aISO(f);
}

/** Días de diferencia entre dos fechas ISO (b − a). */
export function diasEntre(a, b) {
  return Math.round((deISO(b) - deISO(a)) / 86400000);
}

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export function diaSemana(iso) {
  const d = deISO(iso).getDay(); // 0 = domingo
  return d === 0 ? 7 : d;
}

/** El lunes de la semana a la que pertenece la fecha. */
export function lunesDe(iso) {
  return sumarDias(iso, -(diaSemana(iso) - 1));
}

/**
 * Semana del plan (1-based) a la que pertenece una fecha.
 * Se calcula por semanas naturales de lunes a domingo desde el lunes
 * de la semana de inicio, para que L-X-V y M-J-S caigan siempre donde toca.
 */
export function semanaDelPlan(fechaInicio, iso) {
  const base = lunesDe(fechaInicio);
  return Math.floor(diasEntre(base, lunesDe(iso)) / 7) + 1;
}

/** Fecha ISO del lunes de una semana concreta del plan. */
export function lunesDeSemana(fechaInicio, semana) {
  return sumarDias(lunesDe(fechaInicio), (semana - 1) * 7);
}

/** "miércoles 12 ago" */
export function formatoDia(iso) {
  const f = deISO(iso);
  return `${DIAS[f.getDay()]} ${f.getDate()} ${MESES_CORTO[f.getMonth()]}`;
}

/** "MIÉRCOLES 12 AGO" — para la etiqueta mono de la cabecera. */
export function formatoDiaMayus(iso) {
  return formatoDia(iso).toUpperCase();
}

/** "12 ago 2026" */
export function formatoCorto(iso) {
  const f = deISO(iso);
  return `${f.getDate()} ${MESES_CORTO[f.getMonth()]} ${f.getFullYear()}`;
}

/** "agosto 2026" */
export function formatoMes(iso) {
  const f = deISO(iso);
  return `${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

/** Inicial del día: L M X J V S D */
export function inicialDia(iso) {
  return DIAS_CORTO[deISO(iso).getDay()];
}

export const INICIALES_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

/** Los 7 días (ISO) de la semana que contiene la fecha, de lunes a domingo. */
export function semanaDe(iso) {
  const lunes = lunesDe(iso);
  return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
}

/** Texto relativo corto: "hoy", "ayer", "hace 3 días". */
export function haceCuanto(iso, referencia = hoyISO()) {
  const d = diasEntre(iso, referencia);
  if (d === 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 0) return `en ${-d} días`;
  if (d < 14) return `hace ${d} días`;
  const semanas = Math.floor(d / 7);
  return `hace ${semanas} semanas`;
}
