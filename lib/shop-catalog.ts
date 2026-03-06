/**
 * Shop catalog for the web app UI. itemKey values must match supabase/functions/shop-purchase/catalog.ts
 */

export type ShopItemType = "fish" | "accessory" | "tank";

export interface ShopCatalogItem {
  itemKey: string;
  name: string;
  description: string;
  price: number;
  type: ShopItemType;
  image: string;
}

export const SHOP_CATALOG: ShopCatalogItem[] = [
  { itemKey: "tropical_fish", name: "Tropical Fish", description: "Colorful tropical fish", price: 50, type: "fish", image: "FishOne" },
  { itemKey: "blue_tang", name: "Blue Tang", description: "Beautiful blue marine fish", price: 75, type: "fish", image: "FishTwo" },
  { itemKey: "clownfish", name: "Clownfish", description: "Friendly orange clownfish", price: 60, type: "fish", image: "FishThree" },
  { itemKey: "angelfish", name: "Angelfish", description: "Elegant silver angelfish", price: 80, type: "fish", image: "FishFour" },
  { itemKey: "seaweed", name: "Seaweed Plant", description: "Natural seaweed decoration", price: 30, type: "accessory", image: "Seaweed" },
  { itemKey: "rock_cave", name: "Rock Cave", description: "Rock cave for fish to hide", price: 40, type: "accessory", image: "SandCastle" },
  { itemKey: "coral", name: "Coral", description: "Beautiful coral decoration", price: 35, type: "accessory", image: "Coral" },
  { itemKey: "bubble_stone", name: "Bubble Stone", description: "Creates bubbles in the tank", price: 25, type: "accessory", image: "Coral" },
  { itemKey: "small_tank", name: "Small Tank", description: "Perfect for beginners", price: 100, type: "tank", image: "SmallTank" },
  { itemKey: "medium_tank", name: "Medium Tank", description: "Great for growing collections", price: 200, type: "tank", image: "MediumTank" },
  { itemKey: "large_tank", name: "Large Tank", description: "Premium tank for experts", price: 350, type: "tank", image: "LargeTank" },
];

export const SHOP_CATEGORIES: { value: ShopItemType; label: string }[] = [
  { value: "fish", label: "Fish" },
  { value: "accessory", label: "Accessories" },
  { value: "tank", label: "Tanks" },
];
