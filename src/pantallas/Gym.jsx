/*
 * FORJA · Gimnasio.
 *
 * Punto de entrada al entreno: lo que toca hoy arriba, las cuatro sesiones de
 * la rotación por si quieres hacer otra, y el historial reciente debajo.
 * El veredicto de progresión vive en su propia pantalla, a un toque de aquí.
 */

import { useNavigate } from "react-router-dom";

import Cabecera from "../componentes/Cabecera.jsx";
import { NOMBRES_SESION, ejerciciosDe } from "../datos/ejercicios.js";
import { useAjustes, useSesionesGym } from "../ganchos/useDatos.js";
import { planDelDia, sesionGymProyectada } from "../logica/calendario.js";
import { formatoDia, haceCuanto, hoyISO, sumarDias } from "../logica/fechas.js";
import { duracion } from "../logica/formato.js";
import { duracionEstimada, numeroBloques } from "../logica/sesionGym.js";

export default function Gym() {
  const navegar = useNavigate();
  const { ajustes } = useAjustes();
  const sesiones = useSesionesGym(12);

  const hoy = hoyISO();
  const plan = planDelDia(ajustes.startDate, hoy);

  // Si hoy no toca gym, se busca el próximo día que sí.
  const siguienteDia = plan?.gym ? null : buscarProximoGym(ajustes.startDate, hoy);
  const nombreDestacado = plan?.gym?.sessionName || siguienteDia?.sessionName;
  const hechaHoy = sesiones.find((s) => s.date === hoy);

  // Cuándo se hizo por última vez cada una de las 4 sesiones.
  const ultimaPorNombre = new Map();
  for (const s of sesiones) {
    if (!ultimaPorNombre.has(s.sessionName)) ultimaPorNombre.set(s.sessionName, s);
  }

  return (
    <div className="f-pantalla">
      <Cabecera
        titulo="Gimnasio"
        derecha={
          <button
            className="f-etiqueta"
            style={{ color: "var(--f-acento)", padding: "10px 0 10px 12px" }}
            onClick={() => navegar("/progresion")}
          >
            PROGRESIÓN ›
          </button>
        }
      />

      <div className="f-scroll">
        {/* ---- Lo que toca ---- */}
        {nombreDestacado && (
          <div className={`f-tarjeta ${hechaHoy ? "f-tarjeta--ok" : "f-tarjeta--destacada"}`} style={{ padding: 20 }}>
            <div className="f-etiqueta" style={{ color: hechaHoy ? "var(--f-ok)" : "var(--f-acento)", letterSpacing: ".16em" }}>
              {hechaHoy ? "HECHO HOY" : plan?.gym ? "HOY TOCA" : `PRÓXIMA · ${formatoDia(siguienteDia.iso).toUpperCase()}`}
            </div>
            <div className="f-cifra" style={{ fontSize: 54, textTransform: "uppercase", margin: "12px 0 6px" }}>
              {nombreDestacado}
            </div>
            <div style={{ font: "400 14px/1.4 var(--f-ui)", color: "var(--f-texto2)" }}>
              {numeroBloques(nombreDestacado)} ejercicios · ~{duracionEstimada(nombreDestacado)} min
            </div>
            <button
              className={`f-boton ${hechaHoy ? "f-boton--fantasma" : ""}`}
              style={{ marginTop: 18 }}
              onClick={() =>
                hechaHoy ? navegar(`/resumen/${hechaHoy.id}`) : navegar(`/entreno/${encodeURIComponent(nombreDestacado)}`)
              }
            >
              {hechaHoy ? "VER RESUMEN" : "EMPEZAR SESIÓN"}
            </button>
          </div>
        )}

        {/* ---- La rotación completa ---- */}
        <div>
          <div className="f-etiqueta" style={{ marginBottom: 9 }}>LA ROTACIÓN · T-P-T-P</div>
          <div className="f-tarjeta">
            {NOMBRES_SESION.map((nombre) => {
              const ultima = ultimaPorNombre.get(nombre);
              return (
                <button
                  key={nombre}
                  className="f-fila"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => navegar(`/entreno/${encodeURIComponent(nombre)}`)}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        font: "700 17px/1.1 var(--f-display)",
                        textTransform: "uppercase",
                        letterSpacing: ".03em",
                        color: nombre === nombreDestacado ? "var(--f-acento)" : "var(--f-texto)",
                      }}
                    >
                      {nombre}
                    </span>
                    <span style={{ display: "block", font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 5 }}>
                      {ejerciciosDe(nombre).length} ejercicios ·{" "}
                      {ultima ? `hecha ${haceCuanto(ultima.date)}` : "nunca hecha"}
                    </span>
                  </span>
                  <span style={{ color: "var(--f-texto3)", font: "600 16px/1 var(--f-ui)" }}>›</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Historial ---- */}
        <div>
          <div className="f-etiqueta" style={{ marginBottom: 9 }}>ÚLTIMAS SESIONES</div>
          {sesiones.length === 0 ? (
            <div className="f-tarjeta" style={{ borderStyle: "dashed", padding: 22, textAlign: "center" }}>
              <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
                Todavía no has guardado ninguna sesión. En cuanto entrenes aparecerán aquí con su comparación.
              </div>
            </div>
          ) : (
            <div className="f-tarjeta">
              {sesiones.map((s) => (
                <button
                  key={s.id}
                  className="f-fila"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => navegar(`/resumen/${s.id}`)}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", font: "500 13.5px/1.2 var(--f-ui)" }}>{s.sessionName}</span>
                    <span style={{ display: "block", font: "400 11.5px/1.2 var(--f-ui)", color: "var(--f-texto3)", marginTop: 4 }}>
                      {formatoDia(s.date)} · {duracion(s.durationMin)}
                    </span>
                  </span>
                  <span style={{ color: "var(--f-texto3)", font: "600 16px/1 var(--f-ui)" }}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Busca el siguiente día de gimnasio a partir de mañana. */
function buscarProximoGym(inicio, desde) {
  for (let i = 1; i <= 14; i++) {
    const iso = sumarDias(desde, i);
    const nombre = sesionGymProyectada(inicio, iso);
    if (nombre) return { iso, sessionName: nombre };
  }
  return null;
}
