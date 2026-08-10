/*
 * FORJA · Registrar carrera.
 *
 * Se abre precargado con lo que tocaba ese día según el plan, así que en el
 * caso normal (has hecho lo previsto) es abrir y guardar. Los km van de 100 en
 * 100 m y los minutos de uno en uno.
 */

import { useState } from "react";

import { db } from "../datos/db.js";
import { formatoDia } from "../logica/fechas.js";
import { num, ritmo } from "../logica/formato.js";
import { senalGuardado } from "../utiles/senales.js";

export default function DialogoCarrera({ fecha, semana, plan, existente = null, onCerrar }) {
  const [km, setKm] = useState(existente?.km ?? plan?.km ?? 4);
  const [minutos, setMinutos] = useState(existente?.minutes ?? plan?.minutos ?? 30);
  const [notas, setNotas] = useState(existente?.notes ?? "");

  const tipo = existente?.type ?? plan?.tipo ?? "corta";

  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    const fila = {
      date: fecha,
      type: tipo,
      km: Math.round(km * 10) / 10,
      minutes: Math.round(minutos),
      notes: notas.trim(),
      weekNum: semana,
    };
    // Sin transacción, tocar dos veces GUARDAR metía dos carreras el mismo día
    // y la rejilla del plan contaba el doble de sesiones.
    await db.transaction("rw", db.runs, async () => {
      if (existente?.id) {
        await db.runs.update(existente.id, fila);
        return;
      }
      const ya = await db.runs.where("date").equals(fecha).first();
      if (ya) await db.runs.update(ya.id, fila);
      else await db.runs.add(fila);
    });
    senalGuardado();
    onCerrar();
  };

  return (
    <div
      role="dialog"
      aria-label="Registrar carrera"
      onClick={onCerrar}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,.72)",
        display: "flex",
        alignItems: "flex-end",
        animation: "f-entra .15s ease-out",
      }}
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
          gap: 16,
        }}
      >
        <div className="f-fila-sb">
          <div>
            <div className="f-etiqueta">REGISTRAR CARRERA</div>
            <div style={{ font: "400 12px/1.3 var(--f-ui)", color: "var(--f-texto3)", marginTop: 5 }}>
              {formatoDia(fecha)} · {tipo}
            </div>
          </div>
          <button onClick={onCerrar} style={{ font: "500 12px/1 var(--f-mono)", color: "var(--f-texto3)", padding: 10, margin: -10 }}>
            CERRAR
          </button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Contador etiqueta="KM" valor={num(km, 1)} onMenos={() => setKm((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10))} onMas={() => setKm((v) => Math.round((v + 0.1) * 10) / 10)} destacado />
          <Contador etiqueta="MINUTOS" valor={Math.round(minutos)} onMenos={() => setMinutos((v) => Math.max(1, v - 1))} onMas={() => setMinutos((v) => v + 1)} />
        </div>

        <div className="f-tarjeta" style={{ padding: "12px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="f-etiqueta">RITMO MEDIO</span>
          <span className="f-cifra f-acento" style={{ fontSize: 28 }}>
            {ritmo(km, minutos)} <span style={{ fontSize: 13, color: "var(--f-texto2)" }}>/km</span>
          </span>
        </div>

        <textarea
          className="f-area"
          placeholder="Cómo ha ido (opcional): sensaciones, molestias, calor…"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />

        <button className="f-boton" onClick={guardar} disabled={guardando}>
          GUARDAR CARRERA
        </button>
      </div>
    </div>
  );
}

function Contador({ etiqueta, valor, onMenos, onMas, destacado }) {
  return (
    <div className={`f-tarjeta ${destacado ? "f-tarjeta--destacada" : ""}`} style={{ flex: 1, minWidth: 0, padding: "12px 10px 14px", textAlign: "center", borderRadius: 18 }}>
      <div className="f-etiqueta" style={{ color: destacado ? "var(--f-acento)" : undefined }}>{etiqueta}</div>
      <div className="f-cifra" style={{ fontSize: 46, margin: "8px 0 10px" }}>{valor}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onMenos} aria-label={`Bajar ${etiqueta}`} style={{ flex: 1, height: 48, borderRadius: 12, background: "var(--f-sup2)", border: "1px solid var(--f-borde2)", font: "700 22px/1 var(--f-display)" }}>−</button>
        <button onClick={onMas} aria-label={`Subir ${etiqueta}`} style={{ flex: 1, height: 48, borderRadius: 12, background: "var(--f-sup2)", border: "1px solid var(--f-borde2)", font: "700 22px/1 var(--f-display)" }}>+</button>
      </div>
    </div>
  );
}
