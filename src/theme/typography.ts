import { colors } from './tokens';

export const fonts = {
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  display: 'PlusJakartaSans_600SemiBold',
  displayBold: 'PlusJakartaSans_700Bold',
  displayExtra: 'PlusJakartaSans_800ExtraBold',
} as const;

export const text = {
  title: {
    fontFamily: fonts.displayExtra,
    fontSize: 28,
    color: colors.cream[900],
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.cream[800],
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  label: {
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[800],
  },
  link: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.brand[600],
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.danger[600],
  },
} as const;
