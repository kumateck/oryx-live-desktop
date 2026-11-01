/** One local page serves both companion windows: the oryx itself, and its alerts panel (#panel). */
if (location.hash === "#panel") void import("./panel").then(({ startPanel }) => startPanel());
else void import("./pet").then(({ startPet }) => startPet());
