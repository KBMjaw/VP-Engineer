# VP Engineers — Website

Single-page website for **VP Engineers — Versatile In Profession** (Erode, Tamil Nadu).
Proprietor: J. Tamil Selvan, M.E. (Structural Engineering).

Plain static HTML/CSS/JS — no build step — deployed on Vercel.

## Structure

```
index.html              All sections (single page)
css/styles.css          Design system + all styles
js/main.js              Navbar, reveals, counters, journey scroll engine, projects, enquiry form
js/journey-scene.js     "From Ground to Home" SVG construction drawing (12 stages)
js/projects.js          Project list — add real projects here
assets/img/             Logo, proprietor photo, hero banner, icons
vercel.json             Caching + security headers
```

## Common updates

- **Add projects:** put photos in `assets/projects/` and add entries to `VP_PROJECTS` in `js/projects.js` (format documented in the file).
- **Replace logo / photo:** overwrite `assets/img/vp-logo*.png|webp` and `assets/img/tamil-selvan.webp` (keep the file names). The current files were cut from the supplied 16:9 banner; dedicated originals will look sharper.
- **Optional counters (e.g. 40+ clients):** commented out in the intro section of `index.html` — enable only once verified.
- **Journey stages:** text lives in `index.html` (`.jcopy` articles); drawing layers in `js/journey-scene.js` (`data-s` = stage, `data-t` = point within the stage).

## Local preview

```
python3 -m http.server 8000
```

## Deploy

Import the repo in Vercel (Framework preset: **Other**, no build command, output directory = root), or run `vercel --prod`.
