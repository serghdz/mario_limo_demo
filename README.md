# Mario's Signature Limousine — interactive demo

The website lives in `website/`. This repository includes the website source, the full-quality web model, and the photos/environment/decoder files required by the demo. Blender projects, original reference collections, QA screenshots, caches, and build outputs remain local and are excluded from Git.

## Publish the demo with GitHub Pages

The repository is prepared for **https://serghdz.github.io/mario_limo_demo/**. The page is not published merely by pushing code.

1. In this repository's **Settings → Pages**, select **GitHub Actions** as the source.
2. Open **Actions → Publish demo to GitHub Pages → Run workflow**, choose `main`, and run it.
3. After the workflow succeeds, open the URL above. Repeat step 2 when you want to publish an update.

No personal token, server, database, or additional hosting service is needed by this workflow. The quote form only prepares a local draft; it does not send a request or make a reservation.

## Test the exact static demo locally

Use Node.js 24 and npm. From the repository root:

```sh
npm run setup
npm run typecheck
npm run build:pages
npm run preview:pages
```

Open **http://127.0.0.1:4173/mario_limo_demo/**. The `website/dist-pages/` directory is the deployable static output. The base path is defined in `website/vite.pages.config.ts`; models, textures, photos, Draco decoders, and dynamic JavaScript chunks use that base path.

The static build mounts the same React page and Three.js code used by the existing Vinext preview. It needs no server runtime. The separate Vinext/Cloudflare build remains available below, but its server output is not used by GitHub Pages.

Workflow setup follows the [Vite Pages guide](https://vite.dev/guide/static-deploy.html#github-pages) and [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Run locally

From this folder in VS Code's terminal:

```sh
npm run setup
npm run dev
```

Open **http://localhost:3000/**. The local preview updates when website source files change.

`npm run build` creates the production build. Nothing has been published.

## Where things live

- `website/app/`: page layout, styles, local quote draft form, and the live Three.js journey.
- `website/public/models/limousine.glb`: source-faithful browser model, approximately 28.1 MB, retaining 4K lossless PBR maps. Draco decoder files are served locally in `public/draco/`.
- `website/public/photos/`: copies of selected actual vehicle/cabin photos used by the site.
- `website/public/videos/limo_cruise.mp4`: original 1280×720 cruising clip (about 15 seconds), displayed after the exterior details. It loads and autoplays silently only when visible, loops inline, and pauses/resumes on tap or Enter/Space without visible playback controls. A deliberate pause persists when scrolling away and back. Reduced-motion/data-saving preferences suppress autoplay; tapping can start playback.
- `limo_cabin_and_entry_door.blend`: editable exterior, interior, and single hinged passenger door. Earlier `.blend` files and `.blend1` files are checkpoints/backups; preserved.
- `limo_web.glb`: current standalone web export, copied into the website's public model folder.
- `tripo/` and `pics/`: original reference photographs; preserved.
- `build_limo_cabin.py`, `export_limo_web.py`, `export_limo_web_fidelity.py`: Blender-side construction/export recipes. The export entry point uses the fidelity recipe. The build recipe expects the already-separated entry door; do not rerun it on the finished cabin.
- `web_assets/`: intermediate baked exterior color/normal images for the web export.

## Experience and limitations

Desktop scrolling drives the vehicle, stops it, approaches the passenger entry, opens only that door, and enters the cabin. Chapter buttons provide direct navigation. The named `PassengerDoorPivot` retains a conventional front-edge hinge: positive Y rotation in glTF opens outward by 72 degrees. Other doors remain fixed. No Blender animation is required.

Fixed geometry is batched by material in Three.js; the door hierarchy stays separate. All 88,882 triangles and 232 meshes from the prior export are retained. The exporter bakes Blender's procedural color, roughness, and metallic output at 4096 pixels, preserves the full-resolution normal map and source normal strength, and keeps the original opaque tinted glass. It does not guess transparent faces from texture brightness. The renderer uses AgX and the same forest environment as Blender's material preview; controlled cabin lights are added in code. Fine exterior geometry and hidden interior dimensions remain limited by the reconstructed source. Real-time lighting and reflections differ from Cycles. The Three.js city is stylized, not a real venue/address. World scale is for visual composition, not a measurement claim.

Supported desktop and mobile/narrow panels load the 3D tour automatically. Startup shows a dark progress state, with no photo hero flash. Reduced-motion and data-saving preferences retain a deliberate photographic alternative with an **Explore in 3D** opt-in. Narrow screens use a full-height 3D hero with overlaid text and all four chapter buttons, with portrait and landscape camera framing. Reduced-motion preferences also disable smooth chapter scrolling. An error fallback preserves access to the content. The quote action prepares an **unsent draft**, not a booking or a successful submission. It is not stored or sent to a server. The optional WebMCP tool uses that same draft action.

Browser verification screenshots are in `website/qa/`. On Windows, if PowerShell's global npm shim is broken, use `npm.cmd run dev` (or the corresponding setup/build command).

`arrival-before-fidelity.png`, `arrival-after-fidelity.png`, and `blender-source-fidelity.png` document the fidelity correction. `render_source_comparison.py` renders the Blender reference with temporary lighting/camera settings and restores them. The former compact GLB and exporter are preserved in `web_assets/` as `limo_web_before_fidelity.glb` and `export_limo_web_legacy.py`; they are not the current website assets.

Before public launch: confirm the provisional brand/name, business contact information, service terms, vehicle capacity, operating arrangements, and pricing process; connect a real quote endpoint; review imagery/model fidelity and test target devices. No prices, reviews, contact numbers, manufacturer/year, capacity, or availability have been invented.

The exterior section uses 81 original-resolution JPEG frames sampled from the supplied rotation clip (about 7.8 MB). Frames load near the section with three concurrent requests; data-saving connections load requested angles on demand. Drag horizontally or use Left/Right, Home, and End. Vertical touch scrolling remains available. The source ends at a different angle than it starts, so the viewer clamps instead of wrapping. One side view already clips the nose in the source. The full source frame is contained without additional cropping; titles and captions overlay the section. No rotation autoplay or audio is used.

Fresh page loads and reloads always open at the City chapter. A small pre-render startup script disables browser scroll restoration and clears the initial section hash, while preserving path/query parameters. Its one-time late reset is skipped after user input, so normal scrolling and chapter navigation remain under visitor control.
