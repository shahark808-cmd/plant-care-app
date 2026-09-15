import { useState } from 'react'
import { signOut } from '../lib/auth'
import { useHousehold } from '../hooks/useHousehold'

export default function SettingsRoute() {
  const { household } = useHousehold()
  const [signingOut, setSigningOut] = useState(false)

  const inviteLink = household ? `${window.location.origin}/join?code=${household.invite_code}` : ''

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">הגדרות</h1>

      {household && (
        <div className="mt-4 rounded-lg border border-stone-200 p-3 dark:border-stone-800">
          <p className="text-sm font-medium">{household.name}</p>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            קוד הזמנה: <span className="font-mono font-bold">{household.invite_code}</span>
          </p>
          <p className="mt-1 break-all text-xs text-stone-400 dark:text-stone-500" dir="ltr">
            {inviteLink}
          </p>
        </div>
      )}

      <p className="mt-4 text-stone-500 dark:text-stone-400">
        בהמשך יתווספו כאן מיקום הבית ושעת ההתראה היומית.
      </p>

      <button
        type="button"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true)
          signOut()
        }}
        className="mt-6 w-full rounded-lg border border-red-300 py-2.5 font-medium text-red-600 disabled:opacity-60 dark:border-red-900 dark:text-red-400"
      >
        {signingOut ? 'מתנתק...' : 'התנתקות'}
      </button>
    </div>
  )
}
