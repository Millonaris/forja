/*
 * FORJA · Plan de carrera 0 → 20K — plan FINAL del entrenador (agosto 2026),
 * anclado a fechas reales: empieza el viernes 14-ago-2026 y termina con el
 * 20K el sábado 13-feb-2027.
 *
 * Fase 1 (S1-S8):   intervalos corre/camina (CaCo). La S1 fueron 2 sesiones
 *                   (vie 14 y lun 17 ago); desde la S2 el entrenador subió a
 *                   3 CaCo/semana: MARTES, JUEVES y SÁBADO, misma progresión.
 * Fase 2 (S9-S16):  3 días/semana, MARTES y JUEVES (cortas) + SÁBADO (larga
 *                   de 5 a 10 km). Descargas en S12 y S16. Entre fases hay
 *                   unos días de transición (4-12 oct) sin carreras: no es un
 *                   hueco, es a propósito.
 * Fase 3 (S17-S26): igual; larga hasta 18 km (S25). Descargas S20 y S24.
 *                   S26: solo un rodaje suave el martes y el 20K el sábado.
 *
 * Todo se corre SUAVE (Z2: poder hablar sin ahogarse, tramos de correr
 * ≤125 ppm). Los entrenos los hace con su reloj Garmin — la app no lleva
 * temporizador: enseña qué toca y deja marcar cada sesión como hecha.
 *
 * Si una semana pesa, se repite y TODO se desplaza 7 días: eso es lo que
 * mueve el `desfase` (elegido en Ajustes → "Semana de carrera").
 */

import { diasEntre, sumarDias } from "../logica/fechas.js";

export const SEMANAS_PLAN = 26;

/** Anclas reales del plan. Si el plan entero se mueve, se mueve con `desfase`. */
export const INICIO_F1 = "2026-08-14"; // viernes · primera sesión de S1
export const INICIO_MJS = "2026-08-18"; // martes de S2 · desde aquí se corre M-J-S
export const INICIO_F2 = "2026-10-13"; // martes · primera corta de S9
export const DIA_20K = "2027-02-13"; // sábado · el objetivo

/**
 * Protocolo de intervalos de la fase 1, en minutos.
 * reps × (corre + camina); la semana 8 es correr seguido.
 * Los nombres coinciden con los entrenos cargados en su Garmin ("S3 - 5x 3c 2a").
 */
export const INTERVALOS_F1 = {
  1: { reps: 8, corre: 1, camina: 2, texto: "8×(1′ corre + 2′ camina)" },
  2: { reps: 6, corre: 2, camina: 2, texto: "6×(2′ corre + 2′ camina)" },
  3: { reps: 5, corre: 3, camina: 2, texto: "5×(3′ corre + 2′ camina)" },
  4: { reps: 4, corre: 5, camina: 2, texto: "4×(5′ corre + 2′ camina)" },
  5: { reps: 3, corre: 8, camina: 3, texto: "3×(8′ corre + 3′ camina)" },
  6: { reps: 2, corre: 10, camina: 3, texto: "2×(10′ corre + 3′ camina)" },
  7: { reps: 2, corre: 15, camina: 3, texto: "2×(15′ corre + 3′ camina)" },
  8: { reps: 1, corre: 30, camina: 0, texto: "30′ seguidos" },
};

export const CALENTAMIENTO = 5; // min andando, antes y después, SIEMPRE
export const ENFRIAMIENTO = 5; // (el enfriamiento no se salta)

/** Minutos totales de una sesión de intervalos, con calentamiento y enfriamiento. */
export function minutosIntervalos(semana) {
  const p = INTERVALOS_F1[semana] ?? INTERVALOS_F1[1];
  return CALENTAMIENTO + p.reps * p.corre + (p.reps - 1) * p.camina + ENFRIAMIENTO;
}

/**
 * Minutos de las cortas (martes y jueves, iguales) por semana del plan.
 * En las descargas (12, 16, 20, 24) bajan a 30′ a propósito.
 */
export const CORTAS = {
  9: 30, 10: 30, 11: 35, 12: 30, 13: 35, 14: 35, 15: 35, 16: 30,
  17: 35, 18: 40, 19: 40, 20: 30, 21: 40, 22: 40, 23: 40, 24: 30, 25: 40, 26: 30,
};

/**
 * Tirada larga del sábado por semana, en km. `descarga: true` marca las
 * semanas en las que la larga BAJA a propósito para asimilar carga.
 */
export const LARGAS = {
  // Fase 2
  9: { km: 5 },
  10: { km: 6 },
  11: { km: 7 },
  12: { km: 5, descarga: true },
  13: { km: 8 },
  14: { km: 9 },
  15: { km: 10, nota: "mitad del objetivo" },
  16: { km: 6, descarga: true },
  // Fase 3
  17: { km: 11 },
  18: { km: 12 },
  19: { km: 13 },
  20: { km: 8, descarga: true },
  21: { km: 14 },
  22: { km: 15 },
  23: { km: 16 },
  24: { km: 10, descarga: true },
  25: { km: 18, nota: "la larga máxima: de aquí no se pasa" },
  26: { km: 20, carrera: true }, // el 20K, sábado 13-feb-2027
};

