'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export function Header() {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            OpenGround
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600">
              ホーム
            </Link>
            {user && (
              <Link href="/favourites" className="text-gray-700 hover:text-blue-600">
                お気に入り
              </Link>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/me/listings" className="btn btn-ghost">
                  マイリスト
                </Link>
                <button onClick={signOut} className="btn btn-secondary">
                  サインアウト
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary">
                サインイン
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}