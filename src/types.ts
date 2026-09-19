export type CategoryKey = 'food' | 'coffee' | 'shopping' | 'attraction' | 'view'

export interface CategoryMeta {
  key: CategoryKey
  label: string
}

export interface Place {
  id: string
  name: string
  category: CategoryKey
}

export interface DistrictInfo {
  id: string
  nameHe: string
  nameEn: string
  bullets: string[]
  chipPlaceIds: string[]
}

export interface ItineraryItem {
  id: string
  time: string
  place: string
  placeKo?: string
  category: CategoryKey
  notePlaceholder: string
}

export interface InfoItem {
  title: string
  description: string
}

export interface InfoCategory {
  id: string
  title: string
  importance: number
  items: InfoItem[]
}

export interface Phrase {
  he: string
  ko: string
  romanization: string
}

export interface SavedPlace {
  id: string
  name: string
  detail: string
}
