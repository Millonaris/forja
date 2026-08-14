# FORJA — contexto para Claude

## Qué es esto

App personal de entrenamiento de Jose (un solo usuario): gimnasio, plan de carrera
0→20K en 26 semanas, postura y peso diario. **De dieta, nada**: las kcal y macros
las lleva en Fitia, fuera de esta app. PWA instalable, 100 % local: sin
servidor, sin cuentas; todos los datos viven en el móvil (IndexedDB con Dexie).
React + Vite. Se publica en GitHub Pages: https://millonaris.github.io/forja/

## Sobre Jose (importante)

**Jose no programa.** Decide tú por él las cuestiones técnicas y explícale las
cosas en lenguaje de usuario, sin jerga: qué verá en pantalla y qué cambia para
él, no qué funciones tocaste. Responde siempre en español.

## Convenciones del código

- Todo en español: nombres de ficheros, variables, funciones y comentarios.
- Los comentarios explican el PORQUÉ de las decisiones, no el qué.
- Sin tests automáticos. Verificar con `npx oxlint src`, `npx vite build`
  y probando la app en el navegador (`npm run dev`, la app usa rutas con
  almohadilla: `/#/carrera`, `/#/ajustes`…).
- La base de datos se siembra en cada arranque de forma idempotente
  ([semilla.js](src/datos/semilla.js)): ejercicios nuevos aparecen solos, y los
  ajustes nuevos toman su valor por defecto sin pisar los existentes.
  **No cambiar ids de ejercicios ya existentes**: los registros del móvil de
  Jose apuntan a esos ids.

## Mapa del código

- `src/datos/` — catálogos y semilla: ejercicios del gym, músculos,
  **planCarrera.js** (el plan 0→20K con sus fechas reales), base de datos.
- `src/logica/` — motores puros sin interfaz: **calendario.js** (qué toca cada
  día: gym por rotación desde la fecha de inicio + carrera por las fechas del
  plan + postura), diario, veredictos, volumen.
- `src/pantallas/` — una por pestaña: Hoy, Gym, Carrera, Cuerpo, Diario,
  más Ajustes, EntrenoVivo…
- `docs/plan-carrera.md` — el plan de carrera del entrenador, palabra por
  palabra. Es la fuente de verdad del plan; el código lo implementa.

## El plan de carrera (resumen operativo)

- Plan FINAL con fechas reales: empieza el vie 14-ago-2026, 20K el sáb
  13-feb-2027. Todo en Z2 («hablar sin ahogarse», correr ≤125 ppm).
- Fase 1 (S1-S8): intervalos corre/camina, VIERNES y LUNES (la semana del
  plan va de viernes a jueves). Fases 2-3 (S9-S26): cortas martes y jueves +
  larga el sábado (semana de martes a lunes). Entre fases, transición sin
  carreras (6-12 oct). Descargas S12, S16, S20 y S24; larga máxima 18 km
  (S25); la S26 solo tiene un rodaje suave el martes y el 20K.
- **Los entrenos los hace con su reloj Garmin** (llevan los mismos nombres:
  `S3 - 5x 3c 2a`): la app NO tiene temporizador de carrera, solo se marcan
  las sesiones como hechas (DialogoCarrera precargado con lo del plan).
- El usuario puede recolocar el plan («Semana de carrera» en Ajustes →
  `desfaseCarrera`: repetir una semana desplaza TODO el plan de correr 7 días,
  nunca el gym) y hacer un día cualquiera la sesión de otra semana tocando la
  rejilla de la pantalla Carrera.

## Comandos

- `npm run dev` — servidor de desarrollo.
- `npm run publicar` — compila y sube a la rama `gh-pages`; así llega la
  versión nueva al móvil de Jose. **Solo publicar cuando Jose lo pida.**
- `npm run iconos` — regenera los iconos de la PWA.
