import type { InfoCategory } from '../types'

export const INFO_CATEGORIES: InfoCategory[] = [
  {
    id: 'transport',
    title: 'תחבורה ואפליקציות',
    importance: 1,
    items: [
      {
        title: 'T-money',
        description: 'כרטיס לאוטובוס/מטרו/מונית, נטען במכולת/תחנה',
      },
      {
        title: 'Kakao T',
        description: 'הזמנת מונית, תמיכה אנגלית',
      },
      {
        title: 'KorailTalk',
        description: 'כרטיסי KTX',
      },
    ],
  },
  {
    id: 'language',
    title: 'שפה ותקשורת',
    importance: 2,
    items: [
      {
        title: 'Papago',
        description: 'תרגום הכי מדויק לקוריאנית',
      },
      {
        title: 'KakaoTalk',
        description: 'אפליקציית מסרים מרכזית',
      },
      {
        title: 'שלטים',
        description: 'שלטים רבים כוללים אנגלית בערים הגדולות',
      },
    ],
  },
  {
    id: 'etiquette',
    title: 'נימוסים ותרבות',
    importance: 3,
    items: [
      {
        title: 'קידה',
        description: 'קידה קלה כלפי מבוגרים',
      },
      {
        title: 'נתינה וקבלה',
        description: 'נתינה/קבלה בשתי ידיים',
      },
      {
        title: 'תחבורה ציבורית',
        description: 'שקט בתחבורה ציבורית',
      },
      {
        title: 'פינוי מקום',
        description: 'פינוי מקום למבוגרים/הריון/מוגבלות',
      },
    ],
  },
]
