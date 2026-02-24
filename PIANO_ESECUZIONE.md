# Piano Di Esecuzione

## Fase 1 - Mettere in sicurezza il runtime
- [x] Fix GUI con `skeleton` opzionale.
- [x] Fix `test.js` (allineamento o eliminazione codice morto).
- [x] Guardie difensive su `actions` e `mixer` nel controller.

Criterio di uscita:
- Il gioco parte senza errori in console all'avvio.
- Input tastiera non provoca eccezioni durante il loading del modello.

## Fase 2 - Rendere robusta l'animazione
- [x] Sostituire `_scheduleFading` con API pubbliche.
- [x] Mappare animazioni per nome + fallback sicuri.
- [x] Unificare `settings` tra GUI e logica controller.

Criterio di uscita:
- Transizioni Idle/Walk/Run stabili e controllabili da GUI.

## Fase 3 - Rifinitura tecnica
- [x] Sistemare sole/cielo nel ciclo giorno-notte.
- [x] Aggiungere callback `onError` a `GLTFLoader.load`.
- [x] Pulizia import inutilizzati.
- [x] Aggiornare `index.html` e script npm.

Criterio di uscita:
- Nessun warning evitabile e struttura coerente con Vite.

## Fase 4 - Stabilizzare Spawn E Altezza (nuovo)
- [x] Introdurre funzione `initializeCharacterOnTerrain()` chiamata dopo caricamento model + terreno pronti.
- [x] Allineare stato iniziale (`group`, `controls.position`, `followGroup`, `orbit target`) in un unico punto.
- [x] Calcolare offset verticale da modello (bbox) invece di valore fisso.
- [x] Garantire raycast valido allo spawn usando quota di lancio alta e fallback sicuro.

Criterio di uscita:
- Player non nasce dentro il terreno.
- Player non "salta" in quota al primo input.

## Fase 5 - Stabilizzare Camera (nuovo)
- [x] Rimuovere hardcode `cameraY = terrain + 2`.
- [x] Usare distanza camera relativa al personaggio e smoothing separato da quello del player.
- [x] Verificare comportamento su salite/discese senza effetto volo.

Criterio di uscita:
- Camera stabile e coerente durante movimento e stop.

## Regola di lavoro
Per ogni task completato:
1. Patch minima.
2. Verifica rapida comportamento.
3. Commit logico (se richiesto).

## Fase 6 - Robustezza E Debug (nuovo)
- [x] Aggiungere overlay debug toggle per quote runtime.
- [x] Aggiungere smoke test spawn eseguibile da npm script.
- [x] Rendere terreno deterministico via seed configurabile.

Criterio di uscita:
- I bug di spawn sono riproducibili e osservabili con telemetria locale.

