import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { SearchForm } from '@/components/SearchForm'
import { ListingGrid } from '@/components/ListingGrid'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main>
        <Hero />
        
        <section className="pb-12">
          <div className="container">
            <SearchForm />
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