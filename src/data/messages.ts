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

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    name: 'Mehmet Kaya',
    role: 'Kişisel Koç',
    last: 'Bugünkü antrenmanı harika tamamladın! 💪 Yarın bacak gününe hazır ol.',
    time: '14:20',
    unread: 2,
    online: true,
    gradient: gradients.coral,
  },
  {
    id: 'c2',
    name: 'Dyt. Aslı Demir',
    role: 'Diyetisyen',
    last: 'Yeni beslenme listeni yükledim, inceleyebilir misin?',
    time: 'Dün',
    unread: 0,
    online: false,
    gradient: gradients.forest,
  },
  {
    id: 'c3',
    name: 'Yeni Form Destek',
    role: 'Destek Ekibi',
    last: 'Üyeliğinle ilgili her konuda buradayız 👋',
    time: 'Pzt',
    unread: 0,
    online: true,
    gradient: gradients.brand,
  },
];
