/*
 * FORJA · Motor de calendario.
 *
 * Construye, para cada uno de los 182 días del plan (26 semanas), qué toca:
 * sesión de gimnasio (por rotación), carrera (por fase), postura y dieta.
 *
 * Aquí vive la REGLA CRÍTICA: la tirada larga nunca va justo detrás de un día
 * de pierna. Viernes TORSO → larga el sábado; viernes PIERNA → larga el
 * domingo. Las cortas del martes y el jueves no se mueven nunca.
 * El 20K de la semana 26 es siempre en domingo, digan lo que digan los viernes.
 *
 * El calendario se calcula una sola vez por fecha de inicio y se memoiza:
 * la pantalla de Diario pinta 26 semanas sin recalcular nada.
 *
 * `desfase` recoloca SOLO el plan de carrera: si repites una semana o saltas
 * de fase, en Ajustes eliges la semana que toca y aquí se aplica la
 * diferencia. El gimnasio, la postura y la dieta no se mueven — un desfase
 * negativo (repetir) solo alarga el calendario para que el 20K siga dentro.
 */

import { NOMBRES_SESION, esSesionPierna } from "../datos/ejercicios.js";
import {
  claveIntervalos,
  faseDeSemana,
  LARGAS,
  INTERVALOS_F1,
  minutosCorta,
  minutosIntervalos,
} from "../datos/planCarrera.js";
import { DIAS_EXTRAS } from "../datos/rutinaPostural.js";
import { diaSemana, lunesDe, semanaDelPlan, sumarDias } from "./fechas.js";

export const SEMANAS_PLAN = 26;

/** Días de gimnasio: lunes, miércoles y viernes. */
const DIAS_GYM = [1, 3, 5];

const cache = new Map();

/**
 * Devuelve el calendario completo del plan: Map<"YYYY-MM-DD", planDelDía>.
 *
 * planDelDía = {
 *   iso, semana, fase, diaSemana,
 *   gym:     { sessionName, esPierna, aviso } | null,
 *   carrera: { tipo, etiqueta, detalle, km, minutos, semanaIntervalos, movida } | null,
 *   postura: bool,   conExtras: bool,
 *   dieta:   true,
 * }
 */
export function construirCalendario(fechaInicio, desfase = 0) {
  const claveCache = `${fechaInicio}|${desfase}`;
  if (cache.has(claveCache)) return cache.get(claveCache);

  const lunes1 = lunesDe(fechaInicio);
  const dias = new Map();

  // Con desfase negativo (repetir semanas) el plan de carrera termina más
  // tarde: el calendario se alarga para que el 20K no se caiga del mapa.
  const totalSemanas = SEMANAS_PLAN + Math.max(0, -desfase);

  // 1) Gimnasio: se recorren TODOS los días de gym del plan en orden y se les
  //    va asignando la rotación T-P-T-P. Por eso la misma sesión no cae siempre
  //    en el mismo día de la semana.
  let indiceRotacion = 0;
  const gymPorDia = new Map();
  for (let semana = 1; semana <= totalSemanas; semana++) {
    for (const dow of DIAS_GYM) {
      const iso = sumarDias(lunes1, (semana - 1) * 7 + (dow - 1));
      const sessionName = NOMBRES_SESION[indiceRotacion % NOMBRES_SESION.length];
      indiceRotacion++;
      gymPorDia.set(iso, sessionName);
    }
  }

  // 2) Día a día: se junta gym + carrera + postura + dieta.
  for (let semana = 1; semana <= totalSemanas; semana++) {
    // La semana DEL PLAN DE CARRERA puede no coincidir con la del calendario:
    // el desfase elegido en Ajustes las separa.
    const semanaCarrera = semana + desfase;
    const enPlanCarrera = semanaCarrera >= 1 && semanaCarrera <= SEMANAS_PLAN;
    const fase = faseDeSemana(Math.min(Math.max(semanaCarrera, 1), SEMANAS_PLAN));

    // ¿El viernes de esta semana es de pierna? De eso depende dónde va la larga:
    // viernes torso → larga el sábado; viernes pierna → larga el domingo.
    const isoViernes = sumarDias(lunes1, (semana - 1) * 7 + 4);
    const viernesEsPierna = esSesionPierna(gymPorDia.get(isoViernes) || "");
    const largaAlDomingo = viernesEsPierna && fase >= 2 && semanaCarrera < SEMANAS_PLAN;

    for (let i = 0; i < 7; i++) {
      const iso = sumarDias(lunes1, (semana - 1) * 7 + i);
      const dow = i + 1; // 1 = lunes … 7 = domingo

      const sessionName = gymPorDia.get(iso) || null;
      const esPierna = sessionName ? esSesionPierna(sessionName) : false;

      dias.set(iso, {
        iso,
        semana,
        semanaCarrera: enPlanCarrera ? semanaCarrera : null,
        fase,
        diaSemana: dow,
        gym: sessionName
          ? {
              sessionName,
              esPierna,
              // Recordatorio de activación antes de cada día de pierna, y en
              // las semanas de taper (25-26) la orden del entrenador: la
              // pierna se baja a la mitad para llegar fresco al 20K.
              aviso: esPierna
                ? enPlanCarrera && semanaCarrera >= 25
                  ? "Semana de taper: pierna a MITAD de peso y volumen. Nada nuevo."
                  : "Antes de empezar: bisagra de cadera 2×8."
                : null,
            }
          : null,
        carrera: enPlanCarrera
          ? planCarreraDelDia({ semana: semanaCarrera, fase, dow, largaAlDomingo })
          : null,
        // La rutina postural se planifica de lunes a sábado (objetivo 5-6 días).
        postura: dow <= 6,
        conExtras: DIAS_EXTRAS.includes(dow),
        dieta: true,
      });
    }
  }

  cache.set(claveCache, dias);
  return dias;
}

