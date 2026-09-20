// Google Maps has limited turn-by-turn navigation support in Korea, so all
// map links point to Naver Map / Kakao Map instead.
export function naverMapUrl(query?: string) {
  if (!query) return 'https://map.naver.com/v5/'
  return `https://map.naver.com/v5/search/${encodeURIComponent(query)}`
}

export function kakaoMapUrl(query?: string) {
  if (!query) return 'https://map.kakao.com/'
  return `https://map.kakao.com/?q=${encodeURIComponent(query)}`
}
