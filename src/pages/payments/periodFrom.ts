export type Period = '30' | '90' | '365' | 'all'

/*
 * Borne basse du filtre de période, TRONQUÉE À LA JOURNÉE.
 * La précision milliseconde n'a aucun sens pour un filtre « 30 derniers jours »
 * et rendait la valeur différente à chaque rendu : la `queryKey` changeait sans
 * cesse et la page bouclait sur `GET /admin/payments` sans jamais s'afficher.
 */
export function periodFrom(period: Period): string | undefined {
  if (period === 'all') return undefined
  const d = new Date()
  d.setDate(d.getDate() - Number(period))
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}
