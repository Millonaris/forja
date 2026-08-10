/*
 * FORJA · Iconografía.
 *
 * Set geométrico de trazo 2 px sobre caja de 24 px, tal cual el sistema de
 * diseño: formas puras, nada de ilustración. En el gimnasio se lee la silueta,
 * no el detalle, así que cada icono tiene que distinguirse de lejos y de reojo.
 *
 * Están hechos con divs y bordes (no SVG) para que hereden el color con
 * currentColor y pesen cero.
 */

const base = { flex: "none", boxSizing: "border-box" };

/** HOY · círculo lleno cuando está activo, solo borde cuando no. */
export function IconoHoy({ activo }) {
  return (
    <span
      style={{
        ...base,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: activo ? "currentColor" : "transparent",
        border: activo ? "none" : "2px solid currentColor",
      }}
    />
  );
}

/** GYM · tres barras ascendentes, como una serie que progresa. */
export function IconoGym() {
  return (
    <span style={{ ...base, display: "flex", alignItems: "flex-end", gap: 3, height: 22 }}>
      <span style={{ width: 5, height: 11, background: "currentColor" }} />
      <span style={{ width: 5, height: 16, background: "currentColor" }} />
      <span style={{ width: 5, height: 22, background: "currentColor" }} />
    </span>
  );
}

/** CARRERA · rombo (cuadrado girado 45°), la forma que más destaca de lejos. */
export function IconoCarrera() {
  return (
    <span
      style={{
        ...base,
        width: 20,
        height: 20,
        border: "2px solid currentColor",
        borderRadius: 4,
        transform: "rotate(45deg)",
      }}
    />
  );
}

/** CUERPO · cuadrado redondeado. */
export function IconoCuerpo() {
  return <span style={{ ...base, width: 22, height: 22, border: "2px solid currentColor", borderRadius: 6 }} />;
}

/** DIARIO · círculo discontinuo: los días que se van rellenando. */
export function IconoDiario() {
  return <span style={{ ...base, width: 22, height: 22, border: "2px dashed currentColor", borderRadius: "50%" }} />;
}

/** Marca de verificación sobre disco, para checks completados. */
export function Check({ tam = 22, color = "var(--f-ok)", tinta = "var(--f-ok-tinta)" }) {
  return (
    <span
      style={{
        ...base,
        width: tam,
        height: tam,
        borderRadius: "50%",
        background: color,
        color: tinta,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        font: `700 ${Math.round(tam * 0.6)}px/1 var(--f-ui)`,
      }}
    >
      ✓
    </span>
  );
}

/** Círculo vacío: pendiente. */
export function Pendiente({ tam = 22, color = "var(--f-borde2)" }) {
  return <span style={{ ...base, width: tam, height: tam, borderRadius: "50%", border: `2px solid ${color}` }} />;
}

/** Flecha de "entrar aquí" en las filas de lista. */
export function Chevron({ color = "var(--f-texto3)" }) {
  return <span style={{ color, font: "600 16px/1 var(--f-ui)" }}>›</span>;
}
