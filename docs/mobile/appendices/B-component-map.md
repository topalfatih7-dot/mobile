# Appendix B — Web → RN Component Map

| Web | RN suggestion |
|-----|----------------|
| BrandLogo | Image + text |
| FormField / PhoneField / GenderSelect | Custom inputs |
| Modal | Modal / BottomSheet (`@gorhom/bottom-sheet`) |
| VideoPlayer | `expo-video` + signed URL (`exerciseMedia`) |
| ExerciseDetailModal | Ortalanmış 16:9 player + metadata |
| ExerciseVideoThumbnail | expo-image webp |
| Stepper | custom |
| PanelMobileMenu | PanelTopBar + PanelDrawer (soldan slide-in) |
| MembershipPlanCard | Pressable cards |
| MembershipDurationPicker | segmented control |
| Chat thread UI | Gifted Chat or custom FlatList |
| Recharts (admin) | victory-native or simple numbers |
| TurnstileWidget | attestation / WebView captcha |
| ToastContext | react-native toast lib |
| AnimatedBackground | LinearGradient static |
