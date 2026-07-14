import { gradients, type Gradient } from '@/constants/theme';

export type Conversation = {
  id: string;
  name: string;
  role: string;
  last: string;
  time: string;
  unread: number;
  online: boolean;
  gradient: Gradient;
};

/** Varsayılan sohbet gradient’i (live thread’ler AppContext’ten gelir). */
export const DEFAULT_CONVERSATION_GRADIENT: Gradient = gradients.primary;
