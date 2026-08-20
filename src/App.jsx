/*
 * FORJA · Raíz de la aplicación.
 *
 * Decide el tema, configura las señales según los ajustes y monta las rutas.
 * Las pantallas a pantalla completa (entreno en vivo y rutina de postura) no
 * llevan barra de navegación: mientras entrenas no se sale de ahí sin querer.
 */

import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";

import NavInferior from "./componentes/NavInferior.jsx";
import { useAjustes } from "./ganchos/useDatos.js";
import { cerrarAvisos, configurarSenales } from "./utiles/senales.js";

import Hoy from "./pantallas/Hoy.jsx";
import Gym from "./pantallas/Gym.jsx";
import EntrenoVivo from "./pantallas/EntrenoVivo.jsx";
import ResumenSesion from "./pantallas/ResumenSesion.jsx";
import Progresion from "./pantallas/Progresion.jsx";
import Carrera from "./pantallas/Carrera.jsx";
import Cuerpo from "./pantallas/Cuerpo.jsx";
import Dieta from "./pantallas/Dieta.jsx";
import Postura from "./pantallas/Postura.jsx";
import Diario from "./pantallas/Diario.jsx";
import Ajustes from "./pantallas/Ajustes.jsx";
import Revision from "./pantallas/Revision.jsx";

/** Rutas en las que la barra inferior estorba. */
const SIN_NAV = ["/entreno", "/postura/rutina"];

export default function App() {
  const { ajustes } = useAjustes();
  const { pathname } = useLocation();

  // El tema y la paleta se aplican en el <html> para que los vean los tokens CSS.
  useEffect(() => {
    document.documentElement.dataset.tema = ajustes.tema || "oscuro";
    document.documentElement.dataset.paleta = ajustes.paleta || "cian";
    // La barra de estado de Android se tiñe del color de fondo.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = ajustes.tema === "claro" ? "#F4F2EE" : "#000000";
  }, [ajustes.tema, ajustes.paleta]);

  useEffect(() => {
    configurarSenales({
      sonido: ajustes.sonido,
      vibracion: ajustes.vibracion,
      avisos: ajustes.avisos,
    });
  }, [ajustes.sonido, ajustes.vibracion, ajustes.avisos]);

  // Al volver a la app el aviso del descanso ya ha cumplido: se quita del
  // cajón para no dejar notificaciones viejas de hace tres series.
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === "visible") cerrarAvisos();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, []);

  const conNav = !SIN_NAV.some((r) => pathname.startsWith(r));

  return (
    <div className="f-pantalla">
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/" element={<Hoy />} />
          <Route path="/gym" element={<Gym />} />
          <Route path="/entreno/:sessionName" element={<EntrenoVivo />} />
          <Route path="/resumen/:sessionId" element={<ResumenSesion />} />
          <Route path="/progresion" element={<Progresion />} />
          <Route path="/carrera" element={<Carrera />} />
          <Route path="/cuerpo" element={<Cuerpo />} />
          <Route path="/dieta" element={<Dieta />} />
          <Route path="/postura" element={<Postura />} />
          <Route path="/postura/rutina" element={<Postura modo="rutina" />} />
          <Route path="/diario" element={<Diario />} />
          <Route path="/ajustes" element={<Ajustes />} />
          <Route path="/revision" element={<Revision />} />
          <Route path="*" element={<Hoy />} />
        </Routes>
      </div>
      {conNav && <NavInferior />}
    </div>
  );
}
