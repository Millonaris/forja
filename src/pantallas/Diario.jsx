/*
 * FORJA · Diario de 26 semanas.
 *
 * Los checks NO se marcan a mano: salen de lo que has registrado de verdad.
 * Si guardaste la sesión de gym el miércoles, el check del miércoles ya está
 * puesto y pone "auto". El override manual existe para los días raros
 * (entrenaste sin el móvil, o marcas descanso deliberado) y siempre gana.
 *
 * El calendario completo es un mapa de calor para ver la constancia de un
 * vistazo: lo que importa a 26 semanas vista no es un día, es el patrón.
 */

import { useMemo, useState } from "react";

import Cabecera from "../componentes/Cabecera.jsx";
import { Check, Pendiente } from "../componentes/Iconos.jsx";
import { db } from "../datos/db.js";
import { useAjustes, useRegistrosDiario } from "../ganchos/useDatos.js";
import { construirCalendario, SEMANAS_PLAN } from "../logica/calendario.js";
import { DOMINIOS, adherencia, estadoDelDia, tonoDelDia } from "../logica/diario.js";
import {
  INICIALES_SEMANA,
  diasEntre,
  formatoDia,
  hoyISO,
  lunesDeSemana,
  semanaDe,
  semanaDelPlan,
  sumarDias,
} from "../logica/fechas.js";
import { senalGuardado } from "../utiles/senales.js";

