/**
 * Pulls every built-in feature's module augmentations (PresentState slices,
 * effect and condition kinds, content extensions) into any TypeScript program
 * that imports the store or the shared types.
 *
 * At runtime these modules are wired in through `virtual:*` modules, so a game
 * file usually never imports them, and without this file their augmentations
 * (e.g. `state.present.time`) would be missing from the game's types.
 * Type-only: nothing here is bundled.
 */
import type {} from '../features/calendar/slice';
import type {} from '../features/calendar/types';
import type {} from '../features/clothing/conditions';
import type {} from '../features/clothing/effect-types';
import type {} from '../features/clothing/slice';
import type {} from '../features/containers/authoring.types';
import type {} from '../features/containers/conditions';
import type {} from '../features/containers/slice';
import type {} from '../features/containers/types';
import type {} from '../features/encounter/authoring.types';
import type {} from '../features/encounter/conditions';
import type {} from '../features/encounter/hydrate';
import type {} from '../features/encounter/slice';
import type {} from '../features/encounter/types';
import type {} from '../features/events/hydrate';
import type {} from '../features/linguistics/slice';
import type {} from '../features/milestones/conditions';
import type {} from '../features/milestones/initializer';
import type {} from '../features/milestones/slice';
import type {} from '../features/milestones/types';
import type {} from '../features/money/conditions';
import type {} from '../features/money/slice';
import type {} from '../features/money/types';
import type {} from '../features/needs/conditions';
import type {} from '../features/needs/hydrate';
import type {} from '../features/needs/slice';
import type {} from '../features/needs/types';
import type {} from '../features/npcs/conditions';
import type {} from '../features/npcs/slice';
import type {} from '../features/npcs/types';
import type {} from '../features/outfits/slice';
import type {} from '../features/outfits/types';
import type {} from '../features/player/conditions';
import type {} from '../features/player/slice';
import type {} from '../features/player/types';
import type {} from '../features/quests/initializer';
import type {} from '../features/quests/slice';
import type {} from '../features/quests/types';
import type {} from '../features/relationships/conditions';
import type {} from '../features/relationships/slice';
import type {} from '../features/relationships/types';
import type {} from '../features/rng/slice';
import type {} from '../features/save/slice';
import type {} from '../features/save/types';
import type {} from '../features/shop/authoring.types';
import type {} from '../features/shop/hydrate';
import type {} from '../features/shop/types';
import type {} from '../features/time/conditions';
import type {} from '../features/time/slice';
import type {} from '../features/time/types';
import type {} from '../features/travel/hydrate';
import type {} from '../features/travel/types';
import type {} from '../features/view/authoring.types';
import type {} from '../features/view/slice';
import type {} from '../features/view/types';
import type {} from '../features/weather/conditions';
import type {} from '../features/weather/slice';
import type {} from '../features/weather/types';
