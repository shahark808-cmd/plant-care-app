// Free, keyless translation via the MyMemory Translation API.
// https://mymemory.translated.net/doc/spec.php
export async function translateToKorean(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=he|ko`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error('שגיאת רשת בתרגום')
    const data = await res.json()
    const translated = data?.responseData?.translatedText
    if (!translated || data?.responseStatus === 403) {
      throw new Error('לא הצלחנו לתרגם כרגע, נסו שוב')
    }
    return translated as string
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('התרגום לקח יותר מדי זמן, נסו שוב')
    }
    if (err instanceof Error && err.message === 'לא הצלחנו לתרגם כרגע, נסו שוב') throw err
    throw new Error('אירעה שגיאה בתרגום, בדקו את החיבור לאינטרנט ונסו שוב')
  } finally {
    clearTimeout(timeout)
  }
}
