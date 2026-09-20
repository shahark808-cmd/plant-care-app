import type { DistrictInfo } from '../types'

export const DISTRICTS: DistrictInfo[] = [
  {
    id: 'myeongdong',
    nameHe: 'מיונגדונג',
    nameEn: 'Myeongdong',
    bullets: [
      'האזור הכי תיירותי ונגיש בסיאול',
      'אוכל: שוק האוכל - טוקבוקי, קורן דוג גבינה מצופה בציפס, לחם בריוש מתוק עם ביצה רכה, גלידת שומשום שחור, אוקונומיאקי יפני, מרשמלו שרוף ממולא בגלידה',
      'שוק נמדמון',
    ],
    chipPlaceIds: ['myeongdong-night-market', 'lotte-department-store'],
  },
  {
    id: 'hongdae',
    nameHe: 'הונגדה',
    nameEn: 'Hongdae',
    bullets: [
      'צעיר, אמנותי ותוסס בלילה',
      'שכונת סטודנטים ליד הונגיק',
      'ברים וחיי לילה חזקים',
      'שוק/קניות: רחוב הקניות',
      'הכי חי בסופ"ש',
    ],
    chipPlaceIds: ['retre', 'eungji-cafe'],
  },
  {
    id: 'itaewon',
    nameHe: 'איטאוון',
    nameEn: 'Itaewon',
    bullets: [
      'הרובע הבינלאומי',
      'מטבח מזרח תיכוני/וייטנאמי/אמריקאי',
      'ברים בהאנאם הסמוך',
      'הפסקה טובה מאוכל קוריאני',
    ],
    chipPlaceIds: ['rain-report'],
  },
  {
    id: 'gangnam',
    nameHe: 'גאנגנאם',
    nameEn: 'Gangnam',
    bullets: [
      'מודרני, עסקי, יוקרתי',
      'COEX + ספריית סטארפילד',
      'ברים משודרגים',
      'יקר יותר מהממוצע',
    ],
    chipPlaceIds: ['alice-cheongdam', 'le-chamber', 'coxon-mall'],
  },
  {
    id: 'bukchon-insadong',
    nameHe: 'בוקצ\'ון ואינסאדונג',
    nameEn: 'Bukchon & Insadong',
    bullets: [
      'סמטאות עם בתי הָאנוק, ממש מאחורי הארמונות',
      'בתי תה מסורתיים',
      'שוק טונגין',
      'נרגע אחרי 18:00',
    ],
    chipPlaceIds: ['gyeongbokgung', 'gwangjang-bibimbap', 'leedorim'],
  },
  {
    id: 'ikseondong',
    nameHe: 'איקסאון-דונג',
    nameEn: 'Ikseon-dong',
    bullets: ['סמטאות היסטוריות, בתי קפה בוטיק, עיצוב ישן-חדש'],
    chipPlaceIds: ['mil-toast-house', 'nakwon-station', 'soha-salt-pond', 'cheongsudang'],
  },
  {
    id: 'seongsu-dong',
    nameHe: 'סאונגסו-דונג',
    nameEn: 'Seongsu-dong',
    bullets: [
      'מפעלים ישנים שהפכו לגלריות ובתי קפה',
      'פחות תיירים',
      'טוב לטיול שני',
    ],
    chipPlaceIds: [
      'ader-error-seongsu',
      'kasina-seongsu',
      'eql-seongsu-grove',
      '999-humanity',
      'haus-nowhere-seoul',
      'youth-lab',
      'insilence-seongsu',
      'musinsa-daelim-changgo',
      'musinsa-empty-seongsu',
      'north-face-white-label',
      'hatching-room-seongsu',
      'yun',
      'beaker-flagship',
      'coor',
    ],
  },
]

export const UNASSIGNED_PLACE_IDS = ['olive-young', 'off-beauty', 'starbucks-bukhansan', 'tertre-cafe']
