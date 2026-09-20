const KEYS = {
  userName: 'korea-trip:user-name',
  itineraryNotes: 'korea-trip:itinerary-notes',
} as const

export function getUserName(): string | null {
  try {
    return localStorage.getItem(KEYS.userName)
  } catch {
    return null
  }
}

export function setUserName(name: string) {
  try {
    localStorage.setItem(KEYS.userName, name)
  } catch {
    // localStorage unavailable (private browsing) - onboarding still works, just won't persist
  }
}

type ItineraryNotes = Record<string, string>

export function getItineraryNotes(): ItineraryNotes {
  try {
    const raw = localStorage.getItem(KEYS.itineraryNotes)
    return raw ? (JSON.parse(raw) as ItineraryNotes) : {}
  } catch {
    return {}
  }
}

export function setItineraryNote(itemId: string, text: string) {
  try {
    const notes = getItineraryNotes()
    notes[itemId] = text
    localStorage.setItem(KEYS.itineraryNotes, JSON.stringify(notes))
  } catch {
    // ignore persistence failures
  }
}
