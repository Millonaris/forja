/*
 * FORJA · Plan de carrera 0 → 20 km — plan DEFINITIVO del entrenador
 * (21-ago-2026): 30 semanas, sin fecha de carrera ni cronómetro. El objetivo
 * es correr 20 km seguidos cómodo, no rápido: "primero hacemos un corredor;
 * después haremos un corredor rápido".
 *
 * Fase 1 (S1-S10):  aprender a correr. Intervalos corre/camina que acaban en
 *                   30 minutos CONTINUOS en la S10 (hito 1). S1-S2 son 2 días;
 *                   desde la S3, tres: MARTES + JUEVES + DOMINGO.
 * Fase 2 (S11-S18): crear el motor, por MINUTOS. La tirada del domingo sube
 *                   de 35 a 60 min (hito 2 en la S17); las semanas 14 y 18
 *                   bajan a propósito (absorber, no retroceder).
 * Fase 3 (S19-S30): por KILÓMETROS. La larga sube de 8 a 18 km con descargas
 *                   en 22, 26 y 29, y la S30 cierra con los 20 km (hito 4).
 *                   Los 10 km de la S21 son el hito 3.
 *
 * Las 4 reglas: todo fácil (poder hablar, esfuerzo 3-4/10) · nunca dos días
 * seguidos corriendo · una semana que pesa se REPITE (con `desfase` en
 * Ajustes; repetir no es fracasar) · el dolor manda (si aparece, no se
 * progresa). Nada de series, HIIT, tempos ni récords en todo el plan.
 *
 * Los entrenos se hacen con el reloj (Garmin): la app enseña qué toca y las
 * sesiones se marcan como hechas.
 */

import { diasEntre, sumarDias } from "../logica/fechas.js";

export const SEMANAS_PLAN = 30;

/** Anclas reales. Si el plan entero se mueve, se mueve con `desfase`. */
export const INICIO_F1 = "2026-08-14"; // viernes · primera sesión de la S1
export const INICIO_MJS = "2026-08-18"; // martes de la S2 · las semanas van de martes a lunes
export const DIA_20K = "2027-03-07"; // domingo de la S30 · los 20 km (si no se repite ninguna semana)

/**
 * Intervalos corre/camina de las semanas 1-9 (la 10 ya es correr seguido).
 * `corre` en minutos (la S2 son 90 segundos). Todas las sesiones llevan
 * 5-10 min andando antes y 5 después.
 */
export const INTERVALOS_F1 = {
  1: { reps: 6, corre: 1, camina: 2, texto: "6×(1′ corre + 2′ camina)" },
  2: { reps: 6, corre: 1.5, camina: 2, texto: "6×(1½′ corre + 2′ camina)" },
  3: { reps: 6, corre: 2, camina: 2, texto: "6×(2′ corre + 2′ camina)" },
  4: { reps: 5, corre: 3, camina: 2, texto: "5×(3′ corre + 2′ camina)" },
  5: { reps: 4, corre: 5, camina: 2, texto: "4×(5′ corre + 2′ camina)" },
  6: { reps: 3, corre: 7, camina: 2, texto: "3×(7′ corre + 2′ camina)" },
  7: { reps: 3, corre: 8, camina: 2, texto: "3×(8′ corre + 2′ camina)" },
  8: { reps: 2, corre: 12, camina: 2, texto: "2×(12′ corre + 2′ camina)" },
  9: { reps: 2, corre: 15, camina: 2, texto: "2×(15′ corre + 2′ camina)" },
};

export const CALENTAMIENTO = 5; // min andando antes (5-10) y 5 después, SIEMPRE
export const ENFRIAMIENTO = 5;

/** Minutos totales de una sesión de intervalos, con calentamiento y enfriamiento. */
export function minutosIntervalos(semana) {
  const p = INTERVALOS_F1[semana] ?? INTERVALOS_F1[1];
  return Math.round(CALENTAMIENTO + p.reps * p.corre + (p.reps - 1) * p.camina + ENFRIAMIENTO);
}

