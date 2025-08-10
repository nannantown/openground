import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { SearchForm } from '@/components/SearchForm'
import { ListingGrid } from '@/components/ListingGrid'
import { Suspense } from 'react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        <Hero />
        
        <section className="pb-12">
          <div className="container">
            <Suspense fallback={<div className="text-center py-8">検索フォームを読み込んでいます...</div>}>
              <SearchForm />
            </Suspense>
          </div>
        </section>
        
            <section className="pb-16">
      <div className="container">
        <ListingGrid />
      </div>
    </section>
      </main>
    </div>
  )
}