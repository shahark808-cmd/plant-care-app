import { useState, type FormEvent } from 'react'
import { sendMagicLink } from '../lib/auth'

export default function LoginRoute() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setErrorMessage('')
    try {
      await sendMagicLink(email)
      setStatus('sent')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'שגיאה לא ידועה')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold">בדקו את האימייל</h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            שלחנו קישור התחברות לכתובת {email}. לחצו עליו כדי להיכנס.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="text-center text-xl font-bold">התחברות</h1>
        <p className="mt-2 text-center text-stone-500 dark:text-stone-400">
          נשלח לכם קישור התחברות לאימייל — בלי צורך בסיסמה.
        </p>

        <label htmlFor="email" className="mt-6 block text-sm font-medium">
          כתובת אימייל
        </label>
        <input
          id="email"
          type="email"
          required
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-start dark:border-stone-700 dark:bg-stone-900"
          placeholder="name@example.com"
        />

        {status === 'error' && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="mt-4 w-full rounded-lg bg-green-600 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {status === 'sending' ? 'שולח...' : 'שליחת קישור התחברות'}
        </button>
      </form>
    </div>
  )
}
