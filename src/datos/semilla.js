/*
 * FORJA · Semilla inicial.
 *
 * Se ejecuta una sola vez, la primera vez que se abre la app: deja el catálogo
 * de ejercicios y los ajustes por defecto. Los datos de entreno empiezan vacíos
 * a propósito: la pantalla de "primer día" está diseñada para eso.
 */

import { db } from "./db.js";
import { EJERCICIOS } from "./ejercicios.js";
import { hoyISO, lunesDe } from "../logica/fechas.js";

export const AJUSTES_POR_DEFECTO = {
  id: 1,
  // Por defecto el plan arranca el lunes de la semana en curso.
  startDate: lunesDe(hoyISO()),
  // Semanas de diferencia entre el calendario y el plan de carrera. 0 = van
  // a la par; -1 = vas una semana por detrás (p. ej. repetiste una semana).
  desfaseCarrera: 0,
  tema: "oscuro",
  // Color de acento de la interfaz. "cian" es el original.
  paleta: "cian",
  vibracion: true,
  sonido: true,
  wakeLock: true,
  // Notificación del sistema al acabar el descanso si la app no está delante.
  // Arranca apagado: hay que pedir permiso a Android y eso lo decide el usuario.
  avisos: false,
  // Fecha ISO de la última copia que salió del móvil de verdad.
  ultimoBackup: null,
  // Clave de la API de Anthropic. null = la revisión desde la app está apagada.
  claveClaude: null,
};

/**
 * Prepara la base de datos. Es idempotente: se puede llamar en cada arranque.
 * Si se añaden ejercicios nuevos al catálogo en el futuro, se insertan sin
 * tocar los que ya existen.
 */
export async function sembrar() {
  await db.exercises.bulkPut(EJERCICIOS);

  const ajustes = await db.settings.get(1);
  if (!ajustes) {
    await db.settings.put(AJUSTES_POR_DEFECTO);
  } else {
    // Rellena claves nuevas que no existieran en versiones anteriores.
    const completos = { ...AJUSTES_POR_DEFECTO, ...ajustes };
    await db.settings.put(completos);
  }
}

/** Borra todos los datos de entreno pero deja el catálogo y los ajustes. */
export async function borrarRegistros() {
  await db.transaction(
    "rw",
    [db.gymSessions, db.gymSets, db.runs, db.postureDays, db.postureTests, db.posturePhotos, db.bodyLog, db.diaryOverrides],
    async () => {
      await Promise.all([
        db.gymSessions.clear(),
        db.gymSets.clear(),
        db.runs.clear(),
        db.postureDays.clear(),
        db.postureTests.clear(),
        db.posturePhotos.clear(),
        db.bodyLog.clear(),
        db.diaryOverrides.clear(),
      ]);
    },
  );
}
