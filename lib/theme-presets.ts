/**
 * App shell background presets (stored as `user_settings.background_color` hex).
 */

export type BackgroundPreset = {
  value: string;
  label: string;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { value: "#2d2d2d", label: "Dark grey" },
  { value: "#1e293b", label: "Slate" },
  { value: "#0f172a", label: "Deep navy" },
  { value: "#14532d", label: "Forest" },
  { value: "#f9fafb", label: "Light" },
  { value: "#e0f2fe", label: "Sky" },
  { value: "#ecfdf5", label: "Seafoam" },
  { value: "#fffbeb", label: "Cream" },
  { value: "#f5f3ff", label: "Lavender" },
  { value: "#fce7f3", label: "Blush" },
  { value: "#fef3c7", label: "Warm sand" },
];
