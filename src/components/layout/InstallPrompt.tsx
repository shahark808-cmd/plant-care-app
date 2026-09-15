import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'install-prompt-dismissed'

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari exposes this non-standard flag when launched from the home screen
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIosSafari() {
  const ua = window.navigator.userAgent
  const isIos = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
  return isIos && isSafari
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISSED_KEY) === '1'
    setVisible(!dismissed && isIosSafari() && !isStandalone())
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-3 bg-green-600 px-4 py-3 text-sm text-white">
      <p>
        כדי להתקין את האפליקציה למסך הבית: לחצו על כפתור השיתוף{' '}
        <span aria-hidden="true">⎋</span> ואז על &quot;הוסף למסך הבית&quot;.
      </p>
      <button
        type="button"
        className="shrink-0 text-lg leading-none"
        aria-label="סגירה"
        onClick={() => {
          window.localStorage.setItem(DISMISSED_KEY, '1')
          setVisible(false)
        }}
      >
        ✕
      </button>
    </div>
  )
}
