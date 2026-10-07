import type { Food, MealItem, MealType } from '../types'
import { db, uid } from './db'

export async function addItems(date: string, type: MealType, items: Omit<MealItem, 'id'>[]) {
  const withIds = items.map((i) => ({ ...i, id: uid() }))
  const existing = (await db.meals.where('date').equals(date).toArray()).find((m) => m.type === type)
  if (existing) await db.meals.put({ ...existing, items: [...existing.items, ...withIds] })
  else await db.meals.add({ id: uid(), date, type, items: withIds })
}

export interface OffResult { food: Food } 

/** Look up a barcode in Open Food Facts (free, no key, community data, ODbL). */
export async function lookupBarcode(code: string): Promise<Food | 'not-found' | 'error'> {
  const clean = code.replace(/\D/g, '')
  if (clean.length < 8) return 'not-found'
  const cached = await db.foods.where('barcode').equals(clean).first()
  if (cached) return cached
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=product_name,product_name_he,nutriments`)
    if (!res.ok) return 'error'
    const data = await res.json()
    if (data.status !== 1 || !data.product) return 'not-found'
    const n = data.product.nutriments ?? {}
    const kcal = Number(n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : NaN))
    if (Number.isNaN(kcal)) return 'not-found'
    const food: Food = {
      id: `off-${clean}`, barcode: clean, source: 'off',
      name: data.product.product_name_he || data.product.product_name || `מוצר ${clean}`,
      per100: { kcal: Math.round(kcal), protein: Number(n.proteins_100g ?? 0), carbs: Number(n.carbohydrates_100g ?? 0), fat: Number(n.fat_100g ?? 0) },
    }
    await db.foods.put(food) // found once -> kept in the personal database
    return food
  } catch {
    return 'error'
  }
}
