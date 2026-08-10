/*
 * FORJA · Fotos de perfil.
 *
 * Las fotos se comprimen antes de guardarlas: una foto del S24 son 4-6 MB y
 * 26 semanas de fotos llenarían el almacenamiento del navegador y harían la
 * copia de seguridad inmanejable. A 900 px de lado largo y JPEG 0,72 se ven
 * perfectamente para comparar postura y ocupan unos 80-120 KB.
 */

const LADO_MAX = 900;
const CALIDAD = 0.72;

/** Comprime un File de imagen y devuelve un Blob JPEG. */
export async function comprimirImagen(file) {
  const bitmap = await createImageBitmap(file);

  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  lienzo.getContext("2d").drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close?.();

  const blob = await new Promise((resolve) => lienzo.toBlob(resolve, "image/jpeg", CALIDAD));
  // Si el navegador no puede convertir, se guarda el original antes que perder la foto.
  return blob || file;
}

/**
 * URL temporal para pintar un Blob en un <img>.
 * Hay que revocarla al desmontar o se acumulan en memoria.
 */
export function urlDeBlob(blob) {
  return blob ? URL.createObjectURL(blob) : null;
}
