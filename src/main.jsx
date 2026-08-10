/*
 * FORJA · Punto de entrada.
 * Siembra la base de datos antes de pintar nada, para que ninguna pantalla
 * tenga que gestionar el caso "todavía no hay ejercicios".
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

// Fuentes autoalojadas: la app tiene que funcionar sin internet, así que no
// se pueden pedir a Google Fonts.
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";

import "./estilos/tokens.css";
import "./estilos/base.css";

import App from "./App.jsx";
import { sembrar } from "./datos/semilla.js";
import { pedirPersistencia } from "./utiles/almacenamiento.js";

// Se pide cuanto antes: sin esto Android puede desalojar la base de datos
// entera si el móvil se queda sin espacio. No bloquea el arranque.
pedirPersistencia();

sembrar()
  .catch((e) => console.error("No se pudo preparar la base de datos:", e))
  .finally(() => {
    createRoot(document.getElementById("root")).render(
      <StrictMode>
        {/* HashRouter: la PWA se sirve como fichero estático y así el enlace
            directo a cualquier pantalla funciona sin configurar el servidor. */}
        <HashRouter>
          <App />
        </HashRouter>
      </StrictMode>,
    );
  });
