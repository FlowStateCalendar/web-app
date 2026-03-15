/**
 * Tutorial tour step definitions. Each step has a route (where it appears)
 * and a selector for the element to highlight. Used by the tour runner with driver.js.
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
      title: "Welcome to Shift Habits",
      description:
        "This short tour will show you around the app. You'll see where everything lives and how tasks, rewards, and your aquarium work.",
    },
  },
  {
    route: "/dashboard",
    element: "[data-tour='user-bar']",
    popover: {
      title: "Top bar",
      description:
        "Your greeting and coin balance live here. Tap your avatar to open your profile and see your level, XP, and total coins. Coins are earned by completing tasks.",
    },
  },
  {
    route: "/dashboard",
    element: "[data-tour='app-nav']",
    popover: {
      title: "Navigation",
      description:
        "Use these tabs to move between Dashboard, Tasks, Leaderboard, Aquarium, and Settings. We'll visit each one in this tour.",
    },
  },
  {
    route: "/dashboard",
    element: "[data-tour='dashboard-events']",
    popover: {
      title: "Today's events",
      description:
        "Here you see today's scheduled events from your tasks. The \"Next up\" card is your current focus. Use \"Start Task\" to begin a timed session and earn XP and coins. \"Show all events\" opens your full schedule.",
    },
  },
  {
    route: "/dashboard",
    element: "[data-tour='dashboard-events']",
    popover: {
      title: "How it works",
      description:
        "Tasks you create generate events on your calendar. When you complete an event (run the timer and finish), you earn XP and coins. Your weekly coins also count toward the leaderboard.",
    },
  },
  {
    route: "/tasks",
    element: "[data-tour='tasks-section']",
    popover: {
      title: "Tasks",
      description:
        "This is where you add and manage your tasks. Your tasks create events that show up on the Dashboard. Expand \"Add new task\" below to create one.",
    },
  },
  {
    route: "/leaderboard",
    element: "[data-tour='leaderboard']",
    popover: {
      title: "Leaderboard",
      description:
        "See how your weekly coins compare with others. Complete tasks to earn coins; your total for the week appears here. Your row is highlighted so you can spot your rank.",
    },
  },
  {
    route: "/aquarium",
    element: "[data-tour='aquarium']",
    popover: {
      title: "Aquarium",
      description:
        "Your aquarium grows with your progress. Keep the tank clean and buy fish and accessories in the Shop using the coins you earn from completing tasks.",
    },
  },
  {
    route: "/aquarium/shop",
    element: "[data-tour='shop']",
    popover: {
      title: "Shop",
      description:
        "Spend your coins here on fish, accessories, and tank upgrades. Coins are earned by completing tasks, so keep finishing events to grow your collection.",
    },
  },
  {
    route: "/settings",
    element: "[data-tour='settings']",
    popover: {
      title: "Settings",
      description:
        "Change your theme, sound, and notifications here. You can also connect Google Classroom to sync tasks and manage your account details.",
    },
  },
  {
    route: "/settings",
    element: "[data-tour='settings']",
    popover: {
      title: "You're all set",
      description:
        "You can restart this tour anytime from the Dashboard using the \"How it works\" button. Happy habit-building!",
    },
  },
];
