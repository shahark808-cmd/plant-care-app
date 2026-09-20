import type { CategoryKey } from '../../types'

const STYLES: Record<CategoryKey, string> = {
  food: 'bg-tag-food-bg text-tag-food-text',
  coffee: 'bg-tag-coffee-bg text-tag-coffee-text',
  shopping: 'bg-tag-shopping-bg text-tag-shopping-text',
  attraction: 'bg-tag-attraction-bg text-tag-attraction-text',
  view: 'bg-tag-view-bg text-tag-view-text',
}

const LABELS: Record<CategoryKey, string> = {
  food: 'אוכל',
  coffee: 'קפה',
  shopping: 'קניות',
  attraction: 'אטרקציה',
  view: 'נוף',
}

export default function CategoryTag({ category }: { category: CategoryKey }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[category]}`}>
      {LABELS[category]}
    </span>
  )
}
