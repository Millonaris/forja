/*
 * FORJA · Avisos: despertador y clic.
 *
 * El service worker lo genera Workbox a partir de vite.config.js, así que este
 * trozo se le añade con `workbox.importScripts`.
 *
 * Aquí vive el DESPERTADOR del descanso. La página no puede avisar por sí
 * misma: en cuanto pasas a otra app, Android congela la pestaña entera y su
 * reloj deja de correr (por eso el aviso salía tarde, al volver). El service
 * worker es aparte y `waitUntil` lo mantiene despierto los ~2-3 minutos que
 * dura un descanso, así que el aviso sale a su hora aunque estés en Instagram.
 * Ojo: el navegador corta los `waitUntil` de más de ~5 minutos; para
 * descansos de gimnasio sobra, y si algún día se programa algo más largo el
 * fallo es avisar al volver, no romper nada.
 */

let avisoTimeout = null; // despertador en marcha, para poder cancelarlo
let avisoListo = null; // resolve del waitUntil que mantiene vivo el worker

function cancelarDespertador() {
  if (avisoTimeout != null) clearTimeout(avisoTimeout);
  if (avisoListo) avisoListo();
  avisoTimeout = null;
  avisoListo = null;
}

self.addEventListener("message", (evento) => {
  const { tipo, enMs, titulo, cuerpo, patron, tag } = evento.data || {};

  if (tipo === "cancelar-aviso") {
    cancelarDespertador();
    return;
  }
  if (tipo !== "programar-aviso") return;

  cancelarDespertador(); // solo hay un descanso a la vez: el nuevo pisa al viejo
  evento.waitUntil(
    new Promise((resolver) => {
      avisoListo = resolver;
      avisoTimeout = setTimeout(async () => {
        try {
          // Si la app está delante, la propia pantalla pita y vibra: el aviso
          // del sistema sobra y solo duplicaría el ruido.
          const ventanas = await self.clients.matchAll({ type: "window" });
          const visible = ventanas.some((v) => v.visibilityState === "visible");
          if (!visible) {
            await self.registration.showNotification(titulo, {
              body: cuerpo,
              tag,
              renotify: true,
              vibrate: patron,
              icon: "iconos/icono-192.png",
              badge: "iconos/badge-96.png",
              lang: "es",
            });
          }
        } finally {
          cancelarDespertador();
        }
      }, enMs);
    }),
  );
});

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
