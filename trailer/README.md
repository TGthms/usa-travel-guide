# America trailer v3

16:9 film of the live USA Travel Guide. **1080p24**, ~84s. Dark + Modern except a short theme flash.

Master: `trailer/america-trailer.mp4`

## Rebuild

```bash
npm run serve:static
node trailer/v3-capture.js    # landing stills
node trailer/v3-assemble.js   # Ken Burns + xfade + weather lightning + looped score
```

Music: `trailer/music/score.wav` (61s, crossfade-looped). Drop a longer track and re-run assemble if you want.

## What this cut does

- **Road → gallery:** CA-58 Baker fills the frame, pushes down the asphalt, dissolves into the same photo in the lightbox.
- **Weather:** stays on the live thunderstorm city (New York that day). Storm sky + lightning composited *behind* the UI. No prairie smash-cut.
- **Theme flash:** Dark Modern → Classic → Light Modern → Light Classic → back.
- **Motion flash:** Fun Facts at Full → Reduced → Off.
- **Also on screen:** Culture, Routes, Essentials, Tips path, Drive, Tools hub, Currency, Tip & Tax, Clock, Emergency, Destinations, Regions, Seasons, Settings, end card.

AI video gen is blocked on this account (ZDR). Pushes and lightning are ffmpeg composites so type stays sharp.
