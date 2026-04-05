import type { PopoverDOM } from "driver.js";

/** Shark art: web-app/public/Mascots/SharkMascot.png */
export const TOUR_SHARK_IMAGE_URL = "/Mascots/SharkMascot.png";

const ROW_CLASS = "sh-mascot-tour__row";
const BUBBLE_CLASS = "sh-mascot-tour__bubble";

/**
 * Wraps title + description in a speech-bubble layout next to the shark mascot.
 * Idempotent: safe to call on every driver.js popover render.
 */
export function enhanceMascotTourPopover(popover: PopoverDOM): void {
  const { wrapper, title, description, arrow, closeButton } = popover;
  if (wrapper.querySelector(`.${ROW_CLASS}`)) {
    return;
  }

  const row = document.createElement("div");
  row.className = ROW_CLASS;

  const mascotCol = document.createElement("div");
  mascotCol.className = "sh-mascot-tour__mascot";
  const img = document.createElement("img");
  img.src = TOUR_SHARK_IMAGE_URL;
  img.alt = "Shift Habits guide mascot";
  img.className = "sh-mascot-tour__mascot-img";
  img.decoding = "async";
  mascotCol.appendChild(img);

  const bubble = document.createElement("div");
  bubble.className = BUBBLE_CLASS;

  wrapper.insertBefore(row, title);
  row.appendChild(mascotCol);
  row.appendChild(bubble);
  bubble.appendChild(title);
  bubble.appendChild(description);

  closeButton.setAttribute("aria-label", "Skip tour");
}
