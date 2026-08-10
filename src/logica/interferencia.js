/*
 * FORJA · Interferencia entre correr y entrenar pierna.
 *
 * Es el problema central del entrenamiento híbrido: correr y hacer pierna
 * compiten por la misma recuperación. Una tirada larga deja los cuádriceps,
 * isquios y glúteos fatigados 24-48 h, así que una sesión de pierna pegada a
 * una larga da números bajos aunque tu fuerza real no haya bajado.
 *
 * Esto importa por dos motivos distintos:
 *  1. ANTES: avisarte para que no interpretes mal la sesión.
 *  2. DESPUÉS: que el motor de veredictos NO cante estancamiento cuando la
 *     causa es una tirada larga y no el plan de fuerza. Sin esto la app te
 *     mandaría descargar por algo que se arregla moviendo un día el calendario.
 */

import { esSesionPierna } from "../datos/ejercicios.js";
import { EJERCICIOS_POR_ID } from "../datos/ejercicios.js";
import { MUSCULOS_DE_CORRER } from "../datos/musculos.js";
import { diasEntre } from "./fechas.js";

/** Horas de sombra que deja cada tipo de carrera sobre las piernas. */
const SOMBRA_DIAS = { larga: 2, corta: 1, intervalos: 1 };

/** Km a partir de los cuales una tirada pesa de verdad en las piernas. */
const KM_LARGA = 8;

/**
 * ¿Hay una carrera reciente que explique unos números bajos de pierna?
 *
 * @param carreras  lista de carreras registradas
 * @param fecha     día de la sesión de gimnasio
 * @returns { afecta, motivo, carrera } — `afecta` es false si nada interfiere
 */
export function interferenciaEnFecha(carreras, fecha) {
  let peor = null;

  for (const c of carreras) {
    const dias = diasEntre(c.date, fecha);
    if (dias < 0) continue; // la carrera es posterior: no cuenta

    const esLarga = c.type === "larga" || (c.km || 0) >= KM_LARGA;
    const sombra = esLarga ? SOMBRA_DIAS.larga : (SOMBRA_DIAS[c.type] ?? 1);
    if (dias > sombra) continue;

    // Se queda la más exigente de las que aún proyectan sombra.
    if (!peor || (c.km || 0) > (peor.carrera.km || 0)) {
      peor = { carrera: c, dias, esLarga };
    }
  }

  if (!peor) return { afecta: false };

  const cuando = peor.dias === 0 ? "hoy mismo" : peor.dias === 1 ? "ayer" : `hace ${peor.dias} días`;
  const que = peor.esLarga ? `una tirada de ${String(peor.carrera.km).replace(".", ",")} km` : "una carrera";

  return {
    afecta: true,
    carrera: peor.carrera,
    dias: peor.dias,
    motivo: `corriste ${que} ${cuando}`,
  };
}

/** ¿Este ejercicio usa músculos que la carrera deja tocados? */
export function ejercicioAfectadoPorCorrer(ejercicio) {
  const todos = [...(ejercicio.musculos || []), ...(ejercicio.secundarios || [])];
  return todos.some((m) => MUSCULOS_DE_CORRER.includes(m));
}

/**
 * Interferencia aplicable a un ejercicio concreto, mirando las sesiones en
 * las que se ha estancado. Solo cuenta si el ejercicio usa piernas Y las
 * sesiones planas caen tras carreras.
 */
export function interferenciaEnHistorial(ejercicio, historial, carreras, planas) {
  if (!ejercicioAfectadoPorCorrer(ejercicio)) return { afecta: false };
  if (!carreras?.length || !historial?.length) return { afecta: false };

  const ventana = historial.slice(-planas);
  const afectadas = ventana
    .map((s) => interferenciaEnFecha(carreras, s.date))
    .filter((i) => i.afecta);

  // Con que la mitad de las sesiones planas vengan tras carrera, la causa
  // más probable es la fatiga prestada y no el plan de fuerza.
  if (afectadas.length < Math.ceil(ventana.length / 2)) return { afecta: false };

  return {
    afecta: true,
    motivo:
      afectadas.length === ventana.length
        ? "todas esas sesiones cayeron con una carrera reciente encima"
        : `${afectadas.length} de esas ${ventana.length} sesiones cayeron con una carrera reciente encima`,
  };
}

/**
 * Aviso para la pantalla de HOY antes de un día de pierna.
 * Devuelve null si no toca pierna o si no hay carrera reciente.
 */
export function avisoAntesDePierna(sessionName, carreras, fecha) {
  if (!sessionName || !esSesionPierna(sessionName)) return null;
  const inter = interferenciaEnFecha(carreras, fecha);
  if (!inter.afecta) return null;

  return {
    titulo: "Vienes de correr.",
    texto: `Hoy toca pierna y ${inter.motivo}. Es normal mover menos peso: no bajes el plan por esta sesión, y si algo se queda corto anótalo con el RIR para que no cuente como estancamiento.`,
  };
}

/** Ejercicios de una sesión que van a notar la carrera, para el aviso. */
export function ejerciciosAfectados(ejercicios) {
  return ejercicios.filter((e) => ejercicioAfectadoPorCorrer(EJERCICIOS_POR_ID.get(e.id) || e));
}
