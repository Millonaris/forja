/*
 * FORJA · Clic en los avisos.
 *
 * El service worker lo genera Workbox a partir de vite.config.js, así que este
 * trozo se le añade con `workbox.importScripts`. Sin él, tocar la notificación
 * del descanso no haría nada: Android no abre la app por su cuenta.
 */

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();

  evento.waitUntil(
    (async () => {
      // Si FORJA ya está abierta (aunque sea en segundo plano) se trae al
      // frente: abrir otra ventana dejaría dos copias del entreno en marcha.
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const abierta = ventanas.find((c) => "focus" in c);
      if (abierta) return abierta.focus();
      return self.clients.openWindow("./");
    })(),
  );
});
