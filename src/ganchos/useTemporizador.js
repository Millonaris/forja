/*
 * FORJA · Temporizadores.
 *
 * Todos los relojes de la app cuentan contra Date.now() y no sumando ticks.
 * Es la diferencia entre que un intervalo de 12 minutos sea de 12 minutos o
 * de 12:40 porque el navegador ha ido frenando el temporizador en segundo plano.
 *
 * El tiempo restante vive en una ref además de en el estado: `arrancar` se
 * llama desde efectos que se disparan justo después de cambiar de bloque, y
 * con solo estado leería el valor viejo y arrancaría un reloj ya agotado
 * (que es exactamente lo que hacía saltar dos bloques de golpe).
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cuenta atrás de `segundos`.
 *
 * @param segundos      duración total del bloque
 * @param alTerminar    se llama UNA vez al llegar a 0
 * @param autoArranque  si empieza a correr solo al montar / al cambiar de bloque
 */
export function useCuentaAtras(segundos, alTerminar, autoArranque = false) {
  const [restante, setRestanteEstado] = useState(segundos);
  const [corriendo, setCorriendo] = useState(autoArranque);

  const restanteRef = useRef(segundos); // fuente de verdad para arrancar/pausar
  const finRef = useRef(null); // instante (ms) en el que el bloque termina
  const terminadoRef = useRef(false); // evita disparar alTerminar dos veces
  const alTerminarRef = useRef(alTerminar);
  alTerminarRef.current = alTerminar;

  // Escribe estado y ref a la vez: nunca deben desincronizarse.
  const setRestante = useCallback((valor) => {
    restanteRef.current = valor;
    setRestanteEstado(valor);
  }, []);

  // Cambiar la duración = bloque nuevo: se reinicia el reloj.
  useEffect(() => {
    terminadoRef.current = false;
    setRestante(segundos);
    finRef.current = autoArranque ? Date.now() + segundos * 1000 : null;
    setCorriendo(autoArranque);
  }, [segundos, autoArranque, setRestante]);

  useEffect(() => {
    if (!corriendo) return undefined;
    if (finRef.current == null) finRef.current = Date.now() + restanteRef.current * 1000;

    // 100 ms basta para que el segundo cambie a tiempo sin gastar batería.
    const id = setInterval(() => {
      const queda = Math.max(0, (finRef.current - Date.now()) / 1000);
      setRestante(queda);
      if (queda <= 0 && !terminadoRef.current) {
        terminadoRef.current = true;
        setCorriendo(false);
        alTerminarRef.current?.();
      }
    }, 100);

    return () => clearInterval(id);
  }, [corriendo, setRestante]);

  const arrancar = useCallback(() => {
    // Si el bloque ya está agotado no se rearranca: sería un bucle infinito.
    if (restanteRef.current <= 0) return;
    terminadoRef.current = false;
    finRef.current = Date.now() + restanteRef.current * 1000;
    setCorriendo(true);
  }, []);

  const pausar = useCallback(() => {
    finRef.current = null;
    setCorriendo(false);
  }, []);

  const reiniciar = useCallback(
    (nuevos = segundos) => {
      terminadoRef.current = false;
      finRef.current = null;
      setRestante(nuevos);
      setCorriendo(false);
    },
    [segundos, setRestante],
  );

  /** Termina el bloque ya, disparando alTerminar una sola vez. */
  const saltar = useCallback(() => {
    if (terminadoRef.current) return;
    terminadoRef.current = true;
    finRef.current = null;
    setRestante(0);
    setCorriendo(false);
    alTerminarRef.current?.();
  }, [setRestante]);

  return { restante, corriendo, arrancar, pausar, reiniciar, saltar };
}

/**
 * Cronómetro ascendente: tiempo total de la sesión de gimnasio y de la carrera.
 * Devuelve segundos transcurridos.
 */
export function useCronometro(autoArranque = true) {
  const [segundos, setSegundos] = useState(0);
  const [corriendo, setCorriendo] = useState(autoArranque);
  const inicioRef = useRef(autoArranque ? Date.now() : null);
  const acumuladoRef = useRef(0);

  useEffect(() => {
    if (!corriendo) return undefined;
    if (inicioRef.current == null) inicioRef.current = Date.now();
    const id = setInterval(() => {
      setSegundos(acumuladoRef.current + (Date.now() - inicioRef.current) / 1000);
    }, 250);
    return () => clearInterval(id);
  }, [corriendo]);

  const pausar = useCallback(() => {
    if (inicioRef.current != null) {
      acumuladoRef.current += (Date.now() - inicioRef.current) / 1000;
      inicioRef.current = null;
    }
    setCorriendo(false);
  }, []);

  const reanudar = useCallback(() => {
    inicioRef.current = Date.now();
    setCorriendo(true);
  }, []);

  return { segundos, corriendo, pausar, reanudar };
}
