import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createHousehold, joinHouseholdByCode } from '../lib/household'
import { useHousehold } from '../hooks/useHousehold'

type Mode = 'choose' | 'create' | 'join'

export default function OnboardingRoute() {
  const [searchParams] = useSearchParams()
  const codeFromLink = searchParams.get('code') ?? ''
  const [mode, setMode] = useState<Mode>(codeFromLink ? 'join' : 'choose')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState(codeFromLink)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [createdInviteCode, setCreatedInviteCode] = useState('')
  const { refresh } = useHousehold()
  const navigate = useNavigate()

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setErrorMessage('')
    try {
      const result = await createHousehold('הבית שלנו', displayName)
      await refresh()
      setCreatedInviteCode(result.invite_code)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'שגיאה לא ידועה')
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault()
    setStatus('saving')
    setErrorMessage('')
    try {
      await joinHouseholdByCode(code, displayName)
      await refresh()
      navigate('/')
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'שגיאה לא ידועה')
    }
  }

  if (createdInviteCode) {
    const inviteLink = `${window.location.origin}/join?code=${createdInviteCode}`
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold">הבית נוצר! 🎉</h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            שלחו לבן/בת הזוג את הקישור הזה כדי שיצטרפו (למשל בוואטסאפ):
          </p>
          <div className="mt-4 rounded-lg border border-stone-300 bg-stone-50 p-3 text-center font-mono text-sm dark:border-stone-700 dark:bg-stone-900">
            {inviteLink}
          </div>
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
            או פשוט קוד ההזמנה: <span className="font-mono font-bold">{createdInviteCode}</span>
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 w-full rounded-lg bg-green-600 py-2.5 font-medium text-white"
          >
            המשך לאפליקציה
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'choose') {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold">ברוכים הבאים 🌿</h1>
          <p className="mt-2 text-stone-500 dark:text-stone-400">
            כדי להתחיל, תצרו בית חדש או תצטרפו לבית שבן/בת הזוג כבר יצרו.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setMode('create')}
              className="rounded-lg bg-green-600 py-2.5 font-medium text-white"
            >
              יצירת בית חדש
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className="rounded-lg border border-stone-300 py-2.5 font-medium dark:border-stone-700"
            >
              הצטרפות עם קוד הזמנה
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isJoin = mode === 'join'

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={isJoin ? handleJoin : handleCreate} className="w-full max-w-sm">
        <h1 className="text-center text-xl font-bold">
          {isJoin ? 'הצטרפות לבית' : 'יצירת בית חדש'}
        </h1>

        <label htmlFor="displayName" className="mt-6 block text-sm font-medium">
          איך לקרוא לך? (יופיע ליד ההשקיות שלך)
        </label>
        <input
          id="displayName"
          type="text"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 dark:border-stone-700 dark:bg-stone-900"
          placeholder="לדוגמה: גיל"
        />

        {isJoin && (
          <>
            <label htmlFor="code" className="mt-4 block text-sm font-medium">
              קוד הזמנה
            </label>
            <input
              id="code"
              type="text"
              required
              dir="ltr"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-center font-mono tracking-widest dark:border-stone-700 dark:bg-stone-900"
              placeholder="XXXXXXXX"
              maxLength={8}
            />
          </>
        )}

        {status === 'error' && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="mt-4 w-full rounded-lg bg-green-600 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {status === 'saving' ? 'שומר...' : isJoin ? 'הצטרפות' : 'יצירת הבית'}
        </button>
        <button
          type="button"
          onClick={() => setMode('choose')}
          className="mt-2 w-full py-2 text-sm text-stone-500 dark:text-stone-400"
        >
          חזרה
        </button>
      </form>
    </div>
  )
}
