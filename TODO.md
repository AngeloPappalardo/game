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

## P7 - Terreno Realistico
- [x] Aumentare dettaglio del terreno con noise multi-ottava (fBm) e controllo frequenze.
- [x] Introdurre maschere bioma (spiaggia, prato, roccia, neve) in base a quota e pendenza.
- [x] Generare mappe splat/weight per blend materiali multi-texture.
- [x] Aggiungere normal map e roughness map differenziate per bioma.
- [x] Aggiungere macro-variazioni (colline grandi) + micro-dettaglio (erosione locale).
- [x] Introdurre seed + preset terreno salvabili/caricabili.

## P8 - Erba E Vegetazione
- [x] Implementare sistema erba instanziata (`InstancedMesh`) con LOD e culling distanza.
- [x] Distribuire erba solo in aree valide (bioma prato, pendenza sotto soglia).
- [x] Aggiungere variazioni per ciuffi (scala, rotazione, colore, densita`).
- [x] Aggiungere animazione vento per erba (shader o offset per istanza).
- [x] Introdurre vegetazione secondaria: cespugli, fiori, piccoli sassi.
- [x] Aggiungere collision policy per vegetazione (visual only o fisica semplificata).

## P9 - Paesaggio E Atmosfera
- [x] Aggiungere elementi di sfondo (montagne distant, skyline, horizon fog).
- [x] Inserire rocce/alberi modulari con scattering procedurale per bioma.
- [x] Migliorare cielo con transizioni colore alba/tramonto/notte piu` naturali.
- [x] Aggiungere nebbia atmosferica coerente con ora del giorno e distanza.
- [x] Aggiungere ombre e luce globale con calibrazione realistica (intensita`, color temperature).
- [x] Integrare effetti ambientali opzionali: particelle polvere, insetti, volumetric light fake.

## P10 - Materiali E Shader
- [x] Introdurre shader terrain blend (albedo/normal/roughness per layer).
- [x] Aggiungere triplanar mapping per evitare stretching su pendenze alte.
- [x] Aggiungere color grading base e regolazioni esposizione automatiche soft.
- [x] Implementare SSAO/light contact fake leggero per profondita` percepita.
- [x] Preparare pipeline asset PBR (naming, compressione texture, atlasing).

## P11 - Performance E Scalabilita`
- [ ] Profilare frame time (CPU/GPU) e identificare colli di bottiglia.
- [ ] Aggiungere LOD per terreno/vegetazione/oggetti paesaggio.
- [ ] Implementare culling frustum e distance culling per istanze.
- [ ] Introdurre quality presets (Low/Medium/High/Ultra) con parametri runtime.
- [ ] Ridurre draw call con batching/instancing dove possibile.
- [ ] Definire budget target: FPS minimi desktop e laptop.

## P12 - Tooling Creativo
- [ ] Aggiungere pannello debug per tuning live: seed, densita` erba, vento, fog, biomi.
- [ ] Aggiungere export/import preset mondo (`worldPreset.json`).
- [ ] Aggiungere comando rigenerazione mondo da seed senza reload pagina.
- [ ] Aggiungere screenshot benchmark mode per confronto preset visivi.
- [ ] Documentare workflow artistico-tecnico (come creare nuovi biomi/asset).

## P13 - Mare Realistico
- [x] Integrare sistema mare (`WaterSystem`) con mesh dedicata e shader custom.
- [x] Aggiungere onde dinamiche multi-frequenza animate a runtime.
- [x] Aggiungere shading realistico acqua (fresnel, specular, foam in cresta).
- [x] Collegare il sole al mare per riflessi direzionali coerenti.
- [x] Esporre parametri base mare (`waterLevel`, ampiezza, velocita`, scala, opacita`).

## Note operative
- Procedere in ordine P0 -> P1 -> P2 -> P3.
- Dopo ogni blocco: test manuale avvio (`npm run dev`) e smoke test movimento personaggio.
