/*
 * FORJA · Señales: pitidos y vibración.
 *
 * En el gimnasio y corriendo no se mira la pantalla, así que los cambios de
 * bloque tienen que oírse y notarse. El audio va con Web Audio (no hay ficheros
 * que descargar, así que funciona sin conexión y sin retardo de carga).
 *
 * Ojo con Android: el contexto de audio solo se puede crear después de que el
 * usuario toque algo. Por eso `prepararAudio()` se llama al pulsar "empezar".
 */

let ctx = null;
let activado = { sonido: true, vibracion: true, avisos: false };

/** Configura qué avisos quiere el usuario (viene de Ajustes). */
export function configurarSenales({ sonido, vibracion, avisos }) {
  activado = { sonido: !!sonido, vibracion: !!vibracion, avisos: !!avisos };
}

/**
 * Crea (o despierta) el contexto de audio. Hay que llamarlo desde un gesto
 * del usuario o Chrome lo deja suspendido y no suena nada.
 */
export function prepararAudio() {
  if (!activado.sonido) return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    ctx = null; // si el navegador no deja, seguimos sin sonido
  }
}

/** Un pitido. `frecuencia` en Hz, `duracion` en ms. */
function pitido(frecuencia, duracion, volumen = 0.25) {
  if (!activado.sonido || !ctx || ctx.state !== "running") return;
  const osc = ctx.createOscillator();
  const gan = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frecuencia;

  const ahora = ctx.currentTime;
  const seg = duracion / 1000;
  // Envolvente corta para que no chasquee al empezar y al cortar.
  gan.gain.setValueAtTime(0, ahora);
  gan.gain.linearRampToValueAtTime(volumen, ahora + 0.01);
  gan.gain.setValueAtTime(volumen, ahora + seg - 0.03);
  gan.gain.linearRampToValueAtTime(0, ahora + seg);

  osc.connect(gan).connect(ctx.destination);
  osc.start(ahora);
  osc.stop(ahora + seg + 0.02);
}

/** Secuencia de pitidos separados en el tiempo. */
function secuencia(notas) {
  notas.forEach(({ f, ms, espera }) => {
    setTimeout(() => pitido(f, ms), espera);
  });
}

/** Vibración. Acepta un número de ms o un patrón [vibra, pausa, vibra…]. */
export function vibrar(patron) {
  if (!activado.vibracion) return;
  try {
    navigator.vibrate?.(patron);
  } catch {
    /* el dispositivo no vibra: se ignora sin romper nada */
  }
}

/* ---- Avisos con la app en segundo plano ----
 *
 * navigator.vibrate SOLO funciona con la app delante: el navegador ignora la
 * vibración si la página está oculta, y los pitidos tampoco son fiables. La
 * única forma de que el móvil avise con FORJA en segundo plano o la pantalla
 * apagada es una notificación del sistema: la lanza el service worker y quien
 * hace vibrar y sonar es Android, con el canal de notificaciones de la app.
 */

const TAG_AVISO = "forja-aviso"; // una sola notificación viva a la vez

/** ¿Puede este navegador mostrar avisos del sistema? */
export function avisosPosibles() {
  return typeof Notification !== "undefined" && "serviceWorker" in navigator;
}

/** "granted" | "denied" | "default" | "unsupported". */
export function permisoAvisos() {
  return avisosPosibles() ? Notification.permission : "unsupported";
}

/** Pide el permiso. Android exige que salga de un toque del usuario. */
export async function pedirPermisoAvisos() {
  if (!avisosPosibles()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** Lanza el aviso del sistema. Devuelve si de verdad salió. */
async function notificar(titulo, cuerpo, patron) {
  if (!activado.avisos || permisoAvisos() !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false; // en `vite dev` no hay service worker
    await reg.showNotification(titulo, {
      body: cuerpo,
      tag: TAG_AVISO,
      renotify: true, // sustituye a la anterior, pero volviendo a avisar
      vibrate: patron, // Android puede ignorarlo y usar su propio patrón
      icon: "iconos/icono-192.png",
      // El badge es lo que se ve en la barra de estado: Android pinta solo su
      // silueta, así que tiene que ser la F suelta sobre fondo transparente
      // (el icono normal, opaco, saldría como un cuadrado blanco).
      badge: "iconos/badge-96.png",
      lang: "es",
    });
    return true;
  } catch {
    return false; // permiso revocado a media sesión, service worker caído…
  }
}

/** Retira el aviso del cajón: al volver a la app ya no pinta nada. */
export async function cerrarAvisos() {
  if (!avisosPosibles()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const abiertas = (await reg?.getNotifications({ tag: TAG_AVISO })) ?? [];
    abiertas.forEach((n) => n.close());
  } catch {
    /* no había nada que cerrar */
  }
}

// ---- Señales con significado, para no repetir frecuencias por ahí sueltas ----

/** Serie guardada: un toque corto y seco. */
export const senalGuardado = () => {
  pitido(880, 90);
  vibrar(40);
};

/** Empieza a correr: dos pitidos agudos ascendentes. */
export const senalCorre = () => {
  secuencia([
    { f: 880, ms: 120, espera: 0 },
    { f: 1320, ms: 180, espera: 150 },
  ]);
  vibrar([0, 120, 80, 220]);
};

/** Toca caminar: dos pitidos graves descendentes. */
export const senalCamina = () => {
  secuencia([
    { f: 520, ms: 140, espera: 0 },
    { f: 380, ms: 200, espera: 170 },
  ]);
  vibrar([0, 200, 100, 200]);
};

/** Cuenta atrás de los 3 últimos segundos de un bloque. */
export const senalCuentaAtras = () => {
  pitido(660, 70, 0.18);
  vibrar(25);
};

/** Descanso terminado: vuelve a la barra. */
export const senalDescansoFin = () => {
  const patron = [0, 150, 90, 150, 90, 300];
  const enLaApp = () => {
    secuencia([
      { f: 700, ms: 110, espera: 0 },
      { f: 700, ms: 110, espera: 160 },
      { f: 1050, ms: 220, espera: 320 },
    ]);
    vibrar(patron);
  };

  // Con la app delante avisa la propia pantalla; oculta, tiene que hacerlo
  // Android. Si el aviso del sistema no sale (sin permiso, sin service
  // worker), al menos se intenta pitar: peor es quedarse sin nada.
  if (!document.hidden) {
    enLaApp();
    return;
  }
  notificar("Descanso terminado", "Vuelve a la barra.", patron).then((salio) => {
    if (!salio) enLaApp();
  });
};

/** Sesión o rutina terminada. */
export const senalFin = () => {
  secuencia([
    { f: 660, ms: 130, espera: 0 },
    { f: 880, ms: 130, espera: 150 },
    { f: 1180, ms: 320, espera: 300 },
  ]);
  vibrar([0, 90, 60, 90, 60, 400]);
};
