import type { CategoryMeta, Place } from '../types'

export const CATEGORIES: CategoryMeta[] = [
  { key: 'food', label: 'אוכל' },
  { key: 'coffee', label: 'קפה' },
  { key: 'shopping', label: 'קניות' },
  { key: 'attraction', label: 'אטרקציה' },
  { key: 'view', label: 'נוף' },
]

export const PLACES: Place[] = [
  // אוכל
  { id: 'gwangjang-bibimbap', name: 'גוואנגג\'אנג מרקט - דוכן ביבימבאפ', category: 'food' },
  { id: 'myeongdong-night-market', name: 'שוק לילה מיונגדונג', category: 'food' },
  { id: 'soha-salt-pond', name: 'Soha Salt Pond', category: 'food' },
  { id: 'alice-cheongdam', name: 'Alice Cheongdam', category: 'food' },
  { id: 'le-chamber', name: 'Le Chamber', category: 'food' },

  // קפה
  { id: 'eungji-cafe', name: 'אונג\'י קפה', category: 'coffee' },
  { id: 'mil-toast-house', name: 'Mil Toast House', category: 'coffee' },
  { id: 'nakwon-station', name: 'Nakwon Station', category: 'coffee' },
  { id: 'rain-report', name: 'Rain Report', category: 'coffee' },
  { id: 'leedorim', name: 'Leedorim', category: 'coffee' },
  { id: 'tertre-cafe', name: 'Tertre Cafe', category: 'coffee' },
  { id: 'cheongsudang', name: 'Cheongsudang', category: 'coffee' },
  { id: 'starbucks-bukhansan', name: 'Starbucks The Bukhansan', category: 'coffee' },

  // קניות
  { id: 'coxon-mall', name: 'קניון קוקסונג', category: 'shopping' },
  { id: 'ader-error-seongsu', name: 'ADER ERROR Seongsu', category: 'shopping' },
  { id: 'kasina-seongsu', name: 'kasina seongsu', category: 'shopping' },
  { id: 'eql-seongsu-grove', name: 'EQL Seongsu Grove', category: 'shopping' },
  { id: '999-humanity', name: '999 Humanity', category: 'shopping' },
  { id: 'haus-nowhere-seoul', name: 'Haus Nowhere Seoul', category: 'shopping' },
  { id: 'youth-lab', name: 'Youth Lab', category: 'shopping' },
  { id: 'insilence-seongsu', name: 'Insilence Seongsu Flagship', category: 'shopping' },
  { id: 'musinsa-daelim-changgo', name: 'Musinsa Store @Daelim Changgo', category: 'shopping' },
  { id: 'musinsa-empty-seongsu', name: 'Musinsa Empty Seongsu', category: 'shopping' },
  { id: 'north-face-white-label', name: 'The North Face White Label Sungsu', category: 'shopping' },
  { id: 'hatching-room-seongsu', name: 'Hatching Room Seongsu', category: 'shopping' },
  { id: 'yun', name: 'YUN', category: 'shopping' },
  { id: 'beaker-flagship', name: 'Beaker Flagship Store', category: 'shopping' },
  { id: 'coor', name: 'Coor', category: 'shopping' },
  { id: 'olive-young', name: 'אוליב יאנג (Olive Young)', category: 'shopping' },
  { id: 'off-beauty', name: 'Off Beauty', category: 'shopping' },
  { id: 'retre', name: 'Retre (레트르)', category: 'shopping' },
  { id: 'lotte-department-store', name: 'Lotte Department Store (הסניף הראשי)', category: 'shopping' },

  // אטרקציה
  { id: 'gyeongbokgung', name: 'ארמון גיונגבוקגונג', category: 'attraction' },
]

export function findPlace(id: string): Place | undefined {
  return PLACES.find((p) => p.id === id)
}
