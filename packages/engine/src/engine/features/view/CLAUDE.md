# View System

The view system controls what the UI renders. `activeViewId` + `props` live in Redux; `ViewManager` reads them and renders the matching registered component.

## How It Works

```
Redux (activeViewId, props)
  └─ ViewManager (manager.tsx)
       └─ looks up component in ViewsContext
            └─ renders <Component {...props} />
```

`ViewsContext` is populated at app startup from all registered view components (engine built-ins + auto-discovered extension views).

## ViewPropsMap — Type-Safe View Props

`ViewPropsMap` in `slice.ts` maps view IDs to their required props. `ViewState` is a discriminated union derived from it, ensuring the Redux action and the component always agree on prop shape.

To add a new view you must add its entry to `ViewPropsMap`. If the view takes no props, use `Record<string, never>`.

## Adding a Built-In Engine View

1. Create the component in `src/engine/features/view/built-in/`.
2. Re-export it from `src/engine/features/view/views.tsx`.
3. Add the view ID and props to `ViewPropsMap` in `slice.ts`.
4. Add the ID to the `VIEW_IDS` array in `slice.ts`.

## Adding a Game Extension View

1. Augment `ViewPropsMap` in the extension's `types.ts`:
   ```ts
   declare module '~/engine/features/view/slice' {
     interface ViewPropsMap {
       MyView: { someParam: string };
     }
   }
   ```
2. Register the component in the extension's `views.tsx` (auto-discovered by `game-plugin.ts`).

## Switching Views

Dispatch a `view` effect — never use React Router or imperative calls:

```ts
// In a scene action's effects array:
{ kind: 'view', activeViewId: 'SceneView', props: {} }

// To set the scene description text:
{ kind: 'desc', text: 'You enter the café.' }
```

The `view` and `desc` effect kinds are registered in `src/engine/features/view/types.ts`.

## Registered Views

**Built-in (engine):** `MainMenuView`, `DefaultView`, `SceneView`, `ScriptView`, `CharacterCustomisationView`

**Extension views (auto-discovered from `src/game/`):** `OutfitView`, `ShopView`, `NpcView`, `ConversationView`, `EncounterView`, `CourseSelectionView`
