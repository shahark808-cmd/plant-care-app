import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-bg pb-24">
      {children}
      <BottomNav />
    </div>
  )
}