/** Qué carrera toca ese día concreto, o null si ese día no se corre. */
function planCarreraDelDia({ semana, fase, dow, largaAlDomingo }) {
  // ---- Fase 1: martes y sábado, intervalos corre/camina ----
  if (fase === 1) {
    if (dow !== 2 && dow !== 6) return null;
    const clave = claveIntervalos(semana, dow);
    const p = INTERVALOS_F1[clave];
    return {
      tipo: "intervalos",
      etiqueta: "INTERVALOS",
      detalle: p.texto,
      minutos: minutosIntervalos(clave),
      semanaIntervalos: clave,
      km: null,
      movida: false,
    };
  }

  // ---- Fases 2 y 3: martes y jueves cortas, larga el sábado o el domingo ----
  if (dow !== 2 && dow !== 4 && dow !== 6 && dow !== 7) return null;

  const larga = LARGAS[semana];
  // El 20K es en domingo sí o sí; el resto de largas siguen la regla del viernes.
  const diaDeLarga = semana === SEMANAS_PLAN || largaAlDomingo ? 7 : 6;

  if (dow === diaDeLarga && larga) {
    return {
      tipo: "larga",
      etiqueta: larga.carrera ? "DÍA DEL 20K" : "TIRADA LARGA",
      detalle: larga.carrera
        ? "20 km · el objetivo de las 26 semanas. Sal MÁS lento de lo que te pida el cuerpo."
        : larga.descarga
          ? `${larga.rango ?? formateaKm(larga.km)} km · semana de descarga`
          : `${larga.rango ?? formateaKm(larga.km)} km a ritmo muy suave${larga.nota ? ` · ${larga.nota}` : ""}`,
      km: larga.km,
      minutos: null,
      esCarreraObjetivo: !!larga.carrera,
      descarga: !!larga.descarga,
      // Se marca cuándo y por qué se ha movido, para explicarlo en pantalla.
      movida: largaAlDomingo && !larga.carrera,
      motivoMovida: largaAlDomingo && !larga.carrera ? "Al domingo: el viernes toca pierna." : null,
    };
  }

  // Las cortas solo caen en martes y jueves; el otro día del finde no se corre.
  if (dow !== 2 && dow !== 4) return null;

  // Semana 26: los días previos al 20K son taper, no entrenos normales.
  if (semana === SEMANAS_PLAN) {
    if (dow === 2) return { tipo: "corta", etiqueta: "TAPER", detalle: "25-30 min muy suaves", minutos: 30, km: null, movida: false };
    if (dow === 4) return { tipo: "corta", etiqueta: "TAPER", detalle: "20 min flojos + 2-3 aceleraciones de 15″", minutos: 20, km: null, movida: false };
  }

  // Semana 25: taper 1 — el volumen baja al 60-70 %, también en las cortas.
  if (semana === SEMANAS_PLAN - 1) {
    if (dow === 2) return { tipo: "corta", etiqueta: "TAPER", detalle: "30 min suaves", minutos: 30, km: null, movida: false };
    if (dow === 4) return { tipo: "corta", etiqueta: "TAPER", detalle: "30-35 min suaves", minutos: 30, minutosMax: 35, km: null, movida: false };
  }

  const corta = minutosCorta(semana, dow);
  return {
    tipo: "corta",
    etiqueta: "CARRERA CORTA",
    detalle: corta.texto,
    minutos: corta.min,
    minutosMax: corta.max,
    km: null,
    movida: false,
  };
}

// 15.5 km → "15,5" · 12 km → "12"
const formateaKm = (km) => (Number.isInteger(km) ? String(km) : String(km).replace(".", ","));

/** Plan de un día suelto. Devuelve null si la fecha cae fuera del calendario. */
export function planDelDia(fechaInicio, iso, desfase = 0) {
  return construirCalendario(fechaInicio, desfase).get(iso) || null;
}

/**
 * Semana del PLAN DE CARRERA que toca en una fecha, con el desfase elegido
 * en Ajustes ya aplicado. Puede salir <1 o >26 si la fecha cae fuera del plan.
 */
export function semanaCarreraDe(ajustes, iso) {
  return semanaDelPlan(ajustes.startDate, iso) + (ajustes.desfaseCarrera || 0);
}

/**
 * Sesión de gimnasio proyectada para una fecha, aunque caiga fuera del plan.
 * Se usa cuando el plan ya ha terminado pero se sigue entrenando.
 */
export function sesionGymProyectada(fechaInicio, iso) {
  const delPlan = planDelDia(fechaInicio, iso);
  if (delPlan) return delPlan.gym?.sessionName ?? null;
  if (!DIAS_GYM.includes(diaSemana(iso))) return null;
  // Fuera del plan se sigue la misma rotación contando días de gym transcurridos.
  const semanasFuera = Math.floor(
    (new Date(iso.replace(/-/g, "/")) - new Date(lunesDe(fechaInicio).replace(/-/g, "/"))) / (7 * 86400000),
  );
  const indiceDow = DIAS_GYM.indexOf(diaSemana(iso));
  const indice = semanasFuera * DIAS_GYM.length + indiceDow;
  return NOMBRES_SESION[((indice % 4) + 4) % 4];
}

/** Próximo día (desde `iso` hacia delante) en el que toca esa sesión de gym. */
export function proximaVezQueToca(fechaInicio, iso, sessionName) {
  const cal = construirCalendario(fechaInicio);
  let cursor = sumarDias(iso, 1);
  for (let i = 0; i < 60; i++) {
    const dia = cal.get(cursor);
    if (dia?.gym?.sessionName === sessionName) return cursor;
    cursor = sumarDias(cursor, 1);
  }
  return null;
}
