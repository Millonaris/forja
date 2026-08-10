/*
 * FORJA · Durabilidad del almacenamiento.
 *
 * Por defecto Android guarda los datos de una web en modo "best effort":
 * si el móvil se queda sin espacio, Chrome puede borrarlos sin avisar. Como
 * aquí los datos SOLO viven en el móvil, eso es inaceptable.
 *
 * navigator.storage.persist() pide que el almacenamiento pase a "persistent",
 * y entonces el sistema deja de considerarlo desechable. Con la app instalada
 * en la pantalla de inicio, Chrome en Android suele concederlo sin preguntar.
 *
 * Ojo con lo que esto NO protege: si desinstalas la app o borras sus datos a
 * mano, se van igual. La copia de seguridad en JSON sigue siendo la red real.
 */

/**
 * Pide almacenamiento persistente. Es idempotente y no molesta si ya lo está.
 * Devuelve true/false, o null si el navegador no soporta la API.
 */
export async function pedirPersistencia() {
  if (!navigator.storage?.persist) return null;
  try {
    // Si ya está concedido no se vuelve a pedir: algunos navegadores
    // enseñarían un diálogo cada vez.
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/**
 * Estado del almacenamiento para enseñarlo en Ajustes:
 * si es persistente, cuánto ocupa la app y cuánto le queda disponible.
 */
export async function estadoAlmacenamiento() {
  const soportado = !!navigator.storage?.estimate;
  if (!soportado) return { soportado: false };

  try {
    const [persistente, estimacion] = await Promise.all([
      navigator.storage.persisted?.() ?? Promise.resolve(null),
      navigator.storage.estimate(),
    ]);
    return {
      soportado: true,
      persistente,
      usado: estimacion.usage ?? null,
      disponible: estimacion.quota ?? null,
    };
  } catch {
    return { soportado: false };
  }
}
