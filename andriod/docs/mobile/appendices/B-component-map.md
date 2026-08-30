# Appendix B — Web → RN Component Map

| Web | RN suggestion |
|-----|----------------|
| BrandLogo | Image + text |
| FormField / PhoneField / GenderSelect | Custom inputs |
| Modal | Modal / BottomSheet (`@gorhom/bottom-sheet`) |
| VideoPlayer | `expo-video` + signed URL (`exerciseMedia`) |
| ExerciseDetailModal | Ortalanmış 16:9 player + metadata |
| ExerciseVideoThumbnail | expo-image webp |
| Stepper | web onboarding — **MOBILE DIFF:** kayıt tek adım, Stepper yok |
| PanelMobileMenu | PanelTopBar + PanelDrawer (soldan slide-in) |
| MembershipPlanCard | Pressable cards |
| MembershipDurationPicker | segmented control — **MOBILE DIFF:** paket web `/plans` |
| Chat thread UI | Gifted Chat or custom FlatList |
| Recharts (admin) | **MOBILE DIFF:** admin web-only |
| TurnstileWidget | **MOBILE DIFF:** native widget yok; API secret bypass |
| ToastContext | react-native toast lib |
| AnimatedBackground | LinearGradient static |
