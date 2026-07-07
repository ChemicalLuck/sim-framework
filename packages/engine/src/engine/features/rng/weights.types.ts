export type Weights<K extends string | number> = Record<K, number>;
export type WeightsMap<
  G extends string | number,
  K extends string | number,
> = Record<G, Partial<Weights<K>>>;
