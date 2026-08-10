/*
 * FORJA · Motor de veredictos de carrera.
 *
 * El equivalente al de gimnasio, pero correr progresa de otra forma: en el
 * gimnasio subes kilos, aquí bajas el ritmo al mismo esfuerzo y aguantas más
 * volumen sin romperte. Tres lecturas:
 *
 *  1. RITMO — comparado siempre entre carreras del MISMO tipo. Comparar una
 *     tirada larga con unos intervalos no dice nada: la larga siempre es más
 *     lenta, y mezclarlas haría que cambiar de fase pareciera un bajón.
 *
 *  2. VOLUMEN — cuántos km por semana y si están subiendo demasiado rápido.
 *     La regla del 10 % (no subir el volumen semanal más de un 10 % respecto
 *     a la media reciente) es la que evita periostitis y fascitis.
 *
 *  3. BASE AERÓBICA — si a igual ritmo puedes sostener más minutos, tu motor
 *     está mejorando aunque el crono no baje.
 */

import { diasEntre, formatoCorto, hoyISO, lunesDe, sumarDias } from "./fechas.js";
import { num, reloj } from "./formato.js";

/** Subida semanal de volumen que se considera segura. */
export const SUBIDA_SEGURA = 0.1;
/** Mínimo de carreras del mismo tipo para poder opinar del ritmo. */
const MINIMO_MISMO_TIPO = 3;
/** Margen para no cantar mejora por un par de segundos de nada. */
const MARGEN_RITMO = 0.02;

/** Segundos por km de una carrera. */
const ritmoSeg = (c) => (c.km > 0 && c.minutes > 0 ? (c.minutes * 60) / c.km : null);

/**
 * Veredicto de ritmo dentro de un tipo de carrera.
 * Compara la media de las 3 últimas con la de las 3 anteriores: una sola
 * carrera buena o mala no debe mover el veredicto.
 */
