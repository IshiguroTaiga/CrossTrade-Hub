# CrossTrade Hub

One trade list for **Anime Adventures**, **Anime Vanguards** and **Grand Piece Online**. List what you own, mark what you'll trade, add what you're looking for, and share it all as a single link in Discord.

## Features

- **Inventory**: add units/items from any game, set quantities, and tick what's up for trade
- **Looking for**: your wishlist, from any game
- **Trade calculator**: compare two sides. Each game is totalled separately because AA, AV and GPO values aren't on the same scale
- **Share**: your post is compressed into the URL itself (no accounts, no database). Copy the link or a ready-made Discord message
- **Values**: browse community values with source and date on every number. Click any value to set your own, or add items that aren't listed

Everything is saved in your browser (`localStorage`). Nothing is sent to a server.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

Import the repo at [vercel.com/new](https://vercel.com/new). Vercel detects Vite automatically (build: `npm run build`, output: `dist`). No environment variables needed.

## Updating values

Values live in [`src/data/values.ts`](src/data/values.ts). Edit the numbers, bump the source's `asOf` date, commit, and Vercel redeploys.

Seed values come from [AAValues.trade](https://aavalues.trade/) (restored historical prices, Oct 2026), [game.guide](https://www.game.guide/anime-vanguards-value-list) and [The Backdash](https://thebackdash.com/gaming/grand-piece-online-trading-guide-how-to-trade-and-trade-list/). They're estimates, not verified sales. Anime Adventures Update 21 units have no price yet.

## Disclaimer

Fan-made and not affiliated with Roblox or any game's developers. Item-for-item trades only: selling in-game items for real money can break Roblox's Terms of Use. Crosstrades need one side to go first, and this site can't enforce the other side, so use a trusted middleman for big trades and never share your password or cookie.
