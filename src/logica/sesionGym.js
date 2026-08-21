/*
 * FORJA · Estructura de una sesión de gimnasio.
 *
 * Los ejercicios sueltos y las superseries se agrupan en "bloques": lo que en
 * la práctica haces de una tacada antes de descansar. Por eso Torso B son
 * 8 ejercicios pero se anuncia como 6 bloques: dos de ellos son superseries.
 */

import { REGLAS_GYM, ejerciciosDe } from "../datos/ejercicios.js";
import { enRampaSuave } from "../datos/planDieta.js";
import { hoyISO } from "./fechas.js";

/** Segundos que se tarda en ejecutar una serie (sin contar el descanso). */
const SEG_POR_SERIE = 40;
/** Calentamiento general antes de empezar. */
const MIN_CALENTAMIENTO = 8;

/**
 * Series que tocan HOY de un ejercicio: durante la rampa de vuelta (26-ago a
 * 1-sep) se hace el 75-80 % del volumen (seriesLight); después, las completas.
 */
export function seriesDe(ejercicio, iso = hoyISO()) {
  return (enRampaSuave(iso) ? ejercicio.seriesLight : ejercicio.series) || 0;
}

/**
 * Agrupa los ejercicios de una sesión en bloques.
 * Devuelve [{ id, superserie, ejercicios: [...] }] en el orden de ejecución.
 */
export function bloquesDe(sessionName) {
  const ejercicios = ejerciciosDe(sessionName);
  const bloques = [];
  const indicePorSs = new Map();

  for (const ej of ejercicios) {
    if (ej.superset) {
      if (!indicePorSs.has(ej.superset)) {
        const bloque = { id: `ss-${ej.superset}`, superserie: ej.superset, ejercicios: [] };
        indicePorSs.set(ej.superset, bloque);
        bloques.push(bloque);
      }
      indicePorSs.get(ej.superset).ejercicios.push(ej);
    } else {
      bloques.push({ id: ej.id, superserie: null, ejercicios: [ej] });
    }
  }
  return bloques;
}

/** Número de bloques de la sesión: lo que se enseña como "N ejercicios". */
export const numeroBloques = (sessionName) => bloquesDe(sessionName).length;

/** Total de series de trabajo previstas en la sesión (Light en mini-cut). */
export function seriesPrevistas(sessionName, iso = hoyISO()) {
  return ejerciciosDe(sessionName).reduce((t, e) => t + seriesDe(e, iso), 0);
}

/** Duración estimada en minutos, redondeada a 5. */
export function duracionEstimada(sessionName, iso = hoyISO()) {
  let segundos = MIN_CALENTAMIENTO * 60;

  for (const bloque of bloquesDe(sessionName)) {
    if (bloque.superserie) {
      // En superserie se alternan los ejercicios y solo se descansa al cerrar la ronda.
      const rondas = Math.max(...bloque.ejercicios.map((e) => seriesDe(e, iso)));
      const ejecucion = bloque.ejercicios.length * SEG_POR_SERIE;
      segundos += rondas * (ejecucion + REGLAS_GYM.descansoSuperserie);
    } else {
      const ej = bloque.ejercicios[0];
      segundos += seriesDe(ej, iso) * (SEG_POR_SERIE + descansoDe(ej));
    }
  }

  return Math.round(segundos / 60 / 5) * 5;
}

/**
 * Descanso que toca tras una serie de este ejercicio, en segundos.
 * Grandes 2-3 min, aislados 90-120 s: sin prisa entre series.
 */
export function descansoDe(ejercicio) {
  if (ejercicio.superset) return REGLAS_GYM.descansoSuperserie;
  return ejercicio.aislado ? REGLAS_GYM.descansoAislado : REGLAS_GYM.descansoGrande;
}

/**
 * Lista plana de "pasos" del entreno en vivo: cada paso es una serie concreta
 * de un ejercicio concreto. En las superseries los pasos se intercalan
 * (A1, B1, A2, B2…) que es como se hace de verdad.
 */
export function pasosDe(sessionName, iso = hoyISO()) {
  const pasos = [];

  for (const bloque of bloquesDe(sessionName)) {
    if (bloque.superserie) {
      const rondas = Math.max(...bloque.ejercicios.map((e) => seriesDe(e, iso)));
      for (let ronda = 1; ronda <= rondas; ronda++) {
        for (const ej of bloque.ejercicios) {
          if (ronda <= seriesDe(ej, iso)) {
            pasos.push({
              ejercicio: ej,
              serie: ronda,
              totalSeries: seriesDe(ej, iso),
              bloque: bloque.id,
              superserie: bloque.superserie,
              // Solo se descansa al terminar el último ejercicio de la ronda.
              descansa: ej === bloque.ejercicios[bloque.ejercicios.length - 1],
            });
          }
        }
      }
    } else {
      const ej = bloque.ejercicios[0];
      for (let serie = 1; serie <= seriesDe(ej, iso); serie++) {
        pasos.push({
          ejercicio: ej,
          serie,
          totalSeries: seriesDe(ej, iso),
          bloque: bloque.id,
          superserie: null,
          descansa: true,
        });
      }
    }
  }

  return pasos;
}
