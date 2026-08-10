/*
 * FORJA · Copia de seguridad.
 *
 * Exporta TODO a un único fichero JSON: ajustes, sesiones, series, carreras,
 * postura, fotos y registros de peso. Las fotos van dentro como data URL en
 * base64 para que la copia sea un solo fichero que puedas mandarte por correo
 * o guardar en Drive; no hace falta nada más para restaurar la app entera.
 */

import { db } from "../datos/db.js";
import { sembrar } from "../datos/semilla.js";
import { hoyISO } from "../logica/fechas.js";

export const VERSION_COPIA = 1;

const TABLAS = [
  "settings",
  "gymSessions",
  "gymSets",
  "runs",
  "postureDays",
  "postureTests",
  "posturePhotos",
  "bodyLog",
  "diaryOverrides",
];

const blobADataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = reject;
    lector.readAsDataURL(blob);
  });

const dataUrlABlob = async (dataUrl) => (await fetch(dataUrl)).blob();

/** Construye el objeto de copia con todos los datos. */
export async function construirCopia() {
  const datos = {};
  for (const tabla of TABLAS) {
    datos[tabla] = await db[tabla].toArray();
  }

  // Las fotos son Blob y no sobreviven a JSON.stringify: se pasan a base64.
  datos.posturePhotos = await Promise.all(
    datos.posturePhotos.map(async (f) => ({
      ...f,
      imageBlob: f.imageBlob ? await blobADataUrl(f.imageBlob) : null,
    })),
  );

  return {
    app: "FORJA",
    version: VERSION_COPIA,
    exportado: new Date().toISOString(),
    datos,
  };
}

/**
 * Saca la copia del móvil.
 *
 * En Android lo bueno es compartirla (Drive, correo, WhatsApp): así sale del
 * dispositivo de verdad, que es de lo que protege una copia. Si el navegador
 * no sabe compartir ficheros, se cae a la descarga de toda la vida.
 *
 * Devuelve { bytes, via: "compartir" | "descarga" | "cancelado" }.
 */
export async function exportarJSON() {
  const copia = await construirCopia();
  const texto = JSON.stringify(copia, null, 2);
  const blob = new Blob([texto], { type: "application/json" });
  const nombre = `forja-copia-${hoyISO()}.json`;

  const fichero = new File([blob], nombre, { type: "application/json" });
  if (navigator.canShare?.({ files: [fichero] })) {
    try {
      await navigator.share({ files: [fichero], title: "Copia de FORJA" });
      return { bytes: blob.size, via: "compartir" };
    } catch (e) {
      // Cerrar el menú de compartir lanza AbortError: no es un fallo,
      // pero tampoco hay que dar la copia por hecha.
      if (e?.name === "AbortError") return { bytes: blob.size, via: "cancelado" };
      // Cualquier otro error: se intenta la descarga normal.
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Se libera el objeto un momento después para no cortar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  return { bytes: blob.size, via: "descarga" };
}

/**
 * Restaura una copia. Reemplaza TODO el contenido actual.
 * Devuelve un resumen de cuántas filas se han metido en cada tabla.
 */
export async function importarJSON(texto) {
  let copia;
  try {
    copia = JSON.parse(texto);
  } catch {
    throw new Error("El fichero no es un JSON válido.");
  }

  if (copia?.app !== "FORJA" || !copia.datos) {
    throw new Error("Ese fichero no es una copia de FORJA.");
  }
  if (copia.version > VERSION_COPIA) {
    throw new Error("La copia viene de una versión más nueva de la app.");
  }

  // Las fotos vuelven a ser Blob antes de guardarlas.
  const fotos = await Promise.all(
    (copia.datos.posturePhotos || []).map(async (f) => ({
      ...f,
      imageBlob: typeof f.imageBlob === "string" ? await dataUrlABlob(f.imageBlob) : f.imageBlob,
    })),
  );

  const resumen = {};
  await db.transaction("rw", TABLAS.map((t) => db[t]), async () => {
    for (const tabla of TABLAS) {
      const filas = tabla === "posturePhotos" ? fotos : copia.datos[tabla] || [];
      await db[tabla].clear();
      if (filas.length) await db[tabla].bulkPut(filas);
      resumen[tabla] = filas.length;
    }
  });

  // Por si la copia es antigua y le faltan ejercicios o ajustes nuevos.
  await sembrar();

  return resumen;
}

/** Días que pueden pasar sin copia antes de que la app insista. */
export const DIAS_ENTRE_COPIAS = 14;

/**
 * ¿Toca hacer copia? Devuelve { toca, dias } donde `dias` es null si no se ha
 * hecho ninguna nunca. Se usa para el aviso de HOY y el de Ajustes.
 */
export function copiaPendiente(ultimoBackup, hayDatos) {
  if (!hayDatos) return { toca: false, dias: null };
  if (!ultimoBackup) return { toca: true, dias: null };
  const dias = Math.floor((Date.now() - new Date(ultimoBackup).getTime()) / 86400000);
  return { toca: dias >= DIAS_ENTRE_COPIAS, dias };
}

/** Tamaño aproximado de la copia, para enseñarlo en Ajustes. */
export async function tamanoCopia() {
  const copia = await construirCopia();
  return new Blob([JSON.stringify(copia)]).size;
}

/** "1,4 MB" / "312 KB" */
export function formatearTamano(bytes) {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}
