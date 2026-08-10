/*
 * FORJA · Temporizador de intervalos.
 *
 * A pleno sol el color de fondo ES la información: verde entero = CORRE,
 * ámbar entero = CAMINA. El contador ocupa 168 px para poder leerlo de reojo
 * sin parar, sin acercarse el móvil y sin gafas.
 *
 * Cada cambio de bloque avisa con pitido y vibración, y los 3 últimos segundos
 * hacen cuenta atrás, para no tener que mirar la pantalla en todo el rodaje.
 *
 * No hay GPS: los kilómetros se apuntan al terminar, precargados con los que
 * tocaban según el plan. Medir la distancia con el GPS del móvil es impreciso
 * y se come la batería en una tirada larga.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DialogoCarrera from "../componentes/DialogoCarrera.jsx";
import { INTERVALOS_F1, bloquesIntervalos } from "../datos/planCarrera.js";
import { useAjustes } from "../ganchos/useDatos.js";
import { useCuentaAtras } from "../ganchos/useTemporizador.js";
import { useWakeLock } from "../ganchos/useWakeLock.js";
import { hoyISO, semanaDelPlan } from "../logica/fechas.js";
import { reloj } from "../logica/formato.js";
import {
  prepararAudio,
  senalCamina,
  senalCorre,
  senalCuentaAtras,
  senalFin,
  vibrar,
} from "../utiles/senales.js";

/** Color de fondo y de tinta según el tipo de bloque. */
const PALETA = {
  calienta: { fondo: "var(--f-acento)", tinta: "var(--f-acento-tinta)" },
  corre: { fondo: "var(--f-ok)", tinta: "var(--f-ok-tinta)" },
  camina: { fondo: "var(--f-aviso)", tinta: "#2A1A00" },
  enfria: { fondo: "var(--f-acento)", tinta: "var(--f-acento-tinta)" },
};

export default function TimerIntervalos() {
  const { semana } = useParams();
  const navegar = useNavigate();
  const { ajustes } = useAjustes();

  const semanaNum = Math.min(Math.max(Number(semana) || 1, 1), 8);
  const bloques = useMemo(() => bloquesIntervalos(semanaNum), [semanaNum]);
  const protocolo = INTERVALOS_F1[semanaNum];

  const [indice, setIndice] = useState(0);
  const [arrancado, setArrancado] = useState(false);
  const [terminado, setTerminado] = useState(false);
  const [transcurrido, setTranscurrido] = useState(0);
  const [dialogo, setDialogo] = useState(false);

  useWakeLock(ajustes.wakeLock !== false && arrancado && !terminado);

  const bloque = bloques[indice];
  const siguiente = bloques[indice + 1];

  // Avanza al siguiente bloque y avisa según lo que toque hacer.
  const alTerminarBloque = () => {
    if (indice >= bloques.length - 1) {
      setTerminado(true);
      senalFin();
      setDialogo(true);
      return;
    }
    const proximo = bloques[indice + 1];
    if (proximo.tipo === "corre") senalCorre();
    else if (proximo.tipo === "camina") senalCamina();
    else vibrar([0, 150, 80, 150]);
    setIndice((i) => i + 1);
  };

  const cuenta = useCuentaAtras(bloque?.segundos ?? 0, alTerminarBloque, false);

  // Cuenta atrás sonora de los 3 últimos segundos.
  const ultimoAviso = useRef(null);
  useEffect(() => {
    if (!cuenta.corriendo) return;
    const seg = Math.ceil(cuenta.restante);
    if (seg <= 3 && seg > 0 && ultimoAviso.current !== `${indice}-${seg}`) {
      ultimoAviso.current = `${indice}-${seg}`;
      senalCuentaAtras();
    }
  }, [cuenta.restante, cuenta.corriendo, indice]);

  // Tiempo total de la sesión, para el resumen final. Se cuenta contra el
  // reloj real y no sumando ticks: si Android frena el setInterval con la
  // pantalla atenuada, el total seguiría siendo correcto.
  const inicioSesion = useRef(null);
  useEffect(() => {
    if (!arrancado || terminado) return undefined;
    if (inicioSesion.current == null) inicioSesion.current = Date.now();
    const id = setInterval(() => {
      setTranscurrido(Math.round((Date.now() - inicioSesion.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [arrancado, terminado]);

  // Al cambiar de bloque arranca solo: nunca hay que darle a un play a mitad.
  useEffect(() => {
    if (arrancado && !terminado) cuenta.arrancar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, arrancado]);

  const empezar = () => {
    prepararAudio();
    setArrancado(true);
    // El primer bloque es CALIENTA: una vibración neutra, no la señal de
    // "corre" — esa suena cuando de verdad toca correr, en el cambio de bloque.
    vibrar([0, 150, 80, 150]);
  };

  const paleta = PALETA[bloque?.tipo] || PALETA.calienta;
  const minutosTotales = Math.round(bloques.reduce((t, b) => t + b.segundos, 0) / 60);

  // ---- Antes de empezar: qué toca y el botón grande ----
  if (!arrancado) {
    return (
      <div className="f-pantalla">
        <div className="f-scroll" style={{ paddingTop: 20, justifyContent: "center", gap: 20 }}>
          <div>
            <div className="f-etiqueta">INTERVALOS · SEMANA {semanaNum}</div>
            <div className="f-cifra" style={{ fontSize: 44, lineHeight: 1.05, textTransform: "uppercase", marginTop: 10 }}>
              {protocolo.texto}
            </div>
            <div style={{ font: "400 14px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 10 }}>
              Con 5 min de calentamiento y 5 de enfriamiento andando. Total {minutosTotales} min.
            </div>
          </div>

          {/* Vista previa de la sesión entera */}
          <div className="f-tarjeta" style={{ padding: "14px 15px" }}>
            <div className="f-etiqueta" style={{ marginBottom: 12 }}>LA SESIÓN, BLOQUE A BLOQUE</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {bloques.map((b, i) => (
                <span
                  key={i}
                  title={`${b.etiqueta} ${reloj(b.segundos)}`}
                  style={{
                    height: 10,
                    flexGrow: b.segundos,
                    flexBasis: 0,
                    minWidth: 6,
                    borderRadius: 5,
                    background: PALETA[b.tipo].fondo,
                    opacity: b.tipo === "corre" ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 12, font: "500 9.5px/1 var(--f-mono)", color: "var(--f-texto3)" }}>
              <span><span style={{ color: "var(--f-ok)" }}>■</span> CORRE</span>
              <span><span style={{ color: "var(--f-aviso)" }}>■</span> CAMINA</span>
              <span><span style={{ color: "var(--f-acento)" }}>■</span> CALIENTA / ENFRÍA</span>
            </div>
          </div>

          <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto3)" }}>
            Sube el volumen: cada cambio avisa con pitido y vibración, así no hace falta mirar la pantalla.
          </div>
        </div>

        <div className="f-acciones">
          <button className="f-boton" style={{ minHeight: 82, fontSize: 26 }} onClick={empezar}>
            EMPEZAR
          </button>
          <button className="f-boton f-boton--fantasma f-boton--peq" onClick={() => navegar(-1)}>
            VOLVER
          </button>
        </div>
      </div>
    );
  }

  // ---- En marcha: el color es el mensaje ----
  const rondasCorre = bloques.filter((b) => b.tipo === "corre");
  const rondaActual = bloque.tipo === "corre" ? bloque.ronda : null;

  return (
    <div
      className="f-pantalla no-sel"
      style={{ background: paleta.fondo, color: paleta.tinta, animation: "f-respira 3s ease-in-out infinite" }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          minHeight: 0,
        }}
      >
        <div style={{ font: "800 clamp(48px, 22vw, 92px)/1 var(--f-display)", letterSpacing: ".06em" }}>
          {bloque.etiqueta}
        </div>

        <div
          className="f-cifra"
          style={{ fontSize: "clamp(92px, 40vw, 168px)", lineHeight: 0.9, letterSpacing: "-.02em", margin: "16px 0 4px" }}
        >
          {reloj(cuenta.restante)}
        </div>

        <div style={{ font: "600 clamp(14px, 5vw, 20px)/1 var(--f-mono)", opacity: 0.72 }}>
          quedan de {reloj(bloque.segundos)}
        </div>

        {/* Rondas de carrera completadas */}
        {rondasCorre.length > 1 && (
          <>
            <div style={{ display: "flex", gap: 8, marginTop: 40, width: "100%" }}>
              {rondasCorre.map((b) => (
                <span
                  key={b.ronda}
                  style={{
                    flex: 1,
                    height: 10,
                    borderRadius: 5,
                    background: `color-mix(in srgb, ${paleta.tinta} ${b.ronda <= (rondaActual ?? 0) ? "85%" : "25%"}, transparent)`,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                marginTop: 12,
                font: "600 13px/1 var(--f-mono)",
                opacity: 0.7,
              }}
            >
              <span>
                {rondaActual ? `BLOQUE ${rondaActual} DE ${rondasCorre.length}` : bloque.etiqueta}
              </span>
              <span>{siguiente ? `DESPUÉS: ${siguiente.etiqueta} ${reloj(siguiente.segundos)}` : "ÚLTIMO BLOQUE"}</span>
            </div>
          </>
        )}

        {/* Totales de la sesión */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            marginTop: 44,
            paddingTop: 22,
            borderTop: `2px solid color-mix(in srgb, ${paleta.tinta} 20%, transparent)`,
          }}
        >
          <div>
            <div className="f-cifra" style={{ fontSize: 46 }}>{reloj(transcurrido)}</div>
            <div style={{ font: "600 12px/1 var(--f-mono)", opacity: 0.7, marginTop: 6 }}>TIEMPO TOTAL</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="f-cifra" style={{ fontSize: 46 }}>
              {indice + 1}/{bloques.length}
            </div>
            <div style={{ font: "600 12px/1 var(--f-mono)", opacity: 0.7, marginTop: 6 }}>BLOQUES</div>
          </div>
        </div>
      </div>

      {/* ---- Controles ---- */}
      <div style={{ flex: "none", padding: "0 24px calc(24px + var(--f-safe-abajo))", display: "flex", gap: 12 }}>
        <button
          onClick={() => (cuenta.corriendo ? cuenta.pausar() : cuenta.arrancar())}
          style={{
            flex: 1,
            height: 82,
            borderRadius: 20,
            background: `color-mix(in srgb, ${paleta.tinta} 85%, transparent)`,
            color: paleta.fondo,
            font: "800 26px/1 var(--f-display)",
            letterSpacing: ".16em",
          }}
        >
          {cuenta.corriendo ? "PAUSA" : "SEGUIR"}
        </button>
        <button
          onClick={() => cuenta.saltar()}
          aria-label="Saltar al siguiente bloque"
          style={{
            width: 82,
            height: 82,
            flex: "none",
            borderRadius: 20,
            border: `3px solid color-mix(in srgb, ${paleta.tinta} 55%, transparent)`,
            color: paleta.tinta,
            font: "800 26px/1 var(--f-display)",
          }}
        >
          ▶▶
        </button>
      </div>

      {dialogo && (
        <DialogoCarrera
          fecha={hoyISO()}
          semana={semanaDelPlan(ajustes.startDate, hoyISO())}
          plan={{
            tipo: "intervalos",
            // Estimación honesta a partir del tiempo corriendo, para no partir de cero.
            km: Math.round((protocolo.reps * protocolo.corre) / 60 / 6.5 * 10) / 10,
            minutos: Math.round(transcurrido / 60) || minutosTotales,
          }}
          onCerrar={() => navegar("/carrera", { replace: true })}
        />
      )}
    </div>
  );
}
