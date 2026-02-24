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

## Fase 7 - Terreno Realistico
- [x] Implementare noise multi-ottava e biomi base.
- [x] Introdurre blend materiali terrain per quota/pendenza.
- [x] Definire preset seed + parametri terreno.

Criterio di uscita:
- Terreno meno piatto/ripetitivo e leggibile a colpo d'occhio.

## Fase 8 - Erba E Vegetazione
- [x] Aggiungere erba instanziata con densita` scalabile.
- [x] Applicare LOD/culling per mantenere FPS stabili.
- [x] Introdurre vento e variazioni visive per naturalezza.

Criterio di uscita:
- Prati credibili senza regressione prestazioni evidente.

## Fase 9 - Paesaggio E Atmosfera
- [x] Scattering di alberi/rocce/props per bioma.
- [x] Migliorare cielo, nebbia e lighting ambientale.
- [x] Rifinire palette colore globale (look coerente).

Criterio di uscita:
- Scenario percepito come "mondo vivo" e non prototipo.

## Fase 10 - Performance E Tooling
- [ ] Profiling con metriche CPU/GPU e quality presets.
- [ ] Debug panel avanzato con tuning live.
- [ ] Preset export/import per iterazioni veloci.

Criterio di uscita:
- Pipeline stabile per iterare su qualita` visiva senza rompere gameplay.

## Fase 11 - Mare Realistico
- [x] Aggiungere `WaterSystem` con shader acqua custom.
- [x] Integrare onde animate e riflessi dipendenti dal sole.
- [x] Collegare parametri runtime mare in `controls`.

Criterio di uscita:
- Il mare risulta leggibile e dinamico senza rompere il gameplay su terreno.

