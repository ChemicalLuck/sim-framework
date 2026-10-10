---
'@chemicalluck/sim-engine': minor
---

Make the game screens work on phones (below 768px):

- A sticky top bar on every sidebar view shows the weather, the clock, the wallet and a thin bar per need.
- The sidebar becomes a bottom sheet. To open it, tap or swipe up the "Menu" tab pinned to the bottom edge. To close it, swipe its grab handle down. Before this, the sidebar could not be opened on a phone at all.
- The minimap is collapsed behind a "Show map" toggle. When open, it scrolls sideways at a readable size and is centred on the player.
- Dialogs open full screen with a large close button.
- The page drops its card frame and wide padding.
- Actions are full-width rows at least 44px tall, without keyboard-number hints.

Adds `useOptionalSidebar` and `useVerticalSwipe`.
