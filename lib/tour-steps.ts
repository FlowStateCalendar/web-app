/**
 * Tutorial tour step definitions. Each step has a route (where it appears)
 * and a selector for the element to highlight. Used by the tour runner with driver.js.
 * Copy is written in the shark mascot's voice.
 */
export type TourStepConfig = {
  route: string;
  element: string;
  popover: {
    title: string;
    description: string;
  };
};

export const TOUR_STEPS: TourStepConfig[] = [
  {
    route: "/dashboard",
    element: "[data-tour='dashboard-events']",
    popover: {
      title: "Hi, I'm your guide",
      description:
        "I'm here to swim you through Shift Habits. I'll show you where tasks, rewards, and your aquarium live so you can dive in with confidence.",
    },
  },
  {
    route: "/dashboard",
    element: "[data-tour='user-bar']",
    popover: {
      title: "Your coins and profile",
      description:
        "Up here you'll see your greeting and coin balance. Tap your avatar to peek at your profile—level, XP, and coins. You earn coins every time you complete a task.",
    },
  },
  {
    route: "/dashboard",
    element: "[data-tour='app-nav']",
    popover: {
      title: "Getting around",
      description:
        "Use these tabs to glide between Dashboard, Tasks, Leaderboard, Aquarium, and Settings. I'll take you to each stop on this tour.",
    },
  },
  {
    route: "/dashboard",
    element: "[data-tour='dashboard-events']",
    popover: {
      title: "Your day, right here",
      description:
        "This is today's schedule from your tasks. The \"Next up\" card is what to focus on—tap \"Start Task\" to run a timed session and earn XP and coins. \"Show all events\" opens your full calendar. Remember: tasks create events, and finishing an event grows your rewards and leaderboard score.",
    },
  },
  {
    route: "/tasks",
    element: "[data-tour='tasks-section']",
    popover: {
      title: "Tasks",
      description:
        "This is where you add and edit tasks—they're what feed your calendar. Open \"Add new task\" when you're ready to create one.",
    },
  },
  {
    route: "/leaderboard",
    element: "[data-tour='leaderboard']",
    popover: {
      title: "Leaderboard",
      description:
        "See how your weekly coins stack up. Keep completing tasks to climb the ranks—your row is highlighted so you can find yourself quickly.",
    },
  },
  {
    route: "/aquarium",
    element: "[data-tour='aquarium']",
    popover: {
      title: "Aquarium",
      description:
        "Your aquarium grows with you. Keep the tank clean and spend coins in the Shop on fish and decorations—I'll show you the Shop next.",
    },
  },
  {
    route: "/aquarium/shop",
    element: "[data-tour='shop']",
    popover: {
      title: "Shop",
      description:
        "Splash your coins on fish, accessories, and tank upgrades. Everything here is paid for with coins from completed tasks, so keep finishing those events.",
    },
  },
  {
    route: "/settings",
    element: "[data-tour='settings']",
    popover: {
      title: "Settings",
      description:
        "Tweak theme, sound, and notifications, connect Google Classroom, and manage your account—whatever keeps you in flow.",
    },
  },
  {
    route: "/settings",
    element: "[data-tour='settings']",
    popover: {
      title: "You're ready",
      description:
        "You can restart this tour anytime from the Dashboard with the \"How it works\" button. I'll be cheering for your habits—see you in the water!",
    },
  },
];
