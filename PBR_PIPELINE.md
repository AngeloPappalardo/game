# Pipeline Asset PBR

## Obiettivo
Standardizzare naming, import e compressione texture/materiali per evitare inconsistenze visive e regressioni performance.

## Naming
- Modello: `assetName_variant_lodX.glb` (esempio: `rock_round_lod0.glb`).
- Materiale: `mat_assetName_surfaceType`.
- Texture: `assetName_surfaceType_mapType_2k.ext`.
- `mapType` ammessi: `albedo`, `normal`, `roughness`, `ao`, `metallic`, `height`.

## Spazio colore
- `albedo`: sRGB.
- `normal`, `roughness`, `ao`, `metallic`, `height`: Linear.

## Risoluzioni
- Hero asset vicino camera: 2k.
- Asset medi: 1k.
- Asset lontani/foliage: 512.

## Compressione
- Preferire `KTX2` per texture finali runtime.
- Normal map: compressione con priorita` qualita`.
- Roughness/AO/Metallic: packing in canali separati della stessa texture quando possibile.

## LOD
- Ogni asset statico rilevante deve avere almeno `lod0`, `lod1`, `lod2`.
- Riduzione triangoli target:
  - `lod1`: ~50% di `lod0`
  - `lod2`: ~20-25% di `lod0`

## Check pre-merge
- Verificare orientamento normale corretto (niente inverted normals).
- Verificare scala consistente (1 unita` = 1 metro).
- Verificare draw call e memoria texture nel build profile.