/**
 * Fase 2 (S11-S18), en minutos: [martes, jueves, domingo]. Las semanas con
 * `descarga` bajan a propósito para asimilar.
 */
export const MINUTOS_F2 = {
  11: { c1: 30, c2: 30, larga: 35 },
  12: { c1: 30, c2: 35, larga: 40 },
  13: { c1: 35, c2: 35, larga: 45 },
  14: { c1: 30, c2: 30, larga: 35, descarga: true },
  15: { c1: 35, c2: 40, larga: 50 },
  16: { c1: 35, c2: 40, larga: 55 },
  17: { c1: 40, c2: 40, larga: 60, nota: "60 minutos seguidos: hito 2" },
  18: { c1: 35, c2: 35, larga: 45, descarga: true },
};

/**
 * Fase 3 (S19-S30), en kilómetros: [martes, jueves, domingo].
 * La S30 es el objetivo: 20 km fáciles, sin cronómetro.
 */
export const KM_F3 = {
  19: { c1: 5, c2: 5, larga: 8 },
  20: { c1: 5, c2: 5, larga: 9 },
  21: { c1: 5, c2: 6, larga: 10, nota: "primeros 10 km: hito 3" },
  22: { c1: 5, c2: 5, larga: 8, descarga: true },
  23: { c1: 6, c2: 6, larga: 11 },
  24: { c1: 6, c2: 6, larga: 12.5 },
  25: { c1: 6, c2: 7, larga: 14 },
  26: { c1: 5, c2: 5, larga: 10, descarga: true },
  27: { c1: 7, c2: 7, larga: 16 },
  28: { c1: 7, c2: 8, larga: 18 },
  29: { c1: 5, c2: 6, larga: 12, descarga: true },
  30: { c1: 6, c2: 7, larga: 20, carrera: true },
};

/**
 * Resumen de la tirada del domingo por semana, para la rejilla del plan y el
 * selector de Ajustes: {min|km, descarga, carrera}.
 */
export const LARGAS = Object.fromEntries([
  ...Object.entries(MINUTOS_F2).map(([s, v]) => [s, { min: v.larga, descarga: !!v.descarga }]),
  ...Object.entries(KM_F3).map(([s, v]) => [s, { km: v.larga, descarga: !!v.descarga, carrera: !!v.carrera }]),
]);

/** Fase (1, 2 o 3) a la que pertenece una semana del plan. */
export function faseDeSemana(semana) {
  if (semana <= 10) return 1;
  if (semana <= 18) return 2;
  return 3;
}

