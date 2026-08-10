/*
 * FORJA · Acceso a datos desde la interfaz.
 *
 * useLiveQuery de Dexie hace que las pantallas se refresquen solas cuando
 * cambia la base de datos: guardas una serie y el resumen, el diario y el
 * semáforo se actualizan sin pasar nada por props ni recargar.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../datos/db.js";
import { AJUSTES_POR_DEFECTO } from "../datos/semilla.js";
import { hoyISO, sumarDias } from "../logica/fechas.js";

/** Ajustes de la app. Nunca devuelve undefined: cae en los valores por defecto. */
export function useAjustes() {
  const ajustes = useLiveQuery(() => db.settings.get(1), [], undefined);
  return { ajustes: ajustes ?? AJUSTES_POR_DEFECTO, cargando: ajustes === undefined };
}

/** Catálogo completo de ejercicios. */
export function useEjercicios() {
  return useLiveQuery(() => db.exercises.toArray(), [], []);
}

/** Sesiones de gimnasio, de la más reciente a la más antigua. */
export function useSesionesGym(limite = null) {
  return useLiveQuery(async () => {
    const todas = await db.gymSessions.orderBy("date").reverse().toArray();
    return limite ? todas.slice(0, limite) : todas;
  }, [limite], []);
}

/** Series de una sesión concreta. */
export function useSeriesDeSesion(sessionId) {
  return useLiveQuery(
    () => (sessionId ? db.gymSets.where("sessionId").equals(sessionId).toArray() : Promise.resolve([])),
    [sessionId],
    [],
  );
}

/** Registro de peso y kcal de los últimos N días. */
export function useCuerpo(dias = 120) {
  return useLiveQuery(async () => {
    const desde = sumarDias(hoyISO(), -dias);
    return db.bodyLog.where("date").aboveOrEqual(desde).sortBy("date");
  }, [dias], []);
}

/** Carreras registradas, de la más reciente a la más antigua. */
export function useCarreras(limite = null) {
  return useLiveQuery(async () => {
    const todas = await db.runs.orderBy("date").reverse().toArray();
    return limite ? todas.slice(0, limite) : todas;
  }, [limite], []);
}

/** Días de rutina postural, indexados por fecha. */
export function usePostura() {
  return useLiveQuery(async () => {
    const filas = await db.postureDays.toArray();
    return new Map(filas.map((f) => [f.date, f]));
  }, [], new Map());
}

/**
 * Todo lo que necesita el diario para calcular checks automáticos,
 * ya indexado por fecha para no recorrer arrays dentro del bucle de 182 días.
 */
export function useRegistrosDiario() {
  return useLiveQuery(
    async () => {
      const [sesiones, carreras, postura, cuerpo, overrides] = await Promise.all([
        db.gymSessions.toArray(),
        db.runs.toArray(),
        db.postureDays.toArray(),
        db.bodyLog.toArray(),
        db.diaryOverrides.toArray(),
      ]);
      return {
        sesionesGym: new Map(sesiones.map((s) => [s.date, s])),
        carreras: new Map(carreras.map((c) => [c.date, c])),
        postura: new Map(postura.map((p) => [p.date, p])),
        cuerpo: new Map(cuerpo.map((b) => [b.date, b])),
        overrides: new Map(overrides.map((o) => [o.date, o])),
      };
    },
    [],
    null,
  );
}

/**
 * Historial completo de series agrupado por ejercicio, junto con el mapa de
 * sesiones. Es lo que consume el motor de veredictos.
 */
export function useHistorialGym() {
  return useLiveQuery(
    async () => {
      const [sets, sesiones] = await Promise.all([db.gymSets.toArray(), db.gymSessions.toArray()]);
      const porEjercicio = new Map();
      for (const s of sets) {
        if (!porEjercicio.has(s.exerciseId)) porEjercicio.set(s.exerciseId, []);
        porEjercicio.get(s.exerciseId).push(s);
      }
      return { porEjercicio, sesiones: new Map(sesiones.map((s) => [s.id, s])) };
    },
    [],
    null,
  );
}

/** Última sesión guardada de un tipo concreto ("TORSO B"), con sus series. */
export async function ultimaSesionDe(sessionName, excluirId = null) {
  const sesiones = await db.gymSessions.where("sessionName").equals(sessionName).sortBy("date");
  const previas = sesiones.filter((s) => s.id !== excluirId);
  const ultima = previas[previas.length - 1];
  if (!ultima) return null;
  const series = await db.gymSets.where("sessionId").equals(ultima.id).toArray();
  return { sesion: ultima, series };
}
