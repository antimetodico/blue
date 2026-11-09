# SHARD//RUN

A tiny low-poly, PSX-inspired browser game. Collect five memory shards while avoiding the watcher.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Wrangler. Desktop controls: **WASD / arrow keys** to move, **Space** to hop, **R** to restart after game over. Touch devices get an on-screen D-pad and **HOP** button instead; tap anywhere after game over to restart.

## Deploy to Cloudflare Workers

This is a static-assets Worker; the game is served from `public/` using `wrangler.jsonc`.

```sh
npm install
npx wrangler login
npm run deploy
```

`wrangler login` opens Cloudflare authorization in your browser. Deploying requires a Cloudflare account; this repository does not contain account credentials. For Git-based deploys, connect this repository to Workers Builds in the Cloudflare dashboard and use `npm run deploy` as the deploy command.

## Validation

```sh
npm run check
```

This runs Wrangler's deploy dry-run without publishing the site.