/** Fase (1, 2 o 3) a la que pertenece una semana del plan. */
export function faseDeSemana(semana) {
  if (semana <= 8) return 1;
  if (semana <= 16) return 2;
  return 3;
}

/** Etiqueta de la fase para la barra de progreso de HOY. */
export const FASES = [
  { n: 1, nombre: "F1 BASE", desde: 1, hasta: 8 },
  { n: 2, nombre: "F2 CARGA", desde: 9, hasta: 16 },
  { n: 3, nombre: "F3 20K", desde: 17, hasta: 26 },
];

/* ---------- Las sesiones, día a día ---------- */

function sesionIntervalos(semana) {
  return {
    tipo: "intervalos",
    etiqueta: "INTERVALOS",
    detalle: INTERVALOS_F1[semana].texto,
    minutos: minutosIntervalos(semana),
    km: null,
  };
}

function sesionCorta(semana) {
  const esTaper = semana === SEMANAS_PLAN;
  return {
    tipo: "corta",
    etiqueta: esTaper ? "TAPER" : "CARRERA CORTA",
    detalle: esTaper ? "30 min muy suaves" : `${CORTAS[semana]} min suaves`,
    minutos: CORTAS[semana],
    km: null,
  };
}

function sesionLarga(semana) {
  const larga = LARGAS[semana];
  return {
    tipo: "larga",
    etiqueta: larga.carrera ? "DÍA DEL 20K" : "TIRADA LARGA",
    detalle: larga.carrera
      ? "20 km · el objetivo de las 26 semanas. Sal MÁS lento de lo que te pida el cuerpo."
      : larga.descarga
        ? `${larga.km} km · semana de descarga`
        : `${larga.km} km a ritmo muy suave${larga.nota ? ` · ${larga.nota}` : ""}`,
    km: larga.km,
    minutos: null,
    esCarreraObjetivo: !!larga.carrera,
    descarga: !!larga.descarga,
  };
}

/** Mapa fecha ISO → sesión, con las fechas REALES que dio el entrenador. */
const SESIONES = (() => {
  const m = new Map();
  // S1 fue la excepción: viernes 14 y lunes 17 de agosto, ya hechas.
  m.set(INICIO_F1, { semana: 1, ...sesionIntervalos(1) });
  m.set(sumarDias(INICIO_F1, 3), { semana: 1, ...sesionIntervalos(1) });
  // S2-S8: tres CaCo por semana, martes + jueves + sábado. Excepción del
  // supercontexto: en las dos semanas del mini-cut (S3 y S4) la tercera
  // sesión pasa al DOMINGO, porque el sáb 29 es día visual (mini-pump como
  // mucho) y el sáb 5 es descanso antes de la Pierna A del lunes.
  for (let s = 2; s <= 8; s++) {
    const martes = sumarDias(INICIO_MJS, (s - 2) * 7);
    for (const salto of [0, 2, s === 3 || s === 4 ? 5 : 4]) {
      m.set(sumarDias(martes, salto), { semana: s, ...sesionIntervalos(s) });
    }
  }
  for (let s = 9; s <= SEMANAS_PLAN; s++) {
    const martes = sumarDias(INICIO_F2, (s - 9) * 7);
    m.set(martes, { semana: s, ...sesionCorta(s) });
    // La semana 26 solo tiene el rodaje del martes y el 20K: nada de jueves.
    if (s < SEMANAS_PLAN) {
      m.set(sumarDias(martes, 2), { semana: s, ...sesionCorta(s) });
      m.set(sumarDias(martes, 4), { semana: s, ...sesionLarga(s) });
    } else {
      m.set(DIA_20K, { semana: s, ...sesionLarga(s) });
    }
  }
  return m;
})();

/**
 * Qué carrera toca en una fecha, o null si ese día no se corre.
 * `desfase` en semanas: -1 = el plan va una semana por detrás (se repitió una).
 */
export function sesionCarreraDelDia(iso, desfase = 0) {
  return SESIONES.get(desfase ? sumarDias(iso, 7 * desfase) : iso) ?? null;
}

/**
 * Semana del plan (puede salir <1 antes de empezar o >26 tras el 20K).
 * S1 va del 14 al 17 de agosto; desde la S2 las semanas van de martes a lunes.
 */
export function semanaCarreraPorFecha(iso, desfase = 0) {
  const efectivo = desfase ? sumarDias(iso, 7 * desfase) : iso;
  if (efectivo < INICIO_MJS) return Math.min(1, Math.floor(diasEntre(INICIO_F1, efectivo) / 7) + 1);
  if (efectivo < INICIO_F2) return Math.min(8, Math.floor(diasEntre(INICIO_MJS, efectivo) / 7) + 2);
  return Math.min(SEMANAS_PLAN + 1, Math.floor(diasEntre(INICIO_F2, efectivo) / 7) + 9);
}

/**
 * Las sesiones distintas de una semana, para el selector manual de la
 * pantalla Carrera (hacer hoy una sesión de otra semana u otra fase).
 * En F1 las dos sesiones son iguales: se enseña una sola.
 */
export function sesionesDeSemanaCarrera(semana) {
  const s = Math.min(Math.max(semana, 1), SEMANAS_PLAN);
  return s <= 8 ? [sesionIntervalos(s)] : [sesionCorta(s), sesionLarga(s)];
}
