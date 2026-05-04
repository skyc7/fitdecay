# FitDecay Submission Copy

## Project title
FitDecay

## Short description
FitDecay helps athletes estimate what fitness they may lose during a training layoff, then turns that estimate into a safer re-entry plan for strength, cardio, sport, yoga, Pilates, and calisthenics.

## Full description
FitDecay is a local-first fitness recovery app for the part of training most apps ignore: what happens when life interrupts consistency. Users add performance baselines, log a layoff from illness, injury, travel, school, or busy life, and FitDecay estimates current performance using detraining curves for strength, cardiovascular fitness, sport power, and mobility/control.

The app then generates a practical return-to-training plan with specific targets, like machine weights, rep-max loads, running pace equivalents, and technique-first sport work. As users log return tests and how sessions felt, FitDecay personalizes future predictions so the model becomes more useful over time.

The goal is to make coming back feel less like guessing and more like coaching: clear numbers, honest uncertainty, and a plan that helps users return without overshooting on the first week back.

## What makes it useful
- Tracks strength, machines, rep maxes, bodyweight work, cardio times, vertical jump, sprint tests, yoga, Pilates, and mobility metrics.
- Converts units cleanly across metric, imperial, and US-style display modes.
- Shows layoff impact in plain English, not just graphs.
- Generates a 3-week re-entry plan with conservative progression.
- Learns from return tests through a personal decay multiplier.
- Runs entirely in the browser with localStorage, no backend required.
- Includes demo data so judges can understand the app in under three minutes.

## Suggested demo flow
1. Open the app and click **Load demo data**.
2. Open the active 9-day layoff estimate.
3. Switch units in Settings to **US metric** to show readable pounds, inches, and time formatting.
4. View the 5K estimate as minutes instead of raw seconds.
5. Open the re-entry plan and show the specific strength/machine/cardio targets.
6. Mention that return tests personalize future predictions.

## Preview image
Use: `submission/fitdecay-preview.png`

## Deployment notes
- Build command: `npm run build`
- Output directory: `dist`
- Vercel: `vercel.json` includes SPA rewrites.
- Netlify: `public/_redirects` is copied into `dist/` during build.
