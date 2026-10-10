---
'@chemicalluck/sim-engine': minor
---

Make the game screens work on phones. Below 768px every sidebar view gets a sticky top bar with the clock, the wallet and a menu button that opens the sidebar drawer (before, the sidebar could not be opened on a phone). The page drops its card frame and wide padding, actions become full-width 44px tap targets without keyboard-number hints, and the minimap scrolls sideways at a readable size, centred on the player. Adds `useOptionalSidebar`.
