'use client'

import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function Header() {
  const { user, signOut, isGuestMode } = useAuth()
  const t = useTranslations('nav')

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            OpenGround
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              {t('home')}
            </Link>
            {user && (
              <Link href="/favourites" className="text-gray-700 hover:text-blue-600">
                {t('favourites')}
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center space-x-3">
                {isGuestMode && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                    ゲストモード
                  </span>
                )}
                <Link href="/me/listings" className="btn btn-ghost">
                  {t('myListings')}
                </Link>
                <button onClick={signOut} className="btn btn-secondary">
                  {isGuestMode ? '終了' : t('signOut')}
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary">
                {t('signIn')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}