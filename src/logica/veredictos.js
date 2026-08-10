/*
 * FORJA · Motor de veredictos de progresión.
 *
 * Es la parte que convierte un montón de series guardadas en una frase útil:
 * no basta con pintar la gráfica, la app tiene que decir si progresas y qué hacer.
 *
 * Cómo decide:
 *  1. Agrupa las series de un ejercicio por sesión y las ordena por fecha.
 *  2. Coge la ventana de las últimas 4-6 sesiones.
 *  3. Puntúa cada sesión con un 1RM estimado (Epley) de su mejor serie, que
 *     sube tanto si añades kg como si añades repeticiones al mismo peso.
 *  4. Compara la última sesión con la mejor de la ventana y cuenta cuántas
 *     sesiones seguidas llevas sin mejorar.
 *
 * El margen de 1,5 % evita que un redondeo o una repetición suelta cuenten
 * como "progreso" o como "bajada" cuando en realidad estás igual.
 */

import { REGLAS_GYM } from "../datos/ejercicios.js";
import { formatoCorto } from "./fechas.js";
import { conSigno, kgSerie } from "./formato.js";

/** Tamaño de la ventana de análisis. */
export const VENTANA_SESIONES = 6;
/** Mínimo de sesiones para poder opinar. */
export const MINIMO_SESIONES = 2;
/** Sesiones planas seguidas a partir de las cuales se considera estancamiento. */
export const SESIONES_PARA_ESTANCADO = 3;

const MARGEN = 0.015; // 1,5 %

/** 1RM estimado (Epley). Para ejercicios de tiempo o sin carga, ver `puntuar`. */
const epley = (kg, reps) => kg * (1 + reps / 30);

/**
 * Puntúa la mejor serie de trabajo de una sesión.
 * - Con carga → 1RM estimado.
 * - Sin carga (peso corporal) → repeticiones totales.
 * - De tiempo → segundos de la mejor serie.
 */
function puntuar(series, ejercicio) {
  const trabajo = series.filter((s) => !s.isWarmup);
  if (!trabajo.length) return null;

  if (ejercicio.tipo === "tiempo") {
    const mejorSeg = Math.max(...trabajo.map((s) => s.reps || 0));
    return {
      puntuacion: mejorSeg,
      mejorKg: 0,
      mejorReps: mejorSeg,
      volumen: trabajo.reduce((t, s) => t + (s.reps || 0), 0),
      numSeries: trabajo.length,
      seriesTrabajo: trabajo,
    };
  }

  const conCarga = trabajo.some((s) => (s.kg || 0) > 0);
  // Mejor serie: primero más kg, y a igualdad de kg, más repeticiones.
  const mejor = [...trabajo].sort((a, b) => (b.kg || 0) - (a.kg || 0) || (b.reps || 0) - (a.reps || 0))[0];

  return {
    puntuacion: conCarga ? epley(mejor.kg || 0, mejor.reps || 0) : trabajo.reduce((t, s) => t + (s.reps || 0), 0),
    mejorKg: mejor.kg || 0,
    mejorReps: mejor.reps || 0,
    volumen: trabajo.reduce((t, s) => t + (s.kg || 0) * (s.reps || 0), 0),
    // Ojo: `numSeries` es el recuento. La lista de series vive en `seriesTrabajo`
    // y, en la fila de historial, en `series`. No renombrar sin mirar quién lo usa.
    numSeries: trabajo.length,
    seriesTrabajo: trabajo,
  };
}

/**
 * Agrupa series por sesión y las deja ordenadas de más antigua a más reciente.
 * `sets` son todas las series de UN ejercicio; `sesiones` es un Map id → sesión.
 */
