import type { Listing } from '~~/shared/types'
import type { SearchListingsInput, CreateListingInput } from '~~/shared/validation'

export function useListings() {
  const base = '/v1'

  async function searchListings(params: Partial<SearchListingsInput> = {}): Promise<Listing[]> {
    const query = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v))
    }
    const res = await $fetch<Listing[]>(`/v1/listings?${query.toString()}`)
    return res
  }

  async function createListing(input: CreateListingInput): Promise<Listing> {
    const res = await $fetch<Listing>(`/v1/listings`, { method: 'POST', body: input })
    return res
  }

  async function getListing(id: string): Promise<Listing> {
    const res = await $fetch<Listing>(`/v1/listings/${id}`)
    return res
  }

  return { searchListings, createListing, getListing }
}
