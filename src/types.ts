import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

/** @expo/vector-icons Ionicons ikon adı (proje genelinde ikon prop tipi). */
export type IoniconName = ComponentProps<typeof Ionicons>['name'];
