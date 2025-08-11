'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Upload } from 'lucide-react'
import Link from 'next/link'

const categories = ['Electronics', 'Home', 'Vehicles', 'Jobs', 'Fashion', 'Books', 'Sports', 'Other']

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default function NewListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const t = useTranslations('newListing')
  const tCommon = useTranslations('common')
  const tCategories = useTranslations('categories')
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'good',
    address: ''
  })

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/v1/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price ? parseFloat(formData.price) : null,
          category: formData.category,
          condition: formData.condition,
          location: formData.address
        }),
      })

      if (response.ok) {
        const listing = await response.json()
        router.push(`/listing/${listing.id}`)
      } else {
        throw new Error('商品の投稿に失敗しました')
      }
    } catch (error) {
      console.error('Error creating listing:', error)
      alert('商品の投稿に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/me/listings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                マイリストに戻る
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">新しい商品を投稿</h1>
            <p className="text-muted-foreground">
              不要になった商品を出品して、新しいオーナーを見つけましょう
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                商品情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">商品名 *</Label>
                  <Input
                    data-testid="title-input"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="例: iPhone 15 Pro Max 256GB"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">商品の説明</Label>
                  <Textarea
                    data-testid="description-input"
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="商品の状態、使用期間、付属品などを詳しく記載してください"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">価格 (円)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="10000"
                      min="0"
                    />
                    <p className="text-sm text-muted-foreground">
                      空欄の場合は「価格相談」として表示されます
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">カテゴリ *</Label>
                    <select
                      data-testid="category-select"
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">カテゴリを選択</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">商品の状態 *</Label>
                    <select
                      id="condition"
                      value={formData.condition}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="new">新品</option>
                      <option value="excellent">美品</option>
                      <option value="good">良好</option>
                      <option value="fair">普通</option>
                      <option value="poor">難あり</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">所在地</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="例: 東京都渋谷区"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>商品画像</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      画像をアップロード (最大5枚)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP形式に対応
                    </p>
                    <Button 
                      data-testid="image-upload-button"
                      type="button" 
                      variant="outline" 
                      className="mt-4 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400" 
                      disabled
                    >
                      ファイルを選択 (開発中)
                    </Button>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button 
                    data-testid="cancel-button"
                    type="button" 
                    variant="outline" 
                    asChild 
                    className="flex-1 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Link href="/me/listings">キャンセル</Link>
                  </Button>
                  <Button 
                    data-testid="submit-button"
                    type="submit" 
                    disabled={loading || !formData.title || !formData.category}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {loading ? '投稿中...' : '商品を投稿する'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}