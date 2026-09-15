import { useParams } from 'react-router-dom'

export default function PlantDetailRoute() {
  const { plantId } = useParams()
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">פרטי צמח</h1>
      <p className="mt-2 text-stone-500 dark:text-stone-400">מזהה צמח: {plantId}</p>
    </div>
  )
}
