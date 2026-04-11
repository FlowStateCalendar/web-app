/**
 * Static URLs for aquarium art copied from iOS Assets.xcassets → public/aquarium/.
 * `ShopCatalogItem.image` values match iOS image names.
 */

const A = "/aquarium";

/** Maps `ShopCatalogItem.image` to a path under public/aquarium/ */
export const SHOP_ITEM_IMAGE_URL: Record<string, string> = {
  FishOne: `${A}/fish/Fish1.png`,
  FishTwo: `${A}/fish/Fish2.png`,
  FishThree: `${A}/fish/Fish3.png`,
  FishFour: `${A}/fish/Fish4.png`,
  Seaweed: `${A}/accessories/Seaweed.png`,
  SandCastle: `${A}/accessories/Sandcastle.png`,
  Coral: `${A}/accessories/Coral.png`,
  SmallTank: `${A}/tanks/small-tank.png`,
  MediumTank: `${A}/tanks/medium-tank.png`,
  LargeTank: `${A}/tanks/large-tank.png`,
};

export function shopItemImageUrl(imageKey: string): string {
  return SHOP_ITEM_IMAGE_URL[imageKey] ?? "";
}

export const AQUARIUM_BACKGROUNDS = {
  fish: `${A}/backgrounds/fish-background.png`,
  login: `${A}/backgrounds/login-background.png`,
} as const;

export const BRAND = {
  logo: "/brand/Logo.png",
  logoNoBg: "/brand/LogoNoBg.png",
  logoTextDark: "/brand/LogoTextVertDark.png",
  logoTextLight: "/brand/LogoTextVertLight.png",
  appStore: "/brand/AppStoreLogo.png",
} as const;

/** iOS ProfileModal / profileIcon keys — order matches iOS grid */
export const PROFILE_AVATAR_KEYS = [
  "BlueFishLeft",
  "OrangeFish",
  "PinkFish",
  "TealFish",
  "RedFish",
  "BlueFishRight",
] as const;

export type ProfileAvatarKey = (typeof PROFILE_AVATAR_KEYS)[number];

export const DEFAULT_PROFILE_AVATAR_KEY: ProfileAvatarKey = "OrangeFish";

const PROFILE_AVATAR_IMAGE_URL: Record<ProfileAvatarKey, string> = {
  BlueFishLeft: `${A}/fish/BlueFishLeft.png`,
  OrangeFish: `${A}/fish/OrangeFish.png`,
  PinkFish: `${A}/fish/PinkFish.png`,
  TealFish: `${A}/fish/TealFish.png`,
  RedFish: `${A}/fish/RedFish.png`,
  BlueFishRight: `${A}/fish/BlueFishRight.png`,
};

export function normalizeProfileAvatarKey(
  profilePicture: string | null | undefined
): ProfileAvatarKey {
  if (
    profilePicture &&
    (PROFILE_AVATAR_KEYS as readonly string[]).includes(profilePicture)
  ) {
    return profilePicture as ProfileAvatarKey;
  }
  return DEFAULT_PROFILE_AVATAR_KEY;
}

/** Resolves DB `profile_picture` to a public image URL; unknown/null uses OrangeFish (iOS parity). */
export function profileAvatarUrl(profilePicture: string | null | undefined): string {
  return PROFILE_AVATAR_IMAGE_URL[normalizeProfileAvatarKey(profilePicture)];
}
