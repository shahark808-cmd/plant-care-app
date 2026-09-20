import type { ItineraryItem } from '../types'

export const DEFAULT_ITINERARY: ItineraryItem[] = [
  {
    id: 'eungji-cafe-morning',
    time: '09:00',
    place: 'קפה אונג\'י',
    placeKo: '홍대 카페 · הונגדה',
    category: 'coffee',
    notePlaceholder: 'ההמלצה שלך על המקום',
  },
  {
    id: 'gyeongbokgung-morning',
    time: '11:00',
    place: 'ארמון גיונגבוקגונג',
    placeKo: '경복궁',
    category: 'attraction',
    notePlaceholder: 'הטיפ שלך לביקור',
  },
  {
    id: 'gwangjang-lunch',
    time: '14:00',
    place: 'שוק גוואנגג\'אנג',
    placeKo: '광장시장',
    category: 'food',
    notePlaceholder: 'מה כדאי להזמין',
  },
  {
    id: 'namsan-night',
    time: '19:00',
    place: 'נמסאן, תצפית לילה',
    placeKo: '남산타워',
    category: 'view',
    notePlaceholder: 'מתי הכי כדאי להגיע',
  },
]
