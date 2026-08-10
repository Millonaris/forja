# FORJA

App personal de entrenamiento: gimnasio, carrera 0→20K, postura y nutrición.
PWA instalable, **100 % local**: sin servidor, sin cuenta, sin internet.
Todos los datos viven en el móvil (IndexedDB) y salen de ahí solo si tú los exportas.

---

## Instalarla en el Samsung Galaxy S24

La app vive publicada aquí:

**https://millonaris.github.io/forja/**

En el S24: abre ese enlace en **Chrome** → menú **⋮** → **Instalar aplicación**. Ábrela desde
el icono nuevo y ya no verás la barra del navegador: es una app. A partir de ahí funciona
**sin internet** y sin que el ordenador esté encendido.

Cada cambio que se sube a `main` se compila y se publica solo
(ver [`.github/workflows/publicar.yml`](.github/workflows/publicar.yml)); la versión nueva
llega al móvil la próxima vez que abres la app.

### Por qué no vale la wifi de casa

`npm run movil` sirve la app en una dirección del tipo `http://192.168.1.42:4173`. Chrome
**no** considera seguro un origen HTTP con IP de red local, así que ahí no registra el
service worker: no hay instalación real de PWA, no funciona sin conexión y **no salen los
avisos del descanso en segundo plano**. Sirve para echar un vistazo rápido al diseño desde
el móvil, nada más.

Todo lo que necesite service worker (instalar, offline, notificaciones) exige HTTPS, que es
justo lo que da GitHub Pages.

### Compilar a mano

```bash
npm run build      # deja todo listo en dist/
```

`base` está en `"./"`, así que funciona igual en la raíz del dominio o en una subcarpeta.

---

## Copia de seguridad

Los datos están **solo** en tu móvil. Si pierdes el teléfono o borras los datos de Chrome, se
van con él. Hazte una copia de vez en cuando:

**Exportar** · Ajustes → **EXPORTAR JSON**. Se descarga
`forja-copia-AAAA-MM-DD.json` con absolutamente todo: sesiones, series, carreras, peso,
calorías, postura, tests y fotos (las fotos van dentro del propio JSON). Mándatelo por correo
o guárdalo en Drive.

**Restaurar** · Ajustes → **IMPORTAR** → eliges el fichero. Reemplaza los datos actuales por
los de la copia. Sirve también para pasar la app a un móvil nuevo: instala, importa y sigues
donde lo dejaste.

Costumbre recomendada: exportar el primer domingo de cada mes, que además es cuando toca
recalcular el mantenimiento.

---

## Qué hace cada pantalla

| Pantalla | Para qué |
|---|---|
| **HOY** | Centro de mando: qué toca hoy, con el botón de empezar dentro. Postura y peso como estado de una palabra. |
| **GYM** | La rotación T-P-T-P, el historial y la entrada al entreno en vivo. |
| **Entreno en vivo** | Serie a serie, sin teclado. La marca anterior siempre al lado, descanso automático al guardar y pantalla que no se apaga. |
| **Progresión** | Veredicto por ejercicio (progresas / manteniendo / estancado) y semáforo de los 32 ejercicios. |
| **CARRERA** | Sesión del día, timer de intervalos a pantalla completa, historial con ritmos y el plan de 26 semanas. |
| **CUERPO** | Peso y kcal (con el mantenimiento deducido de tus datos) y la rutina postural guiada. |
| **DIARIO** | Mapa de calor de 26 semanas con checks automáticos y adherencia. |

---

## Las reglas que la app aplica sola

- **Rotación T-P-T-P continua** sobre L-X-V: la misma sesión no cae siempre el mismo día.
- **Doble progresión**: cuando llegas al tope del rango en todas las series, te dice que subas
  2,5 kg y vuelvas al extremo bajo. Si solo lo has llegado en algunas, te dice cuántas faltan.
- **La tirada larga nunca va detrás de un día de pierna**: si el viernes toca PIERNA, la larga
  se adelanta del sábado al jueves y la corta del jueves se va al sábado. Se calcula solo.
- **Mantenimiento real** deducido de tu peso y tus kcal, no de una fórmula genérica. Necesita
  10 días con ambos datos en al menos 2 semanas; hasta entonces te dice qué le falta.
- **Alertas de ritmo**: más de 0,5 kg/semana → sube 150 kcal. Tres semanas planas → baja 150.
- **Cobra prona** progresa sola con las semanas y el ejercicio de pelvis desaparece de la
  rutina postural pasadas las 4 primeras semanas.
- **Los checks del diario no se marcan a mano**: salen de lo que has registrado de verdad.

---

## Desarrollo

```bash
npm run dev        # servidor de desarrollo
npm run build      # compila a dist/ con service worker
npm run movil      # sirve dist/ accesible desde la wifi
npm run iconos     # regenera los iconos de la PWA
npm run lint
```

### Cómo está organizado

```
src/
  datos/        Esquema de la base (Dexie), catálogo de ejercicios,
                plan de carrera y rutina postural. Aquí se toca el PLAN.
  logica/       Cálculo puro, sin React: calendario, veredictos de progresión,
                nutrición, adherencia, fechas y formato español.
  ganchos/      Hooks: acceso a datos, temporizadores y wake lock.
  componentes/  Piezas compartidas: navegación, gráficas, diálogos, iconos.
  pantallas/    Una por pantalla de la app.
  estilos/      tokens.css (todo el color y la tipografía) y base.css.
```

**Para cambiar el plan** (ejercicios, series, rangos, semanas de carrera, rutina postural) solo
hay que tocar `src/datos/`. Lo demás se recalcula solo.

**Para cambiar el aspecto**, `src/estilos/tokens.css`. Cambiando ese bloque cambia la app
entera, incluido el tema claro.

### Notas de implementación

- Las fechas son siempre la cadena `"YYYY-MM-DD"` en hora local. Nunca `toISOString()`, que
  convierte a UTC y en España se come un día en horario de verano.
- Los temporizadores cuentan contra `Date.now()`, no sumando ticks: si no, un intervalo de 12
  minutos acaba durando 12:40 cuando el navegador frena el reloj en segundo plano.
- Las fuentes están autoalojadas (`@fontsource`). No se pueden pedir a Google Fonts porque la
  app tiene que funcionar sin conexión.
- El timer de carrera **no usa GPS**: los kilómetros se apuntan al terminar, precargados con
  los del plan. Medir distancia con el GPS del móvil es impreciso y se come la batería en una
  tirada larga.