export function agruparPorSesion(sets, sesiones, ejercicio) {
  const porSesion = new Map();
  for (const s of sets) {
    if (!porSesion.has(s.sessionId)) porSesion.set(s.sessionId, []);
    porSesion.get(s.sessionId).push(s);
  }

  const filas = [];
  for (const [sessionId, series] of porSesion) {
    const sesion = sesiones.get(sessionId);
    if (!sesion) continue;
    const resumen = puntuar(series, ejercicio);
    if (!resumen) continue;
    // RIR medio de las series de trabajo que lo tengan anotado. Es lo que
    // permite distinguir fatiga de techo real cuando algo se estanca.
    //
    // En los ejercicios cuya última serie se lleva al fallo a propósito
    // (laterales con parciales, curls), esa serie se excluye del promedio:
    // si no, el RIR bajaría por diseño y el motor cantaría "estás fundido"
    // justo en los ejercicios donde acabar quemado es el plan.
    const trabajoParaRir =
      ejercicio.ultimaSerie && resumen.seriesTrabajo.length > 1
        ? resumen.seriesTrabajo.slice(0, -1)
        : resumen.seriesTrabajo;
    const conRir = trabajoParaRir.filter((s) => s.rir != null);
    const rirMedio = conRir.length ? conRir.reduce((t, s) => t + s.rir, 0) / conRir.length : null;

    filas.push({
      sessionId,
      date: sesion.date,
      rirMedio,
      seriesConRir: conRir.length,
      ...resumen,
      // Va después del spread a propósito: es la lista completa de la sesión,
      // calentamientos incluidos, para poder pintar el detalle.
      series: series.sort((a, b) => a.setNumber - b.setNumber),
    });
  }
  return filas.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Veredicto de un ejercicio.
 *
 * Devuelve { estado, icono, titulo, titular, detalle, sugerencia, planas, historial }.
 * estado ∈ "sin_datos" | "pocos_datos" | "progresa" | "mantiene" | "estancado" | "baja"
 *
 * `contexto` es opcional y aporta lo que pasa FUERA del gimnasio:
 *   { interferencia: { afecta, motivo } } — si la carrera está pisando estas
 *   sesiones, el estancamiento se explica por ahí y no por el plan de fuerza.
 */
export function veredictoEjercicio(ejercicio, historialCompleto, contexto = {}) {
  const historial = historialCompleto.slice(-VENTANA_SESIONES);

  if (historial.length === 0) {
    return {
      estado: "sin_datos",
      icono: "·",
      color: "tenue",
      titulo: "Sin registrar",
      detalle: "Aún no has guardado ninguna serie de este ejercicio.",
      sugerencia: null,
      planas: 0,
      historial,
    };
  }

  if (historial.length < MINIMO_SESIONES) {
    return {
      estado: "pocos_datos",
      icono: "·",
      color: "tenue",
      titulo: "Calibrando",
      detalle: "Con una sesión no hay con qué comparar. A la segunda ya hay veredicto.",
      sugerencia: null,
      planas: 0,
      historial,
    };
  }

  const ultima = historial[historial.length - 1];
  const anteriores = historial.slice(0, -1);
  const mejorAnterior = anteriores.reduce((a, b) => (b.puntuacion > a.puntuacion ? b : a));

  const umbralSube = mejorAnterior.puntuacion * (1 + MARGEN);
  const umbralBaja = mejorAnterior.puntuacion * (1 - MARGEN);

  // Cuántas sesiones seguidas (contando hacia atrás) sin superar el récord previo.
  let planas = 0;
  let recordHasta = -Infinity;
  for (let i = 0; i < historial.length; i++) {
    if (historial[i].puntuacion > recordHasta * (1 + MARGEN)) {
      recordHasta = Math.max(recordHasta, historial[i].puntuacion);
      planas = 0;
    } else {
      recordHasta = Math.max(recordHasta, historial[i].puntuacion);
      planas++;
    }
  }

  const sugerencia = sugerirCarga(ejercicio, ultima);

  // ---- Progresas ----
  if (ultima.puntuacion > umbralSube) {
    const deltaKg = ultima.mejorKg - mejorAnterior.mejorKg;
    const deltaReps = ultima.mejorReps - mejorAnterior.mejorReps;
    const desde = formatoCorto(historial[0].date);
    const nSesiones = historial.length;

    // `titular` es el número gordo de la tarjeta: corto o no cabe en una línea.
    // `detalle` es la frase explicada, en cuerpo pequeño debajo.
    let titular;
    let detalle;
    if (ejercicio.tipo === "tiempo") {
      titular = `${conSigno(deltaReps, 0)} s de aguante`;
      detalle = `Tu mejor serie ha subido ${conSigno(deltaReps, 0)} s desde el ${desde}.`;
    } else if (deltaKg > 0) {
      titular = `${conSigno(deltaKg, 1)} kg en ${nSesiones} sesiones`;
      detalle = `Has pasado de ${kgSerie(mejorAnterior.mejorKg)} a ${kgSerie(ultima.mejorKg)} kg desde el ${desde}.`;
    } else {
      titular = `${conSigno(deltaReps, 0)} rep al mismo peso`;
      detalle = `Mismos ${kgSerie(ultima.mejorKg)} kg pero ${ultima.mejorReps} repeticiones, ${conSigno(deltaReps, 0)} desde el ${desde}.`;
    }

    return {
      estado: "progresa",
      icono: "✅",
      color: "ok",
      titulo: "Progresas",
      titular,
      detalle,
      sugerencia,
      planas: 0,
      historial,
    };
  }

  // ---- Bajas ----
  if (ultima.puntuacion < umbralBaja) {
    const deltaKg = ultima.mejorKg - mejorAnterior.mejorKg;
    return {
      estado: "baja",
      icono: "⚠️",
      color: "alerta",
      titulo: "Bajando",
      titular: ejercicio.tipo === "tiempo" ? "Menos aguante" : `${conSigno(deltaKg, 1)} kg`,
      detalle:
        ejercicio.tipo === "tiempo"
          ? `La última sesión aguantaste menos que tu mejor marca reciente.`
          : `${conSigno(deltaKg, 1)} kg respecto a tu mejor sesión reciente.`,
      sugerencia:
        "Suele ser descanso o comida, no falta de fuerza. Repite la carga anterior una sesión antes de bajar el plan.",
      planas,
      historial,
    };
  }

  // ---- Estancado ----
  if (planas >= SESIONES_PARA_ESTANCADO) {
    const diagnostico = diagnosticarEstancamiento(ejercicio, historial, planas, contexto);
    return {
      estado: "estancado",
      icono: "⚠️",
      color: "aviso",
      titulo: `Estancado ${planas} sesiones`,
      titular: diagnostico.titular,
      detalle: diagnostico.detalle,
      sugerencia: diagnostico.sugerencia,
      descarga: diagnostico.descarga,
      planas,
      historial,
    };
  }

  // ---- Manteniendo ----
  return {
    estado: "mantiene",
    icono: "➖",
    color: "tenue",
    titulo: "Manteniendo",
    titular: "Misma marca",
    detalle: "Igual que la sesión anterior. Todavía no es estancamiento.",
    sugerencia,
    planas,
    historial,
  };
}

/**
 * Doble progresión: cuando TODAS las series de trabajo llegan al tope del rango,
 * toca subir 2,5 kg y volver al extremo bajo del rango.
 */
export function sugerirCarga(ejercicio, ultima) {
  if (!ultima?.seriesTrabajo?.length || !ejercicio.repMax) return null;

  const seriesEsperadas = ejercicio.series || ultima.seriesTrabajo.length;
  const completas = ultima.seriesTrabajo.filter((s) => (s.reps || 0) >= ejercicio.repMax);

  // Caso 1: todas las series al tope del rango → toca subir carga.
  if (completas.length >= seriesEsperadas && ultima.seriesTrabajo.length >= seriesEsperadas) {
    if (ejercicio.tipo === "tiempo") {
      return `Has llegado al tope de tiempo en todas las series: sube algo de peso o pasa a ${ejercicio.repMax + 10} s.`;
    }
    const nuevo = (ultima.mejorKg || 0) + REGLAS_GYM.incremento;
    return `Tope del rango en todas las series: sube a ${kgSerie(nuevo)} kg y vuelve a ${ejercicio.repMin} reps.`;
  }

  if (ejercicio.tipo === "tiempo") return null;

  // Caso 2: algunas series al tope pero no todas. Es el caso más habitual y el
  // que más se olvida: falta rematar las que se quedan cortas, no subir peso.
  if (completas.length > 0) {
    const faltan = seriesEsperadas - completas.length;
    const sube = kgSerie((ultima.mejorKg || 0) + REGLAS_GYM.incremento);
    return faltan === 1
      ? `Te falta 1 serie de llegar a ${ejercicio.repMax} reps con ${kgSerie(ultima.mejorKg)} kg. Cuando la tengas, sube a ${sube} kg.`
      : `Te faltan ${faltan} series de llegar a ${ejercicio.repMax} reps con ${kgSerie(ultima.mejorKg)} kg. Cuando las tengas todas, sube a ${sube} kg.`;
  }

  // Caso 3: aún lejos del tope. Primero se llena el rango, después se sube peso.
  const faltanReps = ejercicio.repMax - (ultima.mejorReps || 0);
  if (faltanReps > 0) {
    return `Mantén ${kgSerie(ultima.mejorKg)} kg hasta hacer ${ejercicio.repMax} reps en las ${seriesEsperadas} series (te faltan ${faltanReps} en la mejor).`;
  }
  return null;
}

/**
 * Diagnostica POR QUÉ te has estancado, que es lo que decide qué hacer.
 *
 * El mismo estancamiento pide cosas opuestas según la causa:
 *  - Si acabas al fallo (RIR 0-1) y sigues sin subir → estás fundido: descarga.
 *  - Si te sobraban repeticiones (RIR 3+) → no aprietas: sube el peso.
 *  - Si la carrera te está pisando la pierna → no es estancamiento, es fatiga
 *    prestada; no toques el plan todavía.
 *  - Si hay margen de reps dentro del rango → llénalo antes de tocar la carga.
 */
function diagnosticarEstancamiento(ejercicio, historial, planas, contexto = {}) {
  const ultima = historial[historial.length - 1];
  const ventana = historial.slice(-planas);
  const conRir = ventana.filter((s) => s.rirMedio != null);
  const rirMedio = conRir.length ? conRir.reduce((t, s) => t + s.rirMedio, 0) / conRir.length : null;

  // 1) Interferencia de la carrera: la causa está fuera del gimnasio.
  if (contexto.interferencia?.afecta) {
    return {
      titular: "Fatiga de la carrera",
      detalle: `${planas} sesiones sin moverse, pero ${contexto.interferencia.motivo}. Las piernas no llegan frescas.`,
      sugerencia:
        "No cambies nada del plan todavía: repite la carga y vuelve a mirarlo una semana en la que la tirada larga no caiga pegada al día de pierna.",
      descarga: null,
    };
  }

  // 2) Te sobraban repeticiones: el problema es la intensidad, no la fatiga.
  if (rirMedio != null && rirMedio >= 3) {
    const nuevo = kgSerie((ultima.mejorKg || 0) + REGLAS_GYM.incremento);
    return {
      titular: "Te falta intensidad",
      detalle: `${planas} sesiones planas acabando con ${rirMedio.toFixed(1)} repeticiones de sobra. No es techo, es que no aprietas.`,
      sugerencia: `Sube a ${nuevo} kg y acaba las series a 1-2 repeticiones del fallo.`,
      descarga: null,
    };
  }

  // 3) Al fallo y sin avanzar: fatiga acumulada. Toca descargar.
  if (rirMedio != null && rirMedio <= 1) {
    const carga = ultima.mejorKg || 0;
    const descargada = Math.round((carga * (1 - REGLAS_GYM.descargaPorcentaje)) / 2.5) * 2.5;
    return {
      titular: "Estás fundido, no en tu techo",
      detalle: `${planas} sesiones planas acabando al fallo (RIR ${rirMedio.toFixed(1)}). Cuando llegas al fallo y aun así no subes, el problema es la recuperación.`,
      sugerencia: `Descarga una semana: haz las mismas series a ${kgSerie(descargada)} kg dejando 4 en recámara. La semana siguiente vuelve a ${kgSerie(carga)} kg — casi siempre sale.`,
      descarga: { desde: carga, hasta: descargada },
    };
  }

  // 4) Sin dato de RIR: se usa el criterio clásico, escalado por lo que dura.
  const margenDeReps = ejercicio.repMax && (ultima.mejorReps || 0) < ejercicio.repMax;
  if (margenDeReps) {
    return {
      titular: `${planas} sesiones sin moverse`,
      detalle: `Llevas ${planas} sesiones sin superar tu mejor marca, y aún no llenas el rango de repeticiones.`,
      sugerencia: `Sube repeticiones antes que peso: quédate en ${kgSerie(ultima.mejorKg)} kg hasta llegar a ${ejercicio.repMax}.`,
      descarga: null,
    };
  }
  if (planas <= 4) {
    return {
      titular: `${planas} sesiones sin moverse`,
      detalle: `Llevas ${planas} sesiones planas. Anota el RIR unas cuantas series y la app podrá decirte si es fatiga o falta de intensidad.`,
      sugerencia:
        "Mientras tanto: revisa descanso y comida — con 2 min entre series y el objetivo de kcal cubierto suele desbloquearse solo.",
      descarga: null,
    };
  }
  return {
    titular: `${planas} sesiones sin moverse`,
    detalle: `${planas} sesiones planas es demasiado para que se arregle solo.`,
    sugerencia: `Cambia a una variante parecida 4-6 semanas (agarre, ángulo o máquina) y vuelve después a ${ejercicio.name.toLowerCase()}.`,
    descarga: null,
  };
}

/**
 * Semáforo global: veredicto de todos los ejercicios con datos, ordenado
 * poniendo delante lo que necesita acción.
 */
export function semaforoGlobal(veredictosPorEjercicio) {
  const prioridad = { baja: 0, estancado: 1, mantiene: 2, progresa: 3, pocos_datos: 4, sin_datos: 5 };
  return [...veredictosPorEjercicio].sort(
    (a, b) => prioridad[a.veredicto.estado] - prioridad[b.veredicto.estado] || a.ejercicio.name.localeCompare(b.ejercicio.name),
  );
}

/**
 * Compara dos sesiones del mismo tipo (la de hoy contra la anterior)
 * y devuelve el resumen que se enseña al terminar de entrenar.
 */
export function compararSesiones(seriesHoy, seriesAntes, ejercicios) {
  const volumen = (series) => series.filter((s) => !s.isWarmup).reduce((t, s) => t + (s.kg || 0) * (s.reps || 0), 0);

  const porEjercicio = ejercicios
    .map((ej) => {
      const hoy = seriesHoy.filter((s) => s.exerciseId === ej.id && !s.isWarmup);
      const antes = seriesAntes.filter((s) => s.exerciseId === ej.id && !s.isWarmup);
      if (!hoy.length) return null;

      const rHoy = puntuar(hoy, ej);
      const rAntes = antes.length ? puntuar(antes, ej) : null;

      if (!rAntes) {
        return {
          ejercicio: ej,
          estado: "nuevo",
          texto: ej.tipo === "tiempo" ? `${rHoy.mejorReps} s` : `${kgSerie(rHoy.mejorKg)}×${rHoy.mejorReps}`,
          nota: "primera vez",
        };
      }

      const deltaKg = rHoy.mejorKg - rAntes.mejorKg;
      const deltaReps = rHoy.mejorReps - rAntes.mejorReps;
      const mejora = rHoy.puntuacion > rAntes.puntuacion * (1 + MARGEN);
      const peor = rHoy.puntuacion < rAntes.puntuacion * (1 - MARGEN);

      let nota;
      if (deltaKg !== 0) nota = `${conSigno(deltaKg, 1)} kg`;
      else if (deltaReps !== 0) nota = `${conSigno(deltaReps, 0)} ${ej.tipo === "tiempo" ? "s" : "rep"}`;
      else nota = "igual";

      return {
        ejercicio: ej,
        estado: mejora ? "sube" : peor ? "baja" : "igual",
        texto:
          ej.tipo === "tiempo" ? `${rHoy.mejorReps} s` : `${kgSerie(rHoy.mejorKg)}×${rHoy.mejorReps}`,
        nota,
      };
    })
    .filter(Boolean);

  return {
    volumenHoy: volumen(seriesHoy),
    volumenAntes: volumen(seriesAntes),
    seriesHechas: seriesHoy.filter((s) => !s.isWarmup).length,
    suben: porEjercicio.filter((p) => p.estado === "sube").length,
    bajan: porEjercicio.filter((p) => p.estado === "baja").length,
    porEjercicio,
  };
}
