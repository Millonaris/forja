/*
 * FORJA · Base de datos local (IndexedDB vía Dexie).
 *
 * Todo vive en el móvil. No hay servidor, no hay login, no hace falta internet.
 * Los nombres de tablas y campos son los del modelo de datos acordado.
 *
 * Convención de fechas: SIEMPRE cadena "YYYY-MM-DD" (fecha local, sin husos ni UTC).
 * Ver src/logica/fechas.js. Esto permite indexar y comparar fechas como texto.
 */

import Dexie from "dexie";

export const db = new Dexie("forja");

db.version(1).stores({
  // Fila única con id = 1. Configuración global de la app.
  settings: "id",

  // Una fila por sesión de gimnasio realmente entrenada.
  gymSessions: "++id, date, sessionName",

  // Una fila por serie guardada. Indexado por sesión y por ejercicio
  // porque el motor de veredictos consulta "todas las series de X ejercicio".
  gymSets: "++id, sessionId, exerciseId, [exerciseId+sessionId]",

  // Catálogo de ejercicios del plan (se precarga en la semilla).
  exercises: "id, sessionName, [sessionName+order]",

  // Carreras registradas.
  runs: "++id, date, type, weekNum",

  // Un registro por día de rutina postural.
  postureDays: "date",

  // Test de la pared (día 0 y cada 6 semanas).
  postureTests: "date",

  // Foto de perfil semanal, guardada como Blob comprimido.
  posturePhotos: "week, dateTaken",

  // Peso del día. La dieta va aparte, en Fitia.
  bodyLog: "date",

  // Overrides manuales del diario + nota libre del día.
  diaryOverrides: "date",
});

/*
 * Versión 2 · añade `rir` a las series (repeticiones en recámara).
 *
 * Dexie no necesita migrar datos: los campos que no están en los índices se
 * guardan tal cual, así que las series antiguas simplemente tendrán `rir`
 * indefinido y el motor de veredictos las trata como "sin dato de esfuerzo".
 * El bloque de versión existe para dejar el cambio documentado y para poder
 * añadir un índice sobre `rir` más adelante sin sorpresas.
 */
db.version(2).stores({
  gymSets: "++id, sessionId, exerciseId, [exerciseId+sessionId]",
});

/** Lee los ajustes (siempre id = 1). */
export async function leerAjustes() {
  return db.settings.get(1);
}

/** Actualiza ajustes de forma parcial. */
export async function guardarAjustes(cambios) {
  const actuales = (await db.settings.get(1)) || { id: 1 };
  const nuevos = { ...actuales, ...cambios, id: 1 };
  await db.settings.put(nuevos);
  return nuevos;
}
