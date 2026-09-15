import { useCallback, useEffect, useState } from 'react'
import { getMyHousehold, type Household } from '../lib/household'
import { useSession } from './useSession'

export function useHousehold() {
  const { session } = useSession()
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!session) {
      setHousehold(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const result = await getMyHousehold()
    setHousehold(result)
    setLoading(false)
  }, [session])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { household, loading, refresh }
}
