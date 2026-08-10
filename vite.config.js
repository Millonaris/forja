import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Rutas relativas: así la app funciona igual servida en la raíz o en una
  // subcarpeta, y también abierta desde el propio dispositivo.
  base: "./",

  plugins: [
    react(),

    VitePWA({
      // La app se actualiza sola cuando publicas una versión nueva.
      registerType: "autoUpdate",
      includeAssets: ["iconos/*.png", "iconos/*.svg"],

      manifest: {
        name: "FORJA",
        short_name: "FORJA",
        description: "Entrenamiento, carrera, postura y nutrición. Todo local, sin internet.",
        lang: "es",
        dir: "ltr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#000000",
        theme_color: "#000000",
        categories: ["health", "fitness", "lifestyle"],
        icons: [
          { src: "iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        // Accesos directos desde el icono de la app (mantener pulsado en Android).
        shortcuts: [
          { name: "Empezar entreno", short_name: "Entreno", url: "./#/gym" },
          { name: "Apuntar peso", short_name: "Peso", url: "./#/nutricion" },
          { name: "Rutina postural", short_name: "Postura", url: "./#/postura/rutina" },
        ],
      },

      workbox: {
        // Se precachea TODO lo que hace falta para funcionar sin conexión.
        // Solo woff2: @fontsource trae también .woff para navegadores viejos y
        // Chrome de Android nunca lo pide, así que cachearlo duplicaría el peso.
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,ico}"],
        // Es parte del propio service worker (ver importScripts): precachearlo
        // sería guardar una copia del trabajador dentro del trabajador.
        globIgnores: ["sw-avisos.js"],
        // Avisos del descanso con la app en segundo plano.
        importScripts: ["sw-avisos.js"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },

      devOptions: {
        // Permite comprobar el service worker en desarrollo sin compilar.
        enabled: false,
      },
    }),
  ],

  server: {
    // Respeta el puerto que asigne el entorno; si no hay ninguno, el de siempre.
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    // Accesible desde el móvil en la misma wifi.
    host: true,
  },

  preview: {
    port: Number(process.env.PORT) || 4173,
    host: true,
  },

  build: {
    // Separa las dependencias pesadas en trozos propios: así la primera carga
    // baja menos y el service worker solo re-descarga lo que cambia.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("chart.js")) return "graficas";
          if (id.includes("dexie")) return "datos";
          return "vendor";
        },
      },
    },
  },
});
