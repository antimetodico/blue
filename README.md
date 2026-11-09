# THE PALE ROOM

A low-poly, third-person browser dungeon built with Three.js. Guide a small white figure through an endless sequence of quiet, procedurally varied rooms. Each room has a heavy door; approach it and press **E** (or tap **OPEN**) to move onward through a full-screen pixel-shimmer transition.

## Features

- White low-poly character with a camera-facing, animated pixel shimmer and bright aura.
- Smooth directional walking animation driven by live movement input.
- Third-person camera with eased follow and delayed heading.
- Procedurally varied rooms with randomized orientation, stone details, chests, hanging chains, moss, rubble, and torchlight.
- Animated doors and a bright shimmer transition between rooms.
- Keyboard, touch joystick, and standard browser gamepad input.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Wrangler.

**Desktop:** WASD or arrow keys to move; **E** to open a nearby door.  
**Mobile:** use the on-screen joystick and tap **OPEN** near a door.  
**Gamepad:** left stick to move; the primary button to open a nearby door.

## Deploy to Cloudflare Workers

The game is served as static assets from `public/` using `wrangler.jsonc`.

```sh
npm install
npx wrangler login
npm run deploy
```

`wrangler login` opens Cloudflare authorization in your browser. Deployment requires a Cloudflare account; this repository does not contain account credentials. For Git-based deploys, connect the repository to Workers Builds in the Cloudflare dashboard and use `npm run deploy` as the deploy command.

## Validation

```sh
npm test
npm run check
```

`npm test` runs the repository's Node.js smoke tests. `npm run check` runs Wrangler's deploy dry-run without publishing the site.
