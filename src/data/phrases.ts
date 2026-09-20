import type { Phrase, SavedPlace } from '../types'

export const PHRASES: Phrase[] = [
  { he: 'שלום', ko: '안녕하세요', romanization: 'annyeonghaseyo' },
  { he: 'תודה', ko: '감사합니다', romanization: 'gamsahamnida' },
  { he: 'כמה זה עולה?', ko: '얼마예요?', romanization: 'eolmayeyo?' },
  { he: 'אני צריך עזרה', ko: '도와주세요', romanization: 'dowajuseyo' },
  { he: 'אני צמחוני', ko: '저는 채식주의자예요', romanization: 'jeoneun chaesikjuuija-yeyo' },
  { he: 'יש תפריט באנגלית?', ko: '영어 메뉴 있어요?', romanization: 'yeong-eo menu isseoyo?' },
]

export const SAVED_PLACES: SavedPlace[] = [
  { id: 'hotel', name: 'המלון שלי', detail: 'מיונגדונג, בסיס' },
  { id: 'myeongdong-station', name: 'תחנת מיונגדונג', detail: 'קו 4 יציאה 6, 3 דק\' הליכה' },
  { id: 'incheon-airport', name: 'נמל התעופה אינצ\'און', detail: 'טרמינל 1, כשעה ברכבת AREX' },
]
