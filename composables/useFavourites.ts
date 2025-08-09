export function useFavourites() {
  async function listFavouriteIds(): Promise<string[]> {
    const res = await $fetch<string[]>('/v1/favourites')
    return res
  }

  async function addFavourite(listingId: string): Promise<void> {
    await $fetch('/v1/favourites', { method: 'POST', body: { listing_id: listingId } })
  }

  async function removeFavourite(listingId: string): Promise<void> {
    await $fetch(`/v1/favourites/${listingId}`, { method: 'DELETE' })
  }

  async function toggleFavourite(listingId: string, currentSet: Set<string>): Promise<Set<string>> {
    const next = new Set(currentSet)
    if (next.has(listingId)) {
      await removeFavourite(listingId)
      next.delete(listingId)
    } else {
      await addFavourite(listingId)
      next.add(listingId)
    }
    return next
  }

  return { listFavouriteIds, addFavourite, removeFavourite, toggleFavourite }
}


