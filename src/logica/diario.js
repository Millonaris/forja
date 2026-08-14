/*
 * FORJA · Diario y adherencia.
 *
 * Los checks del diario NO se marcan a mano: se derivan de lo que realmente
 * has registrado. Si guardaste una sesión de gym ese día, el check de gym se
 * pone solo. El override manual existe para los casos raros (entrenaste sin
 * el móvil, o marcas un día como descanso deliberado) y siempre gana.
 */

import { planDelDia } from "./calendario.js";
import { diaSemana, sumarDias } from "./fechas.js";
import { num } from "./formato.js";

/** Los tres dominios que se puntúan cada día. La dieta va aparte, en Fitia. */
export const DOMINIOS = [
  { clave: "gym", etiqueta: "Gimnasio" },
  { clave: "run", etiqueta: "Carrera" },
  { clave: "post", etiqueta: "Postura" },
];

/**
 * Estado de un día concreto.
 *
 * @param registros - { sesionesGym:Map, carreras:Map, postura:Map, cuerpo:Map, overrides:Map }
 *                    todos indexados por fecha ISO.
 * @returns {
 *   iso, plan,
 *   checks: { gym: {planificado, hecho, origen, detalle}, run:…, post:… },
 *   planificados, hechos, completo, nota
 * }
 */
export function estadoDelDia(fechaInicio, iso, registros, desfase = 0) {
  const plan = planDelDia(fechaInicio, iso, desfase);
  const override = registros.overrides.get(iso) || {};

  const sesionGym = registros.sesionesGym.get(iso) || null;
  const carrera = registros.carreras.get(iso) || null;
  const postura = registros.postura.get(iso) || null;

  // `auto` es lo que dicen los datos; `override` lo pisa si está definido.
  const resolver = (clave, planificado, auto, detalle) => {
    const manual = override[clave];
    const hecho = manual === undefined || manual === null ? auto : manual;
    return {
      planificado,
      hecho: !!hecho,
      // "auto" = derivado de un registro real; "manual" = lo marcaste tú.
      origen: manual === undefined || manual === null ? (auto ? "auto" : null) : "manual",
      detalle,
    };
  };

  const checks = {
    gym: resolver(
      "gym",
      !!plan?.gym,
      !!sesionGym,
      sesionGym ? sesionGym.sessionName : plan?.gym?.sessionName || null,
    ),
    run: resolver(
      "run",
      !!plan?.carrera,
      !!carrera,
      carrera ? (carrera.km ? `${num(carrera.km, 1)} km` : `${carrera.minutes} min`) : plan?.carrera?.detalle || null,
    ),
    post: resolver(
      "post",
      !!plan?.postura,
      !!postura?.fullDone,
      postura ? `${postura.completedIds?.length || 0} ejercicios` : null,
    ),
  };

  const planificados = DOMINIOS.filter((d) => checks[d.clave].planificado).length;
  const hechos = DOMINIOS.filter((d) => checks[d.clave].planificado && checks[d.clave].hecho).length;

  return {
    iso,
    plan,
    checks,
    planificados,
    hechos,
    completo: planificados > 0 && hechos === planificados,
    parcial: hechos > 0 && hechos < planificados,
    nota: override.note || "",
  };
}

/** Adherencia de un conjunto de días: porcentaje sobre lo planificado. */
export function adherencia(estados) {
  const planificados = estados.reduce((t, e) => t + e.planificados, 0);
  const hechos = estados.reduce((t, e) => t + e.hechos, 0);
  return {
    planificados,
    hechos,
    porcentaje: planificados ? Math.round((hechos / planificados) * 100) : null,
  };
}

/** Color del mapa de calor de un día: completo / parcial / vacío / futuro. */
export function tonoDelDia(estado, hoy) {
  if (estado.iso > hoy) return "futuro";
  if (estado.planificados === 0) return "libre";
  if (estado.completo) return "completo";
  if (estado.parcial) return "parcial";
  return "vacio";
}

/**
 * Racha de días seguidos con la rutina postural completa, contando hacia atrás.
 *
 * Los domingos NO cuentan ni rompen: la rutina se planifica de lunes a sábado,
 * así que tratar el domingo como un fallo dejaba la racha topada en 6 para
 * siempre. Se saltan igual que se salta un día de descanso en el gimnasio.
 */
export function rachaPostural(mapaPostura, hoy) {
  let racha = 0;
  let cursor = hoy;

  for (let i = 0; i < 400; i++) {
    // 7 = domingo. No se planifica postura, así que ni suma ni rompe.
    if (diaSemana(cursor) !== 7) {
      const dia = mapaPostura.get(cursor);
      if (dia?.fullDone) {
        racha++;
      } else if (i > 0) {
        // El día de hoy puede estar aún sin hacer sin romper la racha.
        break;
      }
    }
    cursor = sumarDias(cursor, -1);
  }
  return racha;
}
