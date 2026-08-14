/*
 * FORJA · Peso: media móvil y tendencia.
 *
 * Solo peso. La dieta (kcal, macros, mantenimiento) se lleva en Fitia, fuera
 * de la app, así que aquí no se calcula nada de comida.
 *
 * La pendiente se saca por regresión lineal y no restando el primer y el
 * último peso: así una retención de líquidos un día suelto no descuadra nada.
 */

import { diasEntre } from "./fechas.js";

/**
 * Media móvil de N días del peso. Suaviza el ruido diario (sal, agua, tránsito).
 * Devuelve [{ date, kg, media }] solo para los días con peso registrado.
 */
export function mediaMovil(registros, dias = 7) {
  const conPeso = registros.filter((r) => r.kg != null).sort((a, b) => a.date.localeCompare(b.date));
  return conPeso.map((r, i) => {
    const desde = Math.max(0, i - dias + 1);
    const ventana = conPeso.slice(desde, i + 1);
    return {
      date: r.date,
      kg: r.kg,
      media: ventana.reduce((t, x) => t + x.kg, 0) / ventana.length,
    };
  });
}

/**
 * Pendiente del peso en kg/día por mínimos cuadrados.
 * Devuelve null si no hay al menos 2 puntos separados en el tiempo.
 */
export function pendientePeso(registros) {
  const puntos = registros
    .filter((r) => r.kg != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ x: diasEntre(registros[0].date, r.date), y: r.kg }));

  if (puntos.length < 2) return null;

  const n = puntos.length;
  const sx = puntos.reduce((t, p) => t + p.x, 0);
  const sy = puntos.reduce((t, p) => t + p.y, 0);
  const sxy = puntos.reduce((t, p) => t + p.x * p.y, 0);
  const sxx = puntos.reduce((t, p) => t + p.x * p.x, 0);
  const denominador = n * sxx - sx * sx;
  if (denominador === 0) return null;

  return (n * sxy - sx * sy) / denominador;
}

/** Cambio de peso en kg por semana (negativo = estás bajando). */
export function tendenciaSemanal(registros) {
  const p = pendientePeso(registros);
  return p == null ? null : p * 7;
}
