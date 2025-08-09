import { defineEventHandler, setResponseStatus } from 'h3'
import { getSupabaseServerClient } from '~~/server/utils/supabase'
import { createClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#imports'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  // Dev only safety
  if (process.env.NODE_ENV !== 'development') {
    setResponseStatus(event, 403)
    return { error: 'Forbidden' }
  }

  const supabase = getSupabaseServerClient(event)
  const config = useRuntimeConfig() as any
  const serviceKey = (config.supabaseServiceRole as string) || ''
  const url = (config.public?.supabase?.url as string) || ''
  const admin =
    serviceKey && url ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null

  // Create demo users
  // Create users in Auth first (to satisfy FK public.users.id → auth.users.id)
  const seedEmails = [
    { email: 'alice+dev@openground.test', password: 'password123!' },
    { email: 'bob+dev@openground.test', password: 'password123!' },
  ]

  const users: Array<{
    id: string
    display_name: string
    avatar_url: string | null
    phone: string | null
  }> = []

  let createdUsers = [] as any[]
  if (admin) {
    // Create auth users (id will exist in auth.users)
    for (const u of seedEmails) {
      const { data: created, error: adminAuthErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      })
      if (adminAuthErr) {
        setResponseStatus(event, 400)
        return { error: adminAuthErr.message }
      }
      const id = created.user?.id || randomUUID()
      const createdEmail = created.user?.email ?? u.email
      const displayName = createdEmail?.split('@')[0] || `user-${id.slice(0, 8)}`
      users.push({ id, display_name: displayName, avatar_url: null, phone: null })
    }

    const { data: cu, error: aerr } = await admin.from('users').insert(users).select('*')
    if (aerr) {
      setResponseStatus(event, 400)
      return { error: aerr.message }
    }
    createdUsers = cu || []
  } else {
    // No service role key → cannot create auth users; bail with clear guidance
    setResponseStatus(event, 400)
    return { error: 'Seeding requires SUPABASE_SERVICE_ROLE_KEY in .env for admin auth creation' }
  }

  const [alice, bob] = createdUsers!

  // Create demo listings
  const now = Date.now()
  const imgs = (seed: string) => [
    `https://picsum.photos/seed/${seed}-1/800/600`,
    `https://picsum.photos/seed/${seed}-2/800/600`,
  ]

  const listings = [
    {
      owner_id: alice.id,
      title: 'iPhone 13 Pro',
      description: 'Almost new, 256GB, graphite',
      price: 799.0,
      category: 'Electronics',
      lat: 35.681236,
      lng: 139.767125,
      images: imgs('iphone'),
    },
    {
      owner_id: alice.id,
      title: 'Mountain Bike',
      description: '26-inch, well maintained',
      price: 250.0,
      category: 'Vehicles',
      lat: 35.658034,
      lng: 139.701636,
      images: imgs('bike'),
    },
    {
      owner_id: bob.id,
      title: 'Sofa 3-seater',
      description: 'Comfortable fabric sofa',
      price: 120.0,
      category: 'Home',
      lat: 35.699739,
      lng: 139.772148,
      images: imgs('sofa'),
    },
    {
      owner_id: bob.id,
      title: 'PS5 Digital Edition',
      description: 'Boxed, includes one controller',
      price: 450.0,
      category: 'Electronics',
      lat: 35.710063,
      lng: 139.8107,
      images: imgs('ps5'),
    },
  ]

  const { data: createdListings, error: lerr } = await supabase
    .from('listings')
    .insert(listings)
    .select('id,title')

  if (lerr) {
    setResponseStatus(event, 400)
    return { error: lerr.message }
  }

  return { ok: true, users: createdUsers, listings: createdListings }
})
