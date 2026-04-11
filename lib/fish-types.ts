/** Fish object shape stored in `aquariums.fish` JSON (aligned with shop-purchase). */
export type AquariumFishItem = {
  id?: string;
  name: string;
  customName?: string | null;
  image?: string;
  health?: number;
  happiness?: number;
};
