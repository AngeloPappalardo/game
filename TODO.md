# Lavori Da Fare

## P0 - Blocchi Critici (crash / rotture immediate)
- [x] Fix `createPanel` quando `skeleton` e` `null` (evitare `skeleton.visible` su null).
- [x] Sistemare `test.js`: aggiornare import ai moduli reali oppure rimuoverlo se obsoleto.
- [x] Aggiungere guardie in `updateCharacter` quando `actions`/`mixer` non sono pronti.

## P1 - Stabilita` Gameplay
- [x] Eliminare uso di API privata Three.js `_scheduleFading`.
- [x] Rimuovere clip animation hardcoded per indice (`animations[2]`, `[6]`, `[3]`) e mappare per nome con fallback.
- [x] Collegare il toggle GUI `fixe_transition` al vero `settings` condiviso.

## P2 - Qualita` Rendering / Logica
- [x] Aggiornare colore/intensita` del sole dentro `updateSun` nel ciclo giorno/notte.
- [x] Gestire errori nel caricamento GLTF (`onError` + messaggio utile).
- [x] Verificare logica camera Y su terreno per evitare scatti verticali bruschi.

## P3 - Pulizia Progetto
- [x] Rimuovere import/parametri inutilizzati (`RGBELoader`, `GUI` non usata, parametri non usati).
- [x] Sistemare `index.html`: rimuovere/rendere coerente importmap con Vite.
- [x] Gestire riferimento a `main.css` (crearlo o rimuovere link).
- [x] Aggiungere script `build` e script test/lint minimi in `package.json`.

## P4 - Bug Gameplay Critici (nuovo)
- [x] Correggere spawn iniziale: inizializzare `group.position`, `controls.position`, `followGroup` e camera con un unico punto coerente.
- [x] Eseguire snap al terreno al bootstrap (prima input utente), senza dipendere dal primo movimento.
- [x] Evitare raycast fallito allo spawn: usare origine ray sopra il massimo rilievo del terreno (non `group.y + 5`).
- [x] Eliminare teletrasporto verticale iniziale: rimuovere `controls.position.y = 20` hardcoded.
- [x] Calibrare offset piede/personaggio sul terreno usando bounding box del modello (niente `heightOffset` fisso).

## P5 - Camera E Movimento (nuovo)
- [x] Sostituire `camera.position.y = terrain + 2` con logica camera relativa al personaggio + smoothing dedicato.
- [x] Separare responsabilita`: il controller del personaggio non deve forzare direttamente tutta la posa camera ogni frame.
- [x] Ridurre pop quando il terreno si ricentra: sostituire shift brusco `floor.position += dx/dz` con streaming/chunk o blending.
- [x] Rivedere velocita` e damping verticali per evitare effetto "volo" su pendii ripidi.

## P6 - Robustezza E Debug (nuovo)
- [x] Aggiungere debug toggle per mostrare: altezza terreno, y player, y camera, offset applicato.
- [x] Aggiungere test/smoke script di spawn: verifica automatica che il player non parta sotto/sopra soglia.
- [x] Introdurre seed deterministico del terreno per riprodurre bug di spawn sempre nello stesso punto.

## Note operative
- Procedere in ordine P0 -> P1 -> P2 -> P3.
- Dopo ogni blocco: test manuale avvio (`npm run dev`) e smoke test movimento personaggio.
