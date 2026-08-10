/*
 * FORJA · Volumen semanal por grupo muscular.
 *
 * En hipertrofia el volumen manda: el rango útil son 10-20 series duras por
 * músculo y semana. Por debajo el músculo no recibe suficiente estímulo;
 * por encima solo acumulas fatiga que después te cobra el rendimiento.
 *
 * Las series del músculo principal cuentan enteras y las del que solo ayuda
 * cuentan media: el bíceps trabaja en un jalón, pero no como en un curl, y
 * sumarlo entero inflaría el recuento hasta volverlo inútil.
 *
 * Solo cuentan las series "duras" — las que se hacen cerca del fallo. Una
 * serie con RIR 3+ estimula menos, así que cuenta media. Las series sin RIR
 * anotado se cuentan enteras: es lo que había antes de existir el dato.
 */

import { EJERCICIOS_POR_ID } from "../datos/ejercicios.js";
import { MUSCULOS, objetivoDe } from "../datos/musculos.js";
import { lunesDe } from "./fechas.js";

/** Cuánto cuenta una serie según lo cerca del fallo que se hizo. */
function pesoDeSerie(serie) {
  if (serie.rir == null) return 1; // sin dato: se cuenta entera
  if (serie.rir >= 3) return 0.5; // sobraba mucho: estímulo parcial
  return 1;
}

/**
 * Series por músculo en una ventana de semanas.
 *
 * @param sets      todas las series guardadas
 * @param sesiones  Map id → sesión (para conocer la fecha de cada serie)
 * @param semanas   cuántas semanas naturales hacia atrás desde `hasta`
 * @returns [{ musculo, nombre, porSemana: [{lunes, series}], media, ultima }]
 */
export function seriesPorMusculo(sets, sesiones, hasta, semanas = 4) {
  const lunesActual = lunesDe(hasta);
  const lunesInicio = restarSemanas(lunesActual, semanas - 1);

  // musculo → lunes → recuento
  const acumulado = new Map();
  const sumar = (musculo, lunes, cantidad) => {
    if (!acumulado.has(musculo)) acumulado.set(musculo, new Map());
    const porSemana = acumulado.get(musculo);
    porSemana.set(lunes, (porSemana.get(lunes) || 0) + cantidad);
  };

  for (const serie of sets) {
    if (serie.isWarmup) continue;
    const sesion = sesiones.get(serie.sessionId);
    if (!sesion) continue;

    const lunes = lunesDe(sesion.date);
    if (lunes < lunesInicio || lunes > lunesActual) continue;

    const ejercicio = EJERCICIOS_POR_ID.get(serie.exerciseId);
    if (!ejercicio) continue;

    const peso = pesoDeSerie(serie);
    for (const m of ejercicio.musculos) sumar(m, lunes, peso);
    for (const m of ejercicio.secundarios || []) sumar(m, lunes, peso * 0.5);
  }

  const listaLunes = Array.from({ length: semanas }, (_, i) => restarSemanas(lunesActual, semanas - 1 - i));

  return Object.keys(MUSCULOS)
    .map((musculo) => {
      const porSemana = listaLunes.map((lunes) => ({
        lunes,
        series: Math.round((acumulado.get(musculo)?.get(lunes) || 0) * 2) / 2,
      }));

      // La semana en curso NO entra en la media: está a medias por definición,
      // y un lunes por la mañana haría que todo pareciera falta de volumen.
      const completas = porSemana.slice(0, -1).filter((s) => s.series > 0);

      return {
        musculo,
        nombre: MUSCULOS[musculo],
        porSemana,
        enCurso: porSemana[porSemana.length - 1].series,
        // El veredicto se da sobre la media de semanas completas: en
        // hipertrofia una semana suelta es ruido, la tendencia es la señal.
        media: completas.length ? completas.reduce((t, s) => t + s.series, 0) / completas.length : null,
        semanasCompletas: completas.length,
      };
    })
    .filter((m) => m.media > 0 || m.enCurso > 0)
    .sort((a, b) => (b.media ?? 0) - (a.media ?? 0));
}

/**
 * Veredicto de una fila del volumen: por debajo, en rango o pasado.
 *
 * `series` debe ser la media de semanas COMPLETAS, no la semana en curso.
 * El objetivo se lee por músculo: hay decisiones del plan (pecho moderado,
 * deltoides lateral empujado) que el rango general se llevaría por delante.
 */
export function estadoVolumen(series, musculo) {
  const objetivo = objetivoDe(musculo);

  if (series == null) {
    return { estado: "sin_datos", color: "texto3", texto: "aún sin una semana completa", objetivo };
  }
  if (series < objetivo.min) {
    // Un músculo que se lleva a propósito en volumen bajo no "va corto":
    // simplemente está por debajo de su suelo, y eso solo importa si baja tanto
    // que deja de mantener.
    return {
      estado: "bajo",
      color: "aviso",
      texto: objetivo.mantener
        ? `por debajo del mínimo para mantener (${objetivo.min})`
        : `poco para crecer (mín. ${objetivo.min})`,
      objetivo,
    };
  }
  if (series > objetivo.max) {
    return {
      estado: "alto",
      color: objetivo.mantener ? "aviso" : "alerta",
      texto: objetivo.mantener
        ? `más de lo que pide el plan (máx. ${objetivo.max})`
        : `pasado de volumen (máx. ${objetivo.max})`,
      objetivo,
    };
  }
  return {
    estado: "ok",
    color: "ok",
    texto: objetivo.mantener ? "en el volumen que toca" : "en rango",
    objetivo,
  };
}

const restarSemanas = (iso, n) => {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(a, m - 1, d - n * 7, 12);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
};
