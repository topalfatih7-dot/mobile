# Staff — Library Gate (LOCK) (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/library`
- **Web:** `/staff/library` → `StaffLibraryGate` → `ExerciseLibraryPage` `staffMode`
- Coach → full exercise library (filters + detail modal parity member library)
- Dietitian → redirect `/(staff)/lists`
- Doctor / other → redirect `/(staff)`
- Pagination `pageSize` 20; category filter `EXERCISE_CATEGORY_ALL`; `prefetchExerciseVideo` + `ExerciseDetailModal` / signed URL playback
- List badges: `formatExerciseLocations` (web staffMode card parity)
