import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export default function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet stack" role="dialog" aria-modal aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row between">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגור"><X size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