/** Etiquetas de fase para las barras de progreso. */
export const FASES = [
  { n: 1, nombre: "F1 APRENDER", desde: 1, hasta: 10 },
  { n: 2, nombre: "F2 MOTOR", desde: 11, hasta: 18 },
  { n: 3, nombre: "F3 20K", desde: 19, hasta: 30 },
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

// La semana 10 es la primera de correr seguido: 25′ / 25′ / 30′.
function sesionContinua(minutos, esHito) {
  return {
    tipo: "corta",
    etiqueta: esHito ? "HITO 1 · 30′ SEGUIDOS" : "CARRERA CONTINUA",
    detalle: esHito
      ? "30 min seguidos, muy despacio. Si necesitas caminar un minuto, caminas: no pasa nada."
      : `${minutos} min seguidos, muy despacio (camina un minuto si te hace falta)`,
    minutos,
    km: null,
  };
}

function sesionCortaF2(min) {
  return { tipo: "corta", etiqueta: "CARRERA FÁCIL", detalle: `${min} min fáciles`, minutos: min, km: null };
}

function sesionLargaF2(v) {
  return {
    tipo: "larga",
    etiqueta: "TIRADA LARGA",
    detalle: `${v.larga} min muy fáciles${v.descarga ? " · semana de descarga (absorber, no retroceder)" : ""}${v.nota ? ` · ${v.nota}` : ""}`,
    minutos: v.larga,
    km: null,
    descarga: !!v.descarga,
  };
}

const kmTexto = (km) => String(km).replace(".", ",");

function sesionCortaF3(km) {
  return { tipo: "corta", etiqueta: "CARRERA FÁCIL", detalle: `${kmTexto(km)} km fáciles`, km, minutos: null };
}

function sesionLargaF3(v) {
  return {
    tipo: "larga",
    etiqueta: v.carrera ? "LOS 20 KM · EL OBJETIVO" : "TIRADA LARGA",
    detalle: v.carrera
      ? "20 km fáciles. No es una competición: sal tan tranquilo que los primeros 5 km parezcan ridículamente fáciles."
      : `${kmTexto(v.larga)} km muy fáciles${v.descarga ? " · semana de descarga (absorber, no retroceder)" : ""}${v.nota ? ` · ${v.nota}` : ""}`,
    km: v.larga,
    minutos: null,
    esCarreraObjetivo: !!v.carrera,
    descarga: !!v.descarga,
  };
}

/** Las sesiones [martes, jueves, domingo] de una semana (desde la S3). */
function sesionesSemana(s) {
  if (s <= 9) return [sesionIntervalos(s), sesionIntervalos(s), sesionIntervalos(s)];
  if (s === 10) return [sesionContinua(25), sesionContinua(25), sesionContinua(30, true)];
  if (s <= 18) {
    const v = MINUTOS_F2[s];
    return [sesionCortaF2(v.c1), sesionCortaF2(v.c2), sesionLargaF2(v)];
  }
  const v = KM_F3[s];
  return [sesionCortaF3(v.c1), sesionCortaF3(v.c2), sesionLargaF3(v)];
}

/** Mapa fecha ISO → sesión, con los días reales: martes, jueves y domingo. */
const SESIONES = (() => {
  const m = new Map();
  // S1: viernes 14 y lunes 17 de agosto (ya hechas, con el protocolo de 1′).
  m.set(INICIO_F1, { semana: 1, ...sesionIntervalos(1) });
  m.set(sumarDias(INICIO_F1, 3), { semana: 1, ...sesionIntervalos(1) });
  for (let s = 2; s <= SEMANAS_PLAN; s++) {
    const martes = sumarDias(INICIO_MJS, (s - 2) * 7);
    const [ses1, ses2, ses3] = sesionesSemana(s);
    // S2 todavía son 2 días (jueves y sábado, como salió en la app).
    // S3 también 2: el martes 25 es el regreso del viaje y el sábado 29 es
    // día visual, así que quedan jueves 27 y domingo 30.
    const dias =
      s === 2 ? [[2, ses1], [4, ses2]]
      : s === 3 ? [[2, ses1], [5, ses3]]
      : [[0, ses1], [2, ses2], [5, ses3]];
    for (const [salto, sesion] of dias) {
      m.set(sumarDias(martes, salto), { semana: s, ...sesion });
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
 * Semana del plan (puede salir <1 antes de empezar o >30 tras los 20 km).
 * La S1 va del 14 al 17 de agosto; desde la S2 las semanas van de martes a lunes.
 */
export function semanaCarreraPorFecha(iso, desfase = 0) {
  const efectivo = desfase ? sumarDias(iso, 7 * desfase) : iso;
  if (efectivo < INICIO_MJS) return Math.min(1, Math.floor(diasEntre(INICIO_F1, efectivo) / 7) + 1);
  return Math.min(SEMANAS_PLAN + 1, Math.floor(diasEntre(INICIO_MJS, efectivo) / 7) + 2);
}

/**
 * Las sesiones distintas de una semana, para el selector manual de la
 * pantalla Carrera (hacer hoy una sesión de otra semana u otra fase).
 */
export function sesionesDeSemanaCarrera(semana) {
  const s = Math.min(Math.max(semana, 1), SEMANAS_PLAN);
  const sesiones = sesionesSemana(s);
  return sesiones.filter((x, i) => sesiones.findIndex((y) => y.detalle === x.detalle) === i);
}
