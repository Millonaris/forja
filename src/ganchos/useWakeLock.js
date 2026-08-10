/*
 * FORJA · Wake Lock.
 *
 * Mantiene la pantalla encendida mientras entrenas o corres. Sin esto el
 * móvil se bloquea a los 30 s y hay que desbloquearlo con las manos sudadas
 * cada vez que quieres guardar una serie.
 *
 * Android suelta el bloqueo solo al cambiar de pestaña o apagar la pantalla,
 * así que se vuelve a pedir cuando la app se hace visible otra vez.
 */

import { useEffect, useRef } from "react";

export function useWakeLock(activo) {
  const bloqueo = useRef(null);

  useEffect(() => {
    if (!activo || !("wakeLock" in navigator)) return undefined;

    let cancelado = false;

    const pedir = async () => {
      try {
        if (document.visibilityState !== "visible") return;
        bloqueo.current = await navigator.wakeLock.request("screen");
        // Si el sistema lo suelta por su cuenta, dejamos la referencia limpia.
        bloqueo.current.addEventListener("release", () => {
          bloqueo.current = null;
        });
      } catch {
        // Batería baja o permiso denegado: la app sigue funcionando igual.
      }
    };

    const alVolver = () => {
      if (!cancelado && document.visibilityState === "visible" && !bloqueo.current) pedir();
    };

    pedir();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alVolver);
      bloqueo.current?.release().catch(() => {});
      bloqueo.current = null;
    };
  }, [activo]);
}
