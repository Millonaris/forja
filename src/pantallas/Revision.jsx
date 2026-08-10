/*
 * FORJA · Revisión con Claude.
 *
 * Dos vías para lo mismo:
 *  1. Copiar el informe y pegarlo en Claude a mano. Gratis, sin clave y sin
 *     que salga nada del móvil hasta que tú lo pegues. Es la recomendada.
 *  2. Preguntar desde aquí con tu clave de API. Cómodo, cuesta unos céntimos
 *     por consulta y es lo único de la app que necesita internet.
 *
 * La app cruza cuatro dominios pero no razona sobre ellos: el informe existe
 * justo para eso — que alguien mire gimnasio, carrera, peso y postura a la vez
 * y decida prioridades.
 */

import { useState } from "react";

import Cabecera from "../componentes/Cabecera.jsx";
import { guardarAjustes } from "../datos/db.js";
import { useAjustes } from "../ganchos/useDatos.js";
import { consultarClaude, costeAproximado, tieneClave } from "../utiles/claude.js";
import { copiarInforme } from "../utiles/informe.js";
import { senalGuardado, vibrar } from "../utiles/senales.js";

export default function Revision() {
  const { ajustes } = useAjustes();

  const [informe, setInforme] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [editandoClave, setEditandoClave] = useState(false);
  const [claveNueva, setClaveNueva] = useState("");

  const conClave = tieneClave(ajustes);

  const copiar = async () => {
    const { texto, copiado: ok } = await copiarInforme();
    setInforme(texto);
    setCopiado(ok);
    if (ok) senalGuardado();
  };

  const preguntar = async () => {
    setCargando(true);
    setError(null);
    setRespuesta(null);
    try {
      const r = await consultarClaude(ajustes, pregunta);
      setRespuesta(r);
      senalGuardado();
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };

  const guardarClave = async () => {
    await guardarAjustes({ claveClaude: claveNueva.trim() || null });
    setClaveNueva("");
    setEditandoClave(false);
    vibrar(20);
  };

  return (
    <div className="f-pantalla">
      <Cabecera titulo="Revisión" atras />

      <div className="f-scroll" style={{ gap: 16 }}>
        <p className="f-pretty" style={{ font: "400 13.5px/1.5 var(--f-ui)", color: "var(--f-texto2)", margin: 0 }}>
          La app calcula los veredictos de cada dominio por separado. Esto junta gimnasio, carrera, peso y postura en un
          informe para que alguien decida las prioridades de la semana.
        </p>

        {/* ---- Vía 1: copiar y pegar ---- */}
        <div className="f-tarjeta" style={{ padding: 16, borderRadius: 16 }}>
          <div className="f-etiqueta">COPIAR Y PEGAR EN CLAUDE</div>
          <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 8 }}>
            Gratis, sin clave y sin conexión: el informe se queda en el móvil hasta que tú lo pegues donde quieras.
          </div>
          <button className="f-boton" style={{ marginTop: 14 }} onClick={copiar}>
            {copiado ? "COPIADO ✓" : "GENERAR INFORME"}
          </button>

          {informe && (
            <>
              <div className="f-etiqueta" style={{ marginTop: 14, marginBottom: 8 }}>
                {copiado ? "YA LO TIENES EN EL PORTAPAPELES" : "COPIA ESTE TEXTO A MANO"}
              </div>
              <textarea
                className="f-area"
                readOnly
                value={informe}
                onFocus={(e) => e.target.select()}
                style={{ minHeight: 180, font: "400 11px/1.5 var(--f-mono)" }}
              />
            </>
          )}
        </div>

        {/* ---- Vía 2: preguntar desde la app ---- */}
        <div className="f-tarjeta" style={{ padding: 16, borderRadius: 16 }}>
          <div className="f-fila-sb">
            <span className="f-etiqueta">PREGUNTAR DESDE LA APP</span>
            <span
              style={{
                font: "600 10px/1 var(--f-mono)",
                color: conClave ? "var(--f-ok)" : "var(--f-texto3)",
              }}
            >
              {conClave ? "CLAVE GUARDADA" : "SIN CLAVE"}
            </span>
          </div>

          {!conClave && !editandoClave && (
            <>
              <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 8 }}>
                Necesita una clave de API de Anthropic. Se guarda en este móvil y solo se usa para esta pantalla. Cada
                consulta cuesta unos 7 céntimos y es lo único de la app que necesita internet.
              </div>
              <button
                className="f-boton f-boton--fantasma f-boton--peq"
                style={{ marginTop: 14 }}
                onClick={() => setEditandoClave(true)}
              >
                AÑADIR CLAVE
              </button>
            </>
          )}

          {editandoClave && (
            <>
              <input
                type="password"
                value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)}
                placeholder="sk-ant-..."
                autoComplete="off"
                style={{
                  width: "100%",
                  height: 48,
                  marginTop: 12,
                  padding: "0 13px",
                  background: "var(--f-sup2)",
                  border: "1px solid var(--f-borde2)",
                  borderRadius: 10,
                  font: "500 13px/1 var(--f-mono)",
                  color: "var(--f-texto)",
                }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="f-boton f-boton--peq" style={{ flex: 1 }} onClick={guardarClave}>
                  GUARDAR
                </button>
                <button
                  className="f-boton f-boton--fantasma f-boton--peq"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setEditandoClave(false);
                    setClaveNueva("");
                  }}
                >
                  CANCELAR
                </button>
              </div>
            </>
          )}

          {conClave && (
            <>
              <textarea
                className="f-area"
                style={{ marginTop: 12, minHeight: 70 }}
                placeholder="¿Algo concreto? (opcional) Ej: el press banca lleva 4 sesiones plano y no sé si bajar el déficit."
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
              />
              <button className="f-boton" style={{ marginTop: 12 }} onClick={preguntar} disabled={cargando}>
                {cargando ? "PENSANDO…" : "PEDIR REVISIÓN"}
              </button>
              <button
                className="f-boton f-boton--fantasma f-boton--peq"
                style={{ marginTop: 10, color: "var(--f-texto3)" }}
                onClick={() => setEditandoClave(true)}
              >
                CAMBIAR CLAVE
              </button>
            </>
          )}

          {error && (
            <div
              className="f-pretty"
              style={{
                marginTop: 12,
                padding: "11px 13px",
                borderRadius: 10,
                border: "1px solid var(--f-alerta)",
                font: "400 13px/1.5 var(--f-ui)",
                color: "var(--f-texto2)",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ---- Respuesta ---- */}
        {respuesta && (
          <div className="f-tarjeta f-tarjeta--destacada" style={{ padding: 16, borderRadius: 16 }}>
            <div className="f-etiqueta" style={{ color: "var(--f-acento)" }}>REVISIÓN</div>
            <div
              className="f-pretty"
              style={{ font: "400 14px/1.6 var(--f-ui)", color: "var(--f-texto)", marginTop: 10, whiteSpace: "pre-wrap" }}
            >
              {respuesta.texto}
            </div>
            <div style={{ font: "400 11px/1.4 var(--f-ui)", color: "var(--f-texto3)", marginTop: 14 }}>
              {respuesta.tokens.entrada + respuesta.tokens.salida} tokens · coste aproximado{" "}
              {(costeAproximado(respuesta.tokens) ?? 0).toFixed(3)} $
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
