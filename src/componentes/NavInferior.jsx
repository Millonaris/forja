/*
 * FORJA · Barra de navegación inferior.
 *
 * Seis destinos fijos, siempre abajo y siempre en el mismo orden: en modo
 * una mano el pulgar llega a todos sin recolocar el móvil.
 */

import { NavLink } from "react-router-dom";
import { IconoCarrera, IconoCuerpo, IconoDiario, IconoDieta, IconoGym, IconoHoy } from "./Iconos.jsx";

const DESTINOS = [
  { a: "/", etiqueta: "HOY", Icono: IconoHoy, exacto: true },
  { a: "/gym", etiqueta: "GYM", Icono: IconoGym },
  { a: "/carrera", etiqueta: "CARRERA", Icono: IconoCarrera },
  { a: "/cuerpo", etiqueta: "CUERPO", Icono: IconoCuerpo },
  { a: "/dieta", etiqueta: "DIETA", Icono: IconoDieta },
  { a: "/diario", etiqueta: "DIARIO", Icono: IconoDiario },
];

export default function NavInferior() {
  return (
    <nav
      className="no-sel"
      style={{
        flex: "none",
        height: "calc(var(--f-nav-alto) + var(--f-safe-abajo))",
        paddingBottom: "var(--f-safe-abajo)",
        borderTop: "1px solid var(--f-borde-sutil)",
        background: "var(--f-fondo)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-around",
        paddingTop: 10,
      }}
    >
      {DESTINOS.map(({ a, etiqueta, Icono, exacto }) => (
        <NavLink
          key={a}
          to={a}
          end={exacto}
          style={({ isActive }) => ({
            flex: "1 1 0",
            minWidth: 0,
            minHeight: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
            textDecoration: "none",
            color: isActive ? "var(--f-acento)" : "var(--f-texto3)",
          })}
        >
          {({ isActive }) => (
            <>
              <Icono activo={isActive} />
              <span style={{ font: "600 9.5px/1 var(--f-mono)", letterSpacing: ".1em" }}>{etiqueta}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
