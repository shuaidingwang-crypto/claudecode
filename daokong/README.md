# 倒空

A small personal web app: pour out the thoughts that keep circling, pick one thing for today if you want, and drop each thing you did into a jar that only ever fills up.

- **倒出来** — write a thought down and leave it. Swipe right (or tap 做了) to put it in the jar, swipe left (or tap 放下) to let it go. Both can be undone from the toast. Thoughts untouched for three days sink into a folded section.
- **今天一件** — optional. 做了 puts it in the jar; 今天不做了 returns it to 倒出来; 放下 drops it. If nothing is tapped, it returns to 倒出来 the next day.
- **做过的** — a jar of pebbles, one per thing done, colored by category (身体 / 人 / 手艺 / 家 / 心). The main view shows no numbers. Every 60 pebbles the jar is sealed with a short moment (counts per category and the most interesting item), and moves to the 罐子架 sheet, where totals live.

## Data and privacy

Everything is stored in this browser's `localStorage` on this device. Use 设置 → 导出备份 before switching phones or clearing browser data. Installing the app to the home screen (Add to Home Screen) makes the browser much less likely to clear it.

## AI tagging (optional)

Categories and each jar's highlight are picked by Claude when an Anthropic API key is saved in 设置. The key is kept only in this browser and sent only to `api.anthropic.com`. Without a key, a keyword guess is used, and every tag can be changed by tapping its icon.

The SDK is vendored as `vendor/anthropic-sdk.mjs` (`@anthropic-ai/sdk` 0.135.0, bundled with esbuild) so the app needs no build step.

## Run locally

```bash
cd daokong
python3 -m http.server 8000
```

Then open http://localhost:8000. A service worker caches the app for offline use; bump `VERSION` in `sw.js` when you change any file so installed copies update.

## Deploy

`.github/workflows/daokong-pages.yml` publishes this folder to GitHub Pages on pushes to `main` that touch `daokong/`, or when run by hand from the Actions tab. Enable it once under Settings → Pages → Source: GitHub Actions.