export function veredictoRitmo(carreras, tipo) {
  const delTipo = carreras
    .filter((c) => c.type === tipo && ritmoSeg(c) != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (delTipo.length < MINIMO_MISMO_TIPO) {
    return {
      estado: "pocos_datos",
      color: "tenue",
      titular: "Faltan carreras",
      detalle: `Con ${delTipo.length} de este tipo no hay con qué comparar. A la tercera ya hay veredicto.`,
    };
  }

  const recientes = delTipo.slice(-3);
  const previas = delTipo.slice(-6, -3);
  const media = (lista) => lista.reduce((t, c) => t + ritmoSeg(c), 0) / lista.length;

  const ahora = media(recientes);
  if (!previas.length) {
    return {
      estado: "base",
      color: "acento",
      titular: `${reloj(ahora)} /km`,
      detalle: "Esta es tu referencia. Con tres carreras más habrá comparación.",
    };
  }

  const antes = media(previas);
  const delta = ahora - antes; // negativo = más rápido

  if (delta < -antes * MARGEN_RITMO) {
    return {
      estado: "progresa",
      color: "ok",
      titular: `${reloj(Math.abs(delta))} más rápido por km`,
      detalle: `Has pasado de ${reloj(antes)} a ${reloj(ahora)} /km en el mismo tipo de sesión. El motor está mejorando.`,
    };
  }
  if (delta > antes * MARGEN_RITMO) {
    return {
      estado: "baja",
      color: "aviso",
      titular: `${reloj(delta)} más lento por km`,
      detalle: `De ${reloj(antes)} a ${reloj(ahora)} /km. Si no es por calor o cansancio acumulado, baja el volumen una semana.`,
    };
  }
  return {
    estado: "mantiene",
    color: "tenue",
    titular: `${reloj(ahora)} /km estable`,
    detalle: "Mismo ritmo que las anteriores. En fase de construir base es lo esperable.",
  };
}

/** Km por semana natural, de la más antigua a la más reciente. */
export function kmPorSemana(carreras, semanas = 8, hasta = hoyISO()) {
  const lunesActual = lunesDe(hasta);
  const lista = Array.from({ length: semanas }, (_, i) => sumarDias(lunesActual, -(semanas - 1 - i) * 7));

  return lista.map((lunes) => {
    const fin = sumarDias(lunes, 6);
    const km = carreras
      .filter((c) => c.date >= lunes && c.date <= fin)
      .reduce((t, c) => t + (c.km || 0), 0);
    return { lunes, km: Math.round(km * 10) / 10 };
  });
}

/**
 * Veredicto de volumen: si estás subiendo km demasiado deprisa.
 * Compara la semana en curso con la media de las 3 anteriores completas.
 */
export function veredictoVolumen(carreras, hasta = hoyISO()) {
  const semanas = kmPorSemana(carreras, 5, hasta);
  const actual = semanas[semanas.length - 1];
  const previas = semanas.slice(-4, -1).filter((s) => s.km > 0);

  if (!previas.length || actual.km === 0) {
    return {
      estado: "pocos_datos",
      color: "tenue",
      titular: `${num(actual.km, 1)} km esta semana`,
      detalle: "Hacen falta varias semanas seguidas para juzgar si subes demasiado rápido.",
    };
  }

  const media = previas.reduce((t, s) => t + s.km, 0) / previas.length;
  const subida = (actual.km - media) / media;

  if (subida > SUBIDA_SEGURA * 2) {
    return {
      estado: "riesgo",
      color: "alerta",
      titular: `+${Math.round(subida * 100)} % de golpe`,
      detalle: `Has pasado de ${num(media, 1)} km de media a ${num(actual.km, 1)} esta semana. Subir más de un 10 % semanal es la vía rápida a una periostitis.`,
      accion: `Quédate en ${num(media * (1 + SUBIDA_SEGURA), 1)} km la semana que viene.`,
    };
  }
  if (subida > SUBIDA_SEGURA) {
    return {
      estado: "aviso",
      color: "aviso",
      titular: `+${Math.round(subida * 100)} % esta semana`,
      detalle: `De ${num(media, 1)} a ${num(actual.km, 1)} km. Justo por encima del 10 % recomendado; vigila molestias en espinillas y planta del pie.`,
    };
  }
  return {
    estado: "ok",
    color: "ok",
    titular: `${num(actual.km, 1)} km esta semana`,
    detalle:
      subida < -0.2
        ? "Semana más suave que las anteriores. Si es descarga, perfecto."
        : `Progresión sana respecto a los ${num(media, 1)} km de media.`,
  };
}

/**
 * Base aeróbica: minutos que puedes sostener por sesión.
 * Que suba el tiempo total a ritmo parecido es progreso real aunque el crono
 * por kilómetro no se mueva.
 */
export function veredictoBase(carreras) {
  const ordenadas = [...carreras].filter((c) => c.minutes > 0).sort((a, b) => a.date.localeCompare(b.date));
  if (ordenadas.length < 4) {
    return { estado: "pocos_datos", color: "tenue", titular: "Aún sin base", detalle: "Con cuatro carreras empieza a verse." };
  }

  const recientes = ordenadas.slice(-3);
  const previas = ordenadas.slice(-6, -3);
  const media = (l) => l.reduce((t, c) => t + c.minutes, 0) / l.length;
  const ahora = media(recientes);
  const antes = previas.length ? media(previas) : null;

  if (antes == null) {
    return { estado: "base", color: "acento", titular: `${Math.round(ahora)} min de media`, detalle: "Tu referencia de partida." };
  }

  const delta = ahora - antes;
  if (delta > 2) {
    return {
      estado: "progresa",
      color: "ok",
      titular: `+${Math.round(delta)} min por sesión`,
      detalle: `Aguantas ${Math.round(ahora)} min de media frente a ${Math.round(antes)} antes. La base aeróbica está subiendo.`,
    };
  }
  return {
    estado: "mantiene",
    color: "tenue",
    titular: `${Math.round(ahora)} min de media`,
    detalle: "Mismo tiempo por sesión que antes.",
  };
}

/** Los tres veredictos juntos, que es lo que pinta la pantalla de Carrera. */
export function veredictosCarrera(carreras, hasta = hoyISO()) {
  const tiposConDatos = ["intervalos", "corta", "larga"].filter(
    (t) => carreras.filter((c) => c.type === t).length > 0,
  );
  // Se juzga el ritmo del tipo del que más historial haya.
  const tipoPrincipal =
    tiposConDatos.sort(
      (a, b) => carreras.filter((c) => c.type === b).length - carreras.filter((c) => c.type === a).length,
    )[0] || "corta";

  return {
    ritmo: { ...veredictoRitmo(carreras, tipoPrincipal), tipo: tipoPrincipal },
    volumen: veredictoVolumen(carreras, hasta),
    base: veredictoBase(carreras),
    ultima: carreras.length
      ? [...carreras].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null,
  };
}

/** Días desde la última carrera, para avisos de inactividad. */
export function diasSinCorrer(carreras, hasta = hoyISO()) {
  if (!carreras.length) return null;
  const ultima = [...carreras].sort((a, b) => b.date.localeCompare(a.date))[0];
  return { dias: diasEntre(ultima.date, hasta), fecha: formatoCorto(ultima.date) };
}
