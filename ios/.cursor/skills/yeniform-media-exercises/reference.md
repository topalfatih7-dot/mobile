# Media & Exercises — Reference

## Mobile key files

- `src/services/exerciseMedia.ts` — signed URL cache/prefetch, thumbs
- `src/components/ui/VideoPlayer.tsx` — `expo-video` (muted/loop/auto)
- `src/components/library/ExerciseDetailModal.tsx` — centered detail modal
- `src/components/library/ExerciseVideoThumbnail.tsx`
- `app/(member)/library.tsx`, `programs.tsx`, `calendar.tsx`

## Web parity sources

- `src/services/supabaseDb.js` — `getExerciseVideoUrl`, `prefetchExerciseVideoUrls`, `getExerciseThumbUrl`
- `src/components/ui/VideoPlayer.jsx`, `ExerciseDetailModal.jsx`, `ExerciseVideoThumbnail.jsx`
- `docs/VIDEO_LATENCY_AND_PLAYBACK_RUNBOOK.md`, `docs/VIDEO_PLAYER_IOS_FULLSCREEN.md`

## Encode contract (§1.1)

MP4 H.264, yuv420p, ≤1280w, CRF ~28, no audio, `+faststart`. See exercise-import rule.
