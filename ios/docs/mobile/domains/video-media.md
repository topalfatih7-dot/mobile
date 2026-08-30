# Domain — Video & Exercise Media

## Exercise videos

1. Storage path only in DB (`gym100-0001.mp4`)
2. Private bucket `exercise-videos`
3. Signed URL TTL **15 minutes**
4. Client-first signed URL; fallback `POST /api/auth` action `exercise-video-url` / `exercise-video-urls`
5. `video_pending` → no sign request; show placeholder
6. Path validation: `^[\w.-]+$`, no `..`

## Thumbnails

- Public bucket `exercise-thumbs`
- Path: same basename `.webp`
- No DB column; `getExerciseThumbUrl(videoRef)`

## Playback UX

- List: static webp thumb
- Tap: centered `ExerciseDetailModal` (16:9 `VideoPlayer` + metadata)
- Prefetch signed URL on press-in
- Player: `expo-video` (muted + loop + autoplay); native controls + fullscreen
- URL: in-memory cache (~13 min) + in-flight dedupe
- iOS fullscreen: `VideoView` `fullscreenOptions.enable`

## Daily calls

Separate from exercise videos — see chat-realtime-video skill + `api/daily-room.js`.