export default function Diario() {
  const { ajustes } = useAjustes();
  const registros = useRegistrosDiario();
  const hoy = hoyISO();
  const [elegido, setElegido] = useState(hoy);
  const [todas, setTodas] = useState(false);

  const inicio = ajustes.startDate;
  const desfase = ajustes.desfaseCarrera || 0;
  const semanaActual = semanaDelPlan(inicio, hoy);
  // El calendario ya se alarga solo hasta cubrir el día del 20K (las fechas
  // del plan de carrera van aparte del inicio de la app): el diario enseña
  // exactamente las semanas que el calendario tenga.
  const totalSemanas = construirCalendario(inicio, desfase).size / 7;

  // Ventana por defecto: las 3 semanas anteriores, la actual y la siguiente.
  const semanasVisibles = useMemo(() => {
    const todasLasSemanas = Array.from({ length: totalSemanas }, (_, i) => i + 1);
    if (todas) return todasLasSemanas;
    const desde = Math.max(1, Math.min(semanaActual - 3, totalSemanas - 4));
    return todasLasSemanas.filter((s) => s >= desde && s <= desde + 4);
  }, [todas, semanaActual, totalSemanas]);

  // Estado de los 182 días. Se recalcula solo cuando cambian los registros.
  const estados = useMemo(() => {
    if (!registros) return null;
    const cal = construirCalendario(inicio, desfase);
    const mapa = new Map();
    for (const iso of cal.keys()) mapa.set(iso, estadoDelDia(inicio, iso, registros, desfase));
    return mapa;
  }, [registros, inicio, desfase]);

  if (!estados) return <div className="f-pantalla" />;

  const estadoElegido = estados.get(elegido) || estadoDelDia(inicio, elegido, registros, desfase);

  // Adherencia de la semana en curso y del plan completo hasta hoy.
  const deLaSemana = semanaDe(hoy)
    .map((iso) => estados.get(iso))
    .filter(Boolean)
    .filter((e) => e.iso <= hoy);
  const hastaHoy = [...estados.values()].filter((e) => e.iso <= hoy);

  const semanal = adherencia(deLaSemana);
  const total = adherencia(hastaHoy);

  const alternarCheck = async (clave) => {
    const actual = registros.overrides.get(elegido) || { date: elegido };
    const auto = estadoElegido.checks[clave];
    // El override guarda el valor contrario al que se ve ahora mismo.
    await db.diaryOverrides.put({ ...actual, date: elegido, [clave]: !auto.hecho });
    senalGuardado();
  };

  const guardarNota = async (texto) => {
    const actual = registros.overrides.get(elegido) || { date: elegido };
    await db.diaryOverrides.put({ ...actual, date: elegido, note: texto });
  };

  return (
    <div className="f-pantalla">
      <Cabecera
        titulo="Diario"
        derecha={
          <span className="f-mono" style={{ font: "500 11px/1 var(--f-mono)", color: "var(--f-texto3)" }}>
            SEM {Math.min(semanaActual, SEMANAS_PLAN)}/{SEMANAS_PLAN}
          </span>
        }
      />

      <div className="f-scroll">
        {/* ---- Adherencia ---- */}
        <div className="f-duo">
          <TarjetaAdherencia etiqueta="ADHERENCIA SEMANA" datos={semanal} />
          <TarjetaAdherencia etiqueta="ADHERENCIA TOTAL" datos={total} />
        </div>

        {/* ---- Mapa de calor ----
             Por defecto solo la ventana alrededor de la semana en curso: con
             las 26 filas abiertas el detalle del día queda fuera de pantalla. */}
        <div className="f-tarjeta" style={{ padding: 14, borderRadius: 16 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "26px repeat(7, 1fr)",
              gap: 6,
              font: "500 9.5px/1 var(--f-mono)",
              letterSpacing: ".1em",
              color: "var(--f-texto3)",
              marginBottom: 10,
            }}
          >
            <span>SEM</span>
            {INICIALES_SEMANA.map((d, i) => (
              <span key={i} style={{ textAlign: "center" }}>{d}</span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "26px repeat(7, 1fr)", gap: 6, alignItems: "center" }}>
            {semanasVisibles.map((s) => (
              <FilaSemana
                key={s}
                semana={s}
                lunes={lunesDeSemana(inicio, s)}
                estados={estados}
                hoy={hoy}
                elegido={elegido}
                esActual={s === semanaActual}
                alto={todas ? 18 : 26}
                onElegir={setElegido}
              />
            ))}
          </div>

          <button
            className="f-boton f-boton--fantasma"
            style={{ minHeight: 40, marginTop: 14, fontSize: 13, color: "var(--f-texto2)" }}
            onClick={() => setTodas((v) => !v)}
          >
            {todas ? "VER SOLO ESTAS SEMANAS" : `VER LAS ${totalSemanas} SEMANAS`}
          </button>

          <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap", font: "500 9.5px/1 var(--f-mono)", color: "var(--f-texto3)" }}>
            <Leyenda color="var(--f-heat-ok)" texto="COMPLETO" />
            <Leyenda color="var(--f-heat-parcial)" texto="PARCIAL" />
            <Leyenda color="var(--f-heat-vacio)" texto="SIN DATOS" />
          </div>
        </div>

        {/* ---- Detalle del día elegido ---- */}
        <div className="f-tarjeta f-tarjeta--destacada" style={{ padding: 16, borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
            <div className="f-cifra" style={{ fontSize: 24, textTransform: "uppercase" }}>
              {formatoDia(elegido)}
            </div>
            <span style={{ font: "500 10px/1 var(--f-mono)", color: "var(--f-acento)", flex: "none" }}>
              SEM {semanaDelPlan(inicio, elegido)} · DÍA {diasEntre(inicio, elegido) + 1}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
            {DOMINIOS.map(({ clave, etiqueta }) => {
              const check = estadoElegido.checks[clave];
              if (!check.planificado && !check.hecho) {
                return (
                  <div key={clave} style={{ display: "flex", alignItems: "center", gap: 11, opacity: 0.45 }}>
                    <span style={{ width: 22, height: 22, flex: "none" }} />
                    <span style={{ flex: 1, font: "500 14px/1.2 var(--f-ui)", color: "var(--f-texto3)" }}>
                      {etiqueta} · no toca
                    </span>
                  </div>
                );
              }
              return (
                <button
                  key={clave}
                  onClick={() => alternarCheck(clave)}
                  style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", minHeight: 44 }}
                >
                  {check.hecho ? <Check tam={22} /> : <Pendiente tam={22} />}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        font: "500 14px/1.2 var(--f-ui)",
                        color: check.hecho ? "var(--f-texto)" : "var(--f-texto2)",
                      }}
                    >
                      {etiqueta}
                      {check.detalle ? ` · ${check.detalle}` : ""}
                    </span>
                  </span>
                  <span style={{ font: "500 11.5px/1 var(--f-mono)", color: colorOrigen(check), flex: "none" }}>
                    {check.origen || "—"}
                  </span>
                </button>
              );
            })}
          </div>

          <textarea
            className="f-area"
            style={{ marginTop: 14, minHeight: 70 }}
            placeholder="Nota del día: sensaciones, molestias, cuánto has dormido…"
            defaultValue={estadoElegido.nota}
            key={elegido}
            onBlur={(e) => guardarNota(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

const colorOrigen = (check) =>
  check.origen === "manual" ? "var(--f-aviso)" : check.hecho ? "var(--f-texto3)" : "var(--f-texto3)";

function TarjetaAdherencia({ etiqueta, datos }) {
  const pct = datos.porcentaje;
  const color = pct == null ? "var(--f-texto3)" : pct >= 85 ? "var(--f-ok)" : pct >= 60 ? "var(--f-aviso)" : "var(--f-alerta)";
  return (
    <div className="f-tarjeta" style={{ padding: "12px 13px" }}>
      <div className="f-etiqueta" style={{ fontSize: 9.5, letterSpacing: ".12em" }}>{etiqueta}</div>
      <div className="f-cifra" style={{ fontSize: 32, color, marginTop: 8 }}>
        {pct == null ? "—" : pct}
        {pct != null && <span style={{ fontSize: 16 }}>%</span>}
      </div>
      <div style={{ font: "400 11px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 4 }}>
        {datos.hechos} de {datos.planificados} checks
      </div>
    </div>
  );
}

function FilaSemana({ semana, lunes, estados, hoy, elegido, esActual, onElegir, alto = 26 }) {
  return (
    <>
      <span
        style={{
          font: `${esActual ? "600" : "500"} 10px/1 var(--f-mono)`,
          color: esActual ? "var(--f-acento)" : "var(--f-texto3)",
        }}
      >
        {semana}
      </span>
      {Array.from({ length: 7 }, (_, i) => {
        const iso = sumarDias(lunes, i);
        const estado = estados.get(iso);
        if (!estado) return <span key={iso} style={{ height: alto }} />;
        const tono = tonoDelDia(estado, hoy);
        return (
          <button
            key={iso}
            onClick={() => onElegir(iso)}
            aria-label={formatoDia(iso)}
            title={formatoDia(iso)}
            style={{
              height: alto,
              borderRadius: 5,
              background: fondoTono(tono),
              border: iso === elegido ? "2px solid var(--f-acento)" : iso === hoy ? "2px solid var(--f-texto3)" : "none",
            }}
          />
        );
      })}
    </>
  );
}

/** Color de una celda del mapa de calor. */
function fondoTono(tono) {
  if (tono === "completo") return "var(--f-heat-ok)";
  if (tono === "parcial") return "var(--f-heat-parcial)";
  if (tono === "libre") return "var(--f-heat-ok-tenue)";
  return "var(--f-heat-vacio)";
}

function Leyenda({ color, texto }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      {texto}
    </span>
  );
}
