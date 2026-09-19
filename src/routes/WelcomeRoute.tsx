import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import TaegeukIcon from '../components/common/TaegeukIcon'
import { setUserName } from '../lib/storage'

export default function WelcomeRoute() {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setUserName(trimmed)
    navigate('/seoul')
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-bg px-6 py-12 text-center">
      <span className="mb-6 inline-flex rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted">
        העוזר האישי של שחר
      </span>

      <TaegeukIcon size={104} />

      <h1 className="mt-6 text-3xl font-bold text-ink">ברוכים הבאים לקוריאה</h1>
      <p className="mt-4 max-w-sm text-base leading-relaxed text-muted">
        שחר לא הצליח להגיע, אבל הוא שלח אותי - העוזר שלו. אני כאן לכל שאלה, וגם אם תרצו להוסיף משהו
        להיסטוריה.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm">
        <label htmlFor="user-name" className="mb-2 block text-start text-sm font-medium text-ink">
          מה השם הפרטי שלך?
        </label>
        <input
          id="user-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: נועה"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white transition-opacity disabled:opacity-40"
        >
          בואו נתחיל
        </button>
      </form>
    </div>
  )
}
