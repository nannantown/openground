'use client'

import { useState, useRef } from 'react'
import { X, Camera, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface MessageImageUploadProps {
  onImagesSelect: (imageUrls: string[]) => void
  disabled?: boolean
  maxImages?: number
}

export function MessageImageUpload({
  onImagesSelect,
  disabled = false,
  maxImages = 3
}: MessageImageUploadProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `messages/${fileName}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      if (error.message?.includes('Bucket not found') || error.message?.includes('bucket_id')) {
        throw new Error('画像ストレージが設定されていません。管理者にお問い合わせください。')
      }
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    return publicUrl
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || disabled || files.length === 0) return

    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isImage && isValidSize
    })

    const filesToAdd = validFiles.slice(0, maxImages)
    setSelectedImages(filesToAdd)

    if (filesToAdd.length > 0) {
      setIsUploading(true)
      try {
        const uploadPromises = filesToAdd.map(async (file) => {
          const fileId = file.name + file.lastModified
          setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
          
          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
            }))
          }, 100)

          try {
            const url = await uploadImage(file)
            setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
            clearInterval(progressInterval)
            return url
          } catch (error) {
            clearInterval(progressInterval)
            throw error
          }
        })

        const imageUrls = await Promise.all(uploadPromises)
        onImagesSelect(imageUrls)
        setSelectedImages([])
        setUploadProgress({})
      } catch (error) {
        console.error('Upload error:', error)
        alert('画像のアップロードに失敗しました。もう一度お試しください。')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleButtonClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedImages.map((file, index) => (
            <div key={`upload-preview-${index}-${file.name}-${file.lastModified}`} className="relative">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-1">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={`progress-${fileId}`} className="text-xs">
              <div className="flex justify-between text-gray-600 mb-1">
                <span>アップロード中...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        data-testid="image-upload-button"
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            アップロード中...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            画像を添付
          </>
        )}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={disabled || isUploading}
        data-testid="image-upload"
      />
    </div>
  )
}