/*
 * FORJA · Postura.
 *
 * Dos modos en la misma pantalla:
 *  - Resumen: la rutina como checklist, el test de la pared y las fotos.
 *  - Rutina guiada (/postura/rutina): un solo ejercicio activo con su timer
 *    en grande y el resto tachado, para que la pantalla siempre conteste
 *    "qué estoy haciendo ahora" sin tener que buscarlo.
 *
 * El día cuenta como completo cuando están hechos todos los ejercicios del
 * bloque principal de esa semana (7 al principio, 6 a partir de la semana 5,
 * cuando el de pelvis sale de la rutina).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";

import Cabecera from "../componentes/Cabecera.jsx";
import { Check, Pendiente } from "../componentes/Iconos.jsx";
import { db } from "../datos/db.js";
import { CADA_SEMANAS_TEST, DIAS_EXTRAS, SEMANAS_TEST, TEST_PARED, idsPrincipales, rutinaDeSemana } from "../datos/rutinaPostural.js";
import { useAjustes, usePostura } from "../ganchos/useDatos.js";
import { useCuentaAtras } from "../ganchos/useTemporizador.js";
import { useWakeLock } from "../ganchos/useWakeLock.js";
import { rachaPostural } from "../logica/diario.js";
import { diaSemana, haceCuanto, hoyISO, semanaDelPlan } from "../logica/fechas.js";
import { reloj } from "../logica/formato.js";
import { comprimirImagen, urlDeBlob } from "../utiles/imagenes.js";
import { prepararAudio, senalDescansoFin, senalFin, senalGuardado } from "../utiles/senales.js";

export default function Postura({ modo = "resumen" }) {
  const { ajustes } = useAjustes();
  const posturaPorDia = usePostura();
  const hoy = hoyISO();
  const semana = semanaDelPlan(ajustes.startDate, hoy);
  const conExtras = DIAS_EXTRAS.includes(diaSemana(hoy));

  const rutina = useMemo(() => rutinaDeSemana(semana, conExtras), [semana, conExtras]);
  const principales = useMemo(() => idsPrincipales(semana), [semana]);
  const registroHoy = posturaPorDia.get(hoy);
  const hechos = registroHoy?.completedIds || [];

  /** Marca o desmarca un ejercicio y recalcula si el día está completo. */
  const alternar = async (id) => {
    const nuevos = hechos.includes(id) ? hechos.filter((x) => x !== id) : [...hechos, id];
    const completo = principales.every((p) => nuevos.includes(p));
    const yaEstaba = registroHoy?.fullDone;
    await db.postureDays.put({ date: hoy, completedIds: nuevos, fullDone: completo });
    if (completo && !yaEstaba) senalFin();
    else senalGuardado();
  };

  if (modo === "rutina") {
    return <RutinaGuiada rutina={rutina} hechos={hechos} principales={principales} onAlternar={alternar} ajustes={ajustes} />;
  }

  return (
    <Resumen
      ajustes={ajustes}
      semana={semana}
      rutina={rutina}
      principales={principales}
      hechos={hechos}
      posturaPorDia={posturaPorDia}
      onAlternar={alternar}
      hoy={hoy}
    />
  );
}

/* ============================ RESUMEN ============================ */

function Resumen({ ajustes, semana, rutina, principales, hechos, posturaPorDia, onAlternar, hoy }) {
  const navegar = useNavigate();
  const [dialogoTest, setDialogoTest] = useState(false);

  const racha = useMemo(() => rachaPostural(posturaPorDia, hoy), [posturaPorDia, hoy]);
  const hechosPrincipales = principales.filter((p) => hechos.includes(p)).length;

  const tests = useLiveQuery(() => db.postureTests.orderBy("date").reverse().toArray(), [], []);
  const fotos = useLiveQuery(() => db.posturePhotos.orderBy("week").toArray(), [], []);

  const ultimoTest = tests[0] || null;
  const semanaUltimoTest = ultimoTest ? semanaDelPlan(ajustes.startDate, ultimoTest.date) : null;
  // El plan fija el test en el día 0 y en las semanas 6 y 12; a partir de ahí
  // se mantiene la cadencia de 6 semanas.
  const tocaPorPlan = SEMANAS_TEST.includes(semana) && semanaUltimoTest !== semana;
  const tocaPorCadencia = !ultimoTest || semana - semanaUltimoTest >= CADA_SEMANAS_TEST;
  const tocaTest = tocaPorPlan || tocaPorCadencia;
  const fotoDeEstaSemana = fotos.find((f) => f.week === semana);

  return (
    <div className="f-pantalla">
      <Cabecera
        titulo="Postura"
        atras
        derecha={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--f-sup)",
              border: "1px solid var(--f-borde)",
              borderRadius: 20,
              padding: "7px 13px",
            }}
          >
            <span className="f-punto" style={{ background: racha > 0 ? "var(--f-ok)" : "var(--f-texto3)", width: 8, height: 8 }} />
            <span style={{ font: "700 15px/1 var(--f-display)", letterSpacing: ".08em" }}>
              RACHA {racha} DÍA{racha === 1 ? "" : "S"}
            </span>
          </div>
        }
      />

      <div className="f-scroll">
        {/* ---- La rutina como checklist ---- */}
        <div className="f-tarjeta" style={{ padding: "14px 4px 8px", borderRadius: 16 }}>
          <div className="f-fila-sb" style={{ padding: "0 14px 12px" }}>
            <span className="f-etiqueta">RUTINA DIARIA · {rutina.length} EJERCICIOS</span>
            <span style={{ font: "700 14px/1 var(--f-display)", color: "var(--f-acento)" }}>
              {hechosPrincipales}/{principales.length}
            </span>
          </div>

          {rutina.map((ej) => {
            const hecho = hechos.includes(ej.id);
            return (
              <button
                key={ej.id}
                onClick={() => onAlternar(ej.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderTop: "1px solid var(--f-borde-sutil)",
                  width: "100%",
                  textAlign: "left",
                  minHeight: 48,
                }}
              >
                {hecho ? <Check tam={24} /> : <Pendiente tam={24} />}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      font: "500 14px/1.2 var(--f-ui)",
                      color: hecho ? "var(--f-texto3)" : "var(--f-texto)",
                      textDecoration: hecho ? "line-through" : "none",
                    }}
                  >
                    {ej.nombre}
                    {ej.extra && <span style={{ color: "var(--f-texto3)" }}> · extra</span>}
                  </span>
                </span>
                <span style={{ font: "500 12px/1 var(--f-mono)", color: "var(--f-texto3)", flex: "none" }}>{ej.dosis}</span>
              </button>
            );
          })}
        </div>

        {/* ---- Test de la pared y foto ---- */}
        <div className="f-duo">
          <button
            className={`f-tarjeta ${tocaTest ? "f-tarjeta--aviso" : ""}`}
            style={{ padding: "12px 13px", textAlign: "left" }}
            onClick={() => setDialogoTest(true)}
          >
            <div className="f-etiqueta" style={{ fontSize: 9.5, letterSpacing: ".12em" }}>TEST DE LA PARED</div>
            {/* El color sale del propio resultado: "no llego" no puede pintarse
                de verde solo porque el test esté al día. */}
            <div
              className="f-cifra"
              style={{
                fontSize: 21,
                lineHeight: 1.05,
                marginTop: 9,
                color: tocaTest ? "var(--f-aviso)" : `var(--f-${colorTest(ultimoTest.result)})`,
              }}
            >
              {tocaTest ? "HOY TOCA" : etiquetaTest(ultimoTest.result)}
            </div>
            <div style={{ font: "400 11.5px/1.3 var(--f-ui)", color: "var(--f-texto2)", marginTop: 5 }}>
              {ultimoTest ? `${haceCuanto(ultimoTest.date)}` : "sin hacer todavía"}
            </div>
          </button>

          <div className="f-tarjeta" style={{ padding: "12px 13px" }}>
            <div className="f-etiqueta" style={{ fontSize: 9.5, letterSpacing: ".12em" }}>FOTO DE PERFIL</div>
            <div
              className="f-cifra"
              style={{ fontSize: 24, marginTop: 9, color: fotoDeEstaSemana ? "var(--f-ok)" : "var(--f-aviso)" }}
            >
              {fotoDeEstaSemana ? "HECHA" : "HOY TOCA"}
            </div>
            <div style={{ font: "400 11.5px/1.3 var(--f-ui)", color: "var(--f-texto2)", marginTop: 5 }}>
              Semana {semana}
            </div>
          </div>
        </div>

        <Comparativa fotos={fotos} semana={semana} />
      </div>

      <div className="f-acciones">
        <button className="f-boton" onClick={() => navegar("/postura/rutina")}>
          {hechosPrincipales === 0
            ? "EMPEZAR RUTINA"
            : hechosPrincipales >= principales.length
              ? "REPASAR RUTINA"
              : `SEGUIR RUTINA · ${hechosPrincipales}/${principales.length}`}
        </button>
      </div>

      {dialogoTest && <DialogoTest onCerrar={() => setDialogoTest(false)} hoy={hoy} />}
    </div>
  );
}

const etiquetaTest = (id) => TEST_PARED.opciones.find((o) => o.id === id)?.etiqueta ?? "—";
const colorTest = (id) => TEST_PARED.opciones.find((o) => o.id === id)?.color ?? "texto3";

/* ====================== COMPARATIVA DE FOTOS ====================== */

function Comparativa({ fotos, semana }) {
  const [subiendo, setSubiendo] = useState(false);
  const entrada = useRef(null);

  const primera = fotos[0] || null;
  const ultima = fotos.length > 1 ? fotos[fotos.length - 1] : null;

  // Las URLs de objeto se revocan al cambiar de foto o al salir de la pantalla.
  const [urls, setUrls] = useState({ a: null, b: null });
  useEffect(() => {
    const a = urlDeBlob(primera?.imageBlob);
    const b = urlDeBlob(ultima?.imageBlob);
    setUrls({ a, b });
    return () => {
      if (a) URL.revokeObjectURL(a);
      if (b) URL.revokeObjectURL(b);
    };
  }, [primera, ultima]);

  const subir = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const blob = await comprimirImagen(file);
      await db.posturePhotos.put({ week: semana, dateTaken: hoyISO(), imageBlob: blob });
      senalGuardado();
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  };

  return (
    <div className="f-tarjeta" style={{ padding: 14, borderRadius: 16 }}>
      <div className="f-fila-sb" style={{ marginBottom: 12 }}>
        <span className="f-etiqueta">COMPARATIVA</span>
        <span style={{ font: "500 10px/1 var(--f-mono)", color: "var(--f-texto3)" }}>{fotos.length} FOTOS</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Hueco url={urls.a} etiqueta={primera ? `semana ${primera.week}` : "semana 1"} />
        <Hueco url={urls.b} etiqueta={ultima ? `semana ${ultima.week}` : `semana ${semana}`} destacado />
      </div>

      <input ref={entrada} type="file" accept="image/*" capture="environment" onChange={subir} style={{ display: "none" }} />
      <button
        className="f-boton f-boton--fantasma f-boton--peq"
        style={{ marginTop: 12 }}
        onClick={() => entrada.current?.click()}
        disabled={subiendo}
      >
        {subiendo ? "GUARDANDO…" : `HACER FOTO · SEMANA ${semana}`}
      </button>
    </div>
  );
}

function Hueco({ url, etiqueta, destacado }) {
  return (
    <div
      style={{
        flex: 1,
        height: 126,
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${destacado ? "var(--f-acento)" : "var(--f-borde)"}`,
        background: url
          ? "var(--f-sup2)"
          : "repeating-linear-gradient(135deg, var(--f-sup2) 0 8px, var(--f-fondo) 8px 16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {url ? (
        <img src={url} alt={`Foto de perfil ${etiqueta}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span
          style={{
            font: "500 10px/1.4 var(--f-mono)",
            color: destacado ? "var(--f-acento)" : "var(--f-texto3)",
            textAlign: "center",
          }}
        >
          foto perfil
          <br />
          {etiqueta}
        </span>
      )}
    </div>
  );
}

/* ======================= TEST DE LA PARED ======================= */

function DialogoTest({ onCerrar, hoy }) {
  const guardar = async (id) => {
    await db.postureTests.put({ date: hoy, result: id });
    senalGuardado();
    onCerrar();
  };

  return (
    <div
      role="dialog"
      aria-label="Test de la pared"
      onClick={onCerrar}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--f-sup)",
          borderTop: "1px solid var(--f-borde)",
          borderRadius: "22px 22px 0 0",
          padding: "20px 18px calc(20px + var(--f-safe-abajo))",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div className="f-fila-sb">
          <span className="f-etiqueta">TEST DE LA PARED</span>
          <button onClick={onCerrar} style={{ font: "500 12px/1 var(--f-mono)", color: "var(--f-texto3)", padding: 10, margin: -10 }}>
            CERRAR
          </button>
        </div>

        <p className="f-pretty" style={{ font: "400 13.5px/1.5 var(--f-ui)", color: "var(--f-texto2)", margin: 0 }}>
          {TEST_PARED.descripcion}
        </p>

        {TEST_PARED.opciones.map((o) => (
          <button
            key={o.id}
            onClick={() => guardar(o.id)}
            className="f-tarjeta"
            style={{ padding: 14, textAlign: "left", borderColor: `var(--f-${o.color})` }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span className="f-punto" style={{ background: `var(--f-${o.color})` }} />
              <span style={{ font: "700 17px/1 var(--f-display)", letterSpacing: ".06em", textTransform: "uppercase" }}>
                {o.etiqueta}
              </span>
            </div>
            <div className="f-pretty" style={{ font: "400 13px/1.5 var(--f-ui)", color: "var(--f-texto2)", marginTop: 8 }}>
              {o.lectura}
            </div>
            <div className="f-pretty" style={{ font: "500 13px/1.5 var(--f-ui)", color: "var(--f-texto)", marginTop: 6 }}>
              {o.accion}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ======================= RUTINA GUIADA ======================= */

function RutinaGuiada({ rutina, hechos, principales, onAlternar, ajustes }) {
  const navegar = useNavigate();
  const [indice, setIndice] = useState(() => {
    const primero = rutina.findIndex((e) => !hechos.includes(e.id));
    return primero === -1 ? 0 : primero;
  });
  const [serie, setSerie] = useState(1);

  const ejercicio = rutina[indice];
  useWakeLock(ajustes.wakeLock !== false);

  const alTerminarSerie = () => {
    senalDescansoFin();
    if (serie < (ejercicio.series || 1)) setSerie((s) => s + 1);
  };

  const segundos = ejercicio?.tipo === "tiempo" ? ejercicio.segundos : (ejercicio?.pausa || 3) * (ejercicio?.reps || 8);
  const cuenta = useCuentaAtras(segundos, alTerminarSerie, false);

  // Al cambiar de ejercicio se vuelve a la serie 1.
  useEffect(() => {
    setSerie(1);
  }, [indice]);

  // Al cambiar de serie o de ejercicio, el reloj vuelve a su duración.
  // Sin esto, tras acabar una serie el contador se quedaba en 0:00 y
  // arrancar() (que ignora relojes agotados) dejaba el botón muerto.
  useEffect(() => {
    cuenta.reiniciar(segundos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, serie]);

  if (!ejercicio) return null;

  const ultimo = indice >= rutina.length - 1;
  const hecho = hechos.includes(ejercicio.id);
  const hechosPrincipales = principales.filter((p) => hechos.includes(p)).length;

  const siguiente = async () => {
    if (!hecho) await onAlternar(ejercicio.id);
    if (ultimo) navegar("/postura", { replace: true });
    else setIndice((i) => i + 1);
  };

  return (
    <div className="f-pantalla">
      <div style={{ flex: "none", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          onClick={() => navegar("/postura")}
          className="f-etiqueta"
          style={{ letterSpacing: ".14em", padding: "8px 10px 8px 0", margin: "-8px 0" }}
        >
          ‹ POSTURA · {hechosPrincipales}/{principales.length}
        </button>
        <div style={{ display: "flex", gap: 4, flex: "none" }}>
          {rutina.map((e, i) => (
            <span
              key={e.id}
              style={{
                width: 18,
                height: 5,
                borderRadius: 3,
                background: hechos.includes(e.id) ? "var(--f-ok)" : i === indice ? "var(--f-acento)" : "var(--f-borde)",
              }}
            />
          ))}
        </div>
      </div>

      <div className="f-scroll" style={{ paddingTop: 0, justifyContent: "center", gap: 20 }}>
        <div>
          <div className="f-etiqueta">
            EJERCICIO {indice + 1} DE {rutina.length}
          </div>
          <div className="f-cifra" style={{ fontSize: 38, lineHeight: 1.05, textTransform: "uppercase", marginTop: 10 }}>
            {ejercicio.nombre}
          </div>
          <div style={{ font: "400 14px/1.4 var(--f-ui)", color: "var(--f-texto2)", marginTop: 8 }}>
            {ejercicio.dosis}
            {ejercicio.porLado && " · cada lado"}
          </div>
        </div>

        {/* Temporizador de la serie en curso */}
        <div className="f-tarjeta f-tarjeta--destacada" style={{ padding: "22px 18px", textAlign: "center", borderRadius: 20 }}>
          <div className="f-etiqueta" style={{ color: "var(--f-acento)", letterSpacing: ".16em" }}>
            SERIE {serie} DE {ejercicio.series || 1}
          </div>
          <div className="f-cifra" style={{ fontSize: 92, margin: "10px 0 14px" }}>
            {reloj(cuenta.restante)}
          </div>
          <button
            className={`f-boton ${cuenta.corriendo ? "f-boton--fantasma" : ""}`}
            onClick={() => {
              prepararAudio();
              if (cuenta.corriendo) {
                cuenta.pausar();
              } else if (cuenta.restante <= 0) {
                // Tras la última serie el reloj queda en 0: repetirla debe
                // rearmarlo entero, no intentar arrancar un reloj agotado.
                cuenta.reiniciar(segundos);
                cuenta.arrancar();
              } else {
                cuenta.arrancar();
              }
            }}
          >
            {cuenta.corriendo
              ? "PAUSA"
              : cuenta.restante <= 0
                ? "OTRA VEZ"
                : cuenta.restante < segundos || serie > 1
                  ? "SEGUIR"
                  : "EMPEZAR"}
          </button>
        </div>

        <p className="f-pretty" style={{ font: "400 13.5px/1.5 var(--f-ui)", color: "var(--f-texto2)", margin: 0 }}>
          {ejercicio.nota}
        </p>
      </div>

      <div className="f-acciones">
        <button className="f-boton" style={{ minHeight: 72 }} onClick={siguiente}>
          {ultimo ? "TERMINAR RUTINA" : hecho ? "SIGUIENTE" : "HECHO · SIGUIENTE"}
        </button>
        {indice > 0 && (
          <button className="f-boton f-boton--fantasma f-boton--peq" onClick={() => setIndice((i) => i - 1)}>
            ANTERIOR
          </button>
        )}
      </div>
    </div>
  );
}
