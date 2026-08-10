/*
 * FORJA · Motor de calendario.
 *
 * Construye, para cada uno de los 182 días del plan (26 semanas), qué toca:
 * sesión de gimnasio (por rotación), carrera (por fase), postura y dieta.
 *
 * Aquí vive la REGLA CRÍTICA: la tirada larga nunca va detrás de un día de
 * pierna. Si el viernes toca PIERNA A o PIERNA B, la larga se adelanta del
 * sábado al jueves y la corta del jueves se va al sábado.
 *
 * El calendario se calcula una sola vez por fecha de inicio y se memoiza:
 * la pantalla de Diario pinta 26 semanas sin recalcular nada.
 */

import { NOMBRES_SESION, esSesionPierna } from "../datos/ejercicios.js";
import {
  faseDeSemana,
  LARGAS,
  INTERVALOS_F1,
  minutosCorta,
  minutosIntervalos,
} from "../datos/planCarrera.js";
import { DIAS_EXTRAS } from "../datos/rutinaPostural.js";
import { diaSemana, lunesDe, sumarDias } from "./fechas.js";

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
export function construirCalendario(fechaInicio) {
  if (cache.has(fechaInicio)) return cache.get(fechaInicio);

  const lunes1 = lunesDe(fechaInicio);
  const dias = new Map();

  // 1) Gimnasio: se recorren TODOS los días de gym del plan en orden y se les
  //    va asignando la rotación T-P-T-P. Por eso la misma sesión no cae siempre
  //    en el mismo día de la semana.
  let indiceRotacion = 0;
  const gymPorDia = new Map();
  for (let semana = 1; semana <= SEMANAS_PLAN; semana++) {
    for (const dow of DIAS_GYM) {
      const iso = sumarDias(lunes1, (semana - 1) * 7 + (dow - 1));
      const sessionName = NOMBRES_SESION[indiceRotacion % NOMBRES_SESION.length];
      indiceRotacion++;
      gymPorDia.set(iso, sessionName);
    }
  }

  // 2) Día a día: se junta gym + carrera + postura + dieta.
  for (let semana = 1; semana <= SEMANAS_PLAN; semana++) {
    const fase = faseDeSemana(semana);

    // ¿El viernes de esta semana es de pierna? De eso depende dónde va la larga.
    const isoViernes = sumarDias(lunes1, (semana - 1) * 7 + 4);
    const viernesEsPierna = esSesionPierna(gymPorDia.get(isoViernes) || "");
    // La larga se adelanta al jueves salvo el día del 20K, que no se mueve.
    const largaAlJueves = viernesEsPierna && fase >= 2 && semana < SEMANAS_PLAN;

    for (let i = 0; i < 7; i++) {
      const iso = sumarDias(lunes1, (semana - 1) * 7 + i);
      const dow = i + 1; // 1 = lunes … 7 = domingo

      const sessionName = gymPorDia.get(iso) || null;
      const esPierna = sessionName ? esSesionPierna(sessionName) : false;

      dias.set(iso, {
        iso,
        semana,
        fase,
        diaSemana: dow,
        gym: sessionName
          ? {
              sessionName,
              esPierna,
              // Recordatorio de activación antes de cada día de pierna.
              aviso: esPierna ? "Antes de empezar: bisagra de cadera 2×8." : null,
            }
          : null,
        carrera: planCarreraDelDia({ semana, fase, dow, largaAlJueves, viernesEsPierna }),
        // La rutina postural se planifica de lunes a sábado (objetivo 5-6 días).
        postura: dow <= 6,
        conExtras: DIAS_EXTRAS.includes(dow),
        dieta: true,
      });
    }
  }

  cache.set(fechaInicio, dias);
  return dias;
}

/** Qué carrera toca ese día concreto, o null si ese día no se corre. */
function planCarreraDelDia({ semana, fase, dow, largaAlJueves, viernesEsPierna }) {
  // ---- Fase 1: solo martes y jueves, siempre intervalos ----
  if (fase === 1) {
    if (dow !== 2 && dow !== 4) return null;
    const p = INTERVALOS_F1[semana];
    return {
      tipo: "intervalos",
      etiqueta: "INTERVALOS",
      detalle: p.texto,
      minutos: minutosIntervalos(semana),
      semanaIntervalos: semana,
      km: null,
      movida: false,
    };
  }

  // ---- Fases 2 y 3: martes y jueves cortas, sábado larga ----
  if (dow !== 2 && dow !== 4 && dow !== 6) return null;

  const larga = LARGAS[semana];
  const corta = minutosCorta(semana);
  const diaDeLarga = largaAlJueves ? 4 : 6;

  if (dow === diaDeLarga && larga) {
    return {
      tipo: "larga",
      etiqueta: larga.carrera ? "DÍA DEL 20K" : "TIRADA LARGA",
      detalle: larga.carrera
        ? "20 km · el objetivo de las 26 semanas"
        : larga.descarga
          ? `${formateaKm(larga.km)} km · semana de descarga`
          : `${formateaKm(larga.km)} km a ritmo cómodo`,
      km: larga.km,
      minutos: null,
      esCarreraObjetivo: !!larga.carrera,
      descarga: !!larga.descarga,
      // Se marca cuándo y por qué se ha movido, para explicarlo en pantalla.
      movida: largaAlJueves,
      motivoMovida: largaAlJueves ? "Adelantada al jueves: el viernes toca pierna." : null,
    };
  }

  // Semana 26: los días previos al 20K son descarga, no entrenos normales.
  if (semana === SEMANAS_PLAN) {
    if (dow === 2) return { tipo: "corta", etiqueta: "TAPERING", detalle: "30 min muy suaves", minutos: 30, km: null, movida: false };
    if (dow === 4) return { tipo: "corta", etiqueta: "TAPERING", detalle: "20 min flojos, piernas frescas", minutos: 20, km: null, movida: false };
  }

  return {
    tipo: "corta",
    etiqueta: "CARRERA CORTA",
    detalle: corta.texto,
    minutos: corta.min,
    minutosMax: corta.max,
    km: null,
    // Si la larga se fue al jueves, la corta del jueves se hace el sábado.
    movida: largaAlJueves && dow === 6,
    motivoMovida: largaAlJueves && dow === 6 ? "Cambiada con la larga del jueves." : null,
    avisoViernesPierna: semana === SEMANAS_PLAN && viernesEsPierna,
  };
}

// 15.5 km → "15,5" · 12 km → "12"
const formateaKm = (km) => (Number.isInteger(km) ? String(km) : String(km).replace(".", ","));

/** Plan de un día suelto. Devuelve null si la fecha cae fuera de las 26 semanas. */
export function planDelDia(fechaInicio, iso) {
  return construirCalendario(fechaInicio).get(iso) || null;
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
