import { getCollection, type CollectionEntry } from 'astro:content';

type Tree = CollectionEntry<'trees'>;

export interface TreeStats {
  totalTrees: number;
  totalSpecies: number;
  totalRecycled: number;
  co2ProjectedKg: number;
  areaM2: number;
}

// CO₂ estimado anual (kg) por categoría según literatura forestal tropical
// Valores conservadores para árboles jóvenes (<5 años) en Colombia
const CO2_BY_CATEGORY: Record<string, number> = {
  nativo: 12,
  frutal: 8,
  maderable: 15,
  ornamental: 6,
};

export async function getTreeStats(): Promise<TreeStats> {
  const trees = await getCollection('trees', (t: Tree) => !t.data.draft);

  const speciesSet = new Set(trees.map((t: Tree) => (t.data.scientificName ?? t.data.species).toLowerCase()));
  const totalRecycled = trees.filter(
    (t: Tree) => t.data.protector === 'llanta-bicicleta' || t.data.protector === 'llanta-moto'
  ).length;

  // CO₂ proyectado: suma del co2EstimateKg propio si existe, o fallback por categoría
  const co2ProjectedKg = trees.reduce((sum: number, t: Tree) => {
    const co2 = t.data.co2EstimateKg ?? CO2_BY_CATEGORY[t.data.category] ?? 10;
    return sum + co2;
  }, 0);

  // Área: estimado por protector (llanta bici ~0.5m², llanta moto ~0.8m², otro ~1m²)
  const areaM2 = trees.reduce((sum: number, t: Tree) => {
    const area =
      t.data.protector === 'llanta-bicicleta'
        ? 0.5
        : t.data.protector === 'llanta-moto'
          ? 0.8
          : 1.0;
    return sum + area;
  }, 0);

  return {
    totalTrees: trees.length,
    totalSpecies: speciesSet.size,
    totalRecycled,
    co2ProjectedKg: Math.round(co2ProjectedKg),
    areaM2: Math.round(areaM2 * 10) / 10,
  };
}
