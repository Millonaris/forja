/*
 * FORJA · Motor de calendario.
 *
 * Junta, para cada día, qué toca: sesión de gimnasio (por rotación desde la
 * fecha de inicio), carrera (por las fechas REALES del plan del entrenador,
 * que viven en planCarrera.js) y postura. De dieta nada: eso lo lleva Fitia.
 *
 * El gimnasio se ancla a la fecha de inicio de la app; la carrera se ancla a
 * sus propias fechas (14-ago-2026 → 20K el 13-feb-2027). `desfase` recoloca
 * SOLO el plan de carrera en semanas enteras: repetir una semana = todo el
 * plan de correr se desplaza 7 días. El gimnasio no se mueve.
 *
 * El calendario se calcula una sola vez por (inicio, desfase) y se memoiza:
 * la pantalla de Diario pinta meses enteros sin recalcular nada.
 */

import { NOMBRES_SESION, esSesionPierna } from "../datos/ejercicios.js";
import {
  DIA_20K,
  faseDeSemana,
  SEMANAS_PLAN,
  semanaCarreraPorFecha,
  sesionCarreraDelDia,
} from "../datos/planCarrera.js";
import { DIAS_EXTRAS } from "../datos/rutinaPostural.js";
import { diaSemana, diasEntre, lunesDe, sumarDias } from "./fechas.js";

export { SEMANAS_PLAN };

/** Días de gimnasio: lunes, miércoles y viernes. */
const DIAS_GYM = [1, 3, 5];

/**
 * Vacaciones de agosto 2026 (Jarandilla), SIN gimnasio hasta el 27 incluido:
 * lo dijo el entrenador. Esos días no se planifica sesión ni avanza la
 * rotación T-P-T-P: la primera sesión cae el viernes 28 y la rotación sigue
 * desde donde se quedó. En su lugar tocan caminatas Z2 y gomas.
 */
const VACACIONES_HASTA = "2026-08-27";

const cache = new Map();

/**
 * Devuelve el calendario completo: Map<"YYYY-MM-DD", planDelDía>.
 *
 * planDelDía = {
 *   iso, semana, semanaCarrera, fase, diaSemana,
 *   gym:     { sessionName, esPierna, aviso } | null,
 *   carrera: { tipo, etiqueta, detalle, km, minutos } | null,
 *   postura: bool,   conExtras: bool,   vacaciones: bool,
 * }
 */
export function construirCalendario(fechaInicio, desfase = 0) {
  const claveCache = `${fechaInicio}|${desfase}`;
  if (cache.has(claveCache)) return cache.get(claveCache);

  const lunes1 = lunesDe(fechaInicio);

  // El calendario tiene que llegar SIEMPRE hasta el día del 20K (que con
  // desfase negativo se retrasa), aunque la fecha de inicio de la app sea
  // anterior al arranque del plan de carrera.
  const fecha20K = sumarDias(DIA_20K, -7 * desfase);
  const totalSemanas = Math.max(SEMANAS_PLAN, Math.ceil((diasEntre(lunes1, fecha20K) + 1) / 7));

  const dias = new Map();

  // 1) Gimnasio: se recorren TODOS los días de gym en orden y se les va
  //    asignando la rotación T-P-T-P. Por eso la misma sesión no cae siempre
  //    en el mismo día de la semana.
  let indiceRotacion = 0;
  const gymPorDia = new Map();
  for (let semana = 1; semana <= totalSemanas; semana++) {
    for (const dow of DIAS_GYM) {
      const iso = sumarDias(lunes1, (semana - 1) * 7 + (dow - 1));
      if (iso <= VACACIONES_HASTA) continue; // vacaciones: ni sesión ni rotación
      const sessionName = NOMBRES_SESION[indiceRotacion % NOMBRES_SESION.length];
      indiceRotacion++;
      gymPorDia.set(iso, sessionName);
    }
  }

  // 2) Día a día: gym + carrera + postura.
  for (let semana = 1; semana <= totalSemanas; semana++) {
    for (let i = 0; i < 7; i++) {
      const iso = sumarDias(lunes1, (semana - 1) * 7 + i);
      const dow = i + 1; // 1 = lunes … 7 = domingo

      const sessionName = gymPorDia.get(iso) || null;
      const esPierna = sessionName ? esSesionPierna(sessionName) : false;

      const semanaCarrera = semanaCarreraPorFecha(iso, desfase);
      const enPlanCarrera = semanaCarrera >= 1 && semanaCarrera <= SEMANAS_PLAN;
      const fase = faseDeSemana(Math.min(Math.max(semanaCarrera, 1), SEMANAS_PLAN));

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
              // las semanas finales la orden del entrenador: la pierna se
              // baja para llegar fresco al 20K. Además, regla fija del plan:
              // pierna intensa nunca la víspera de correr.
              aviso: esPierna
                ? enPlanCarrera && semanaCarrera >= 25
                  ? "Semana de taper: pierna a MITAD de peso y volumen. Nada nuevo."
                  : sesionCarreraDelDia(sumarDias(iso, 1), desfase)
                    ? "Mañana se corre: pierna sin llegar al fallo, nada de récords."
                    : "Antes de empezar: bisagra de cadera 2×8."
                : null,
            }
          : null,
        carrera: sesionCarreraDelDia(iso, desfase),
        vacaciones: iso <= VACACIONES_HASTA,
        // La rutina postural se planifica de lunes a sábado (objetivo 5-6 días).
        postura: dow <= 6,
        conExtras: DIAS_EXTRAS.includes(dow),
      });
    }
  }

  cache.set(claveCache, dias);
  return dias;
}

/** Plan de un día suelto. Devuelve null si la fecha cae fuera del calendario. */
export function planDelDia(fechaInicio, iso, desfase = 0) {
  return construirCalendario(fechaInicio, desfase).get(iso) || null;
}

/**
 * Semana del PLAN DE CARRERA que toca en una fecha, con el desfase elegido
 * en Ajustes ya aplicado. Puede salir <1 o >26 si la fecha cae fuera del plan.
 */
export function semanaCarreraDe(ajustes, iso) {
  return semanaCarreraPorFecha(iso, ajustes.desfaseCarrera || 0);
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
