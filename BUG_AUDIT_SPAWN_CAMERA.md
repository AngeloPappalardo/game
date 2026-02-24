# Bug Audit Spawn/Camera (2026-02-24)

## Findings critici

1. Spawn incoerente tra stato logico e stato scena
- `controls.position` parte a `(0, 20, 0)` mentre `group.position` nasce a `(0, 0, 0)`.
- Finche` il player e` `Idle`, `group.position` non viene sincronizzato con `controls.position`.
- Impatto: posizione iniziale incoerente; primo movimento provoca salto/correzione brusca.

2. Raycast terreno fragile allo spawn
- Ray origin usa `group.position.y + 5`.
- Se il terreno sotto lo spawn e` piu` alto di quell'origine, il raycast verso il basso non intercetta nulla.
- Impatto: player puo` iniziare dentro la montagna e non correggersi finche` non cambia quota.

3. Offset verticale hardcoded
- Altezza player usa `heightOffset = 1.0` costante.
- Il pivot del modello non e` garantito al livello piedi.
- Impatto: su alcuni modelli il personaggio sembra fluttuare o affondare.

4. Camera forzata da terreno
- La camera viene impostata a `terrainY + 2` nel controller del personaggio.
- Questo confligge con una camera orbit/follow e crea percezione di "volo".
- Impatto: distanza e quota camera poco naturali e variabili.

5. Ricentraggio terreno con salto
- Il terreno viene traslato a scatti quando superata soglia `floorDecale`.
- Impatto: possibili pop visivi e variazioni brusche nella stima altezza.

## Priorita` fix

## P0
- Init spawn deterministico su terreno (snap iniziale prima input).
- Stato unico iniziale: `group.position == controls.position`.
- Raycast bootstrap con quota alta/fallback.

## P1
- Calcolo offset piedi da bounding box modello.
- Separazione logica camera da logica altezza player.

## P2
- Migliorare ricentraggio terreno (streaming/chunk o transizione smussata).
- Aggiungere overlay debug quote player/terreno/camera.
