# Roadmap Realismo Mondo

## Obiettivo
Portare il gioco da prototipo tecnico a scena credibile: terreno, paesaggio, vegetazione, atmosfera e materiali coerenti con budget prestazionale controllato.

## Milestone R1 - Foundation Terreno
- [ ] Estrarre parametri mondo in `worldConfig` unico.
- [ ] Supportare seed runtime (`terrainSeed`) + random deterministico globale.
- [ ] Implementare `terrainProfile` (flat, hills, alpine, islands).
- [ ] Aggiungere sampling utility riusabile (`getHeightAt(x,z)` centralizzata).

## Milestone R2 - Biomi E Materiali
- [ ] Definire biomi minimi: `sand`, `grass`, `rock`, `snow`.
- [ ] Classificare bioma da quota + slope + umidita` sintetica.
- [ ] Implementare splat map/weight map per blend texture.
- [ ] Aggiungere texture set PBR per ogni bioma.
- [x] Introdurre triplanar mapping per rocce ripide.

## Milestone R3 - Erba
- [ ] Creare sistema `GrassSystem` con `InstancedMesh`.
- [ ] Spawn erba basato su bioma e slope filter.
- [ ] Aggiungere random coerente per scala/rotazione/tinta.
- [ ] Vento su erba via shader uniform `windTime`.
- [ ] Distanza massima erba + density falloff.
- [ ] Quality scalabile (`grassDensity`, `grassDistance`).

## Milestone R4 - Vegetazione E Props
- [x] Creare `ScatterSystem` per alberi, rocce, cespugli.
- [ ] Regole spawn per bioma (es. no alberi su neve o pendenza alta).
- [ ] Avoidance attorno al player spawn e percorsi principali.
- [ ] LOD su alberi/rocce con proxy low poly a distanza.
- [ ] Shadow policy per props (vicino on, lontano off).

## Milestone R5 - Atmosfera
- [x] Ribilanciare ciclo giorno/notte con curva colore fisicamente plausibile.
- [x] Aggiungere height fog + distance fog.
- [x] Color grading base (LUT o curve semplici).
- [x] Rifinire exposure/contrast per leggibilita` gameplay.
- [x] Parametri meteo base: `clear`, `hazy`, `sunset`.

## Milestone R6 - Ottimizzazione
- [ ] Benchmark baseline (`avg fps`, `1% low`, frame time p95).
- [ ] Frustum culling e distance culling aggressivo per istanze.
- [ ] Batch asset e texture compression.
- [ ] Preset qualita`: Low/Medium/High.
- [ ] Guardrail budget: no feature merge senza metrica.

## Milestone R7 - Tooling
- [ ] Debug panel mondo (`seed`, biomi, erba, fog, vento, luce).
- [ ] Pulsante `Regenerate World` live.
- [ ] Export/import preset mondo JSON.
- [ ] Overlay metriche (`fps`, draw calls, instances, memory stimata).
- [ ] Screenshot compare preset A/B.

## Milestone R8 - Mare
- [x] Aggiungere sistema mare con shader dedicato.
- [x] Introdurre onde multi-layer animate.
- [x] Aggiungere fresnel/specular/foam per resa realistica.
- [ ] Aggiungere shoreline foam guidata da profondita` reale.
- [ ] Integrare caustics fake su fondali bassi.

## Done Definition
- [ ] Spawn sempre corretto su terreno.
- [ ] Paesaggio percepito vario e credibile.
- [ ] Erba visibile e naturale senza cali pesanti.
- [ ] FPS stabili con quality preset medi su macchina target.
- [ ] Preset mondo salvabile e riproducibile.
