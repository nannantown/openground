'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Upload, X, Camera, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  className?: string
}

export function ImageUpload({ 
  value = [], 
  onChange, 
  maxFiles = 5, 
  className 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  
  const t = useTranslations('imageUpload')
  const supabase = createClient()

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `listings/${fileName}`

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(error.message)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    return publicUrl
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (value.length + acceptedFiles.length > maxFiles) {
      setError(t('maxFilesError', { max: maxFiles }))
      return
    }

    setIsUploading(true)
    setError(null)
    
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const fileId = file.name + file.lastModified
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min((prev[fileId] || 0) + 10, 90)
          }))
        }, 200)

        try {
          const url = await uploadFile(file)
          setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
          clearInterval(progressInterval)
          return url
        } catch (error) {
          clearInterval(progressInterval)
          throw error
        }
      })

      const urls = await Promise.all(uploadPromises)
      onChange([...value, ...urls])
      setUploadProgress({})
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : t('uploadError'))
    } finally {
      setIsUploading(false)
    }
  }, [value, onChange, maxFiles, supabase, t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: maxFiles - value.length,
    disabled: isUploading || value.length >= maxFiles
  })

  const removeImage = (urlToRemove: string) => {
    onChange(value.filter(url => url !== urlToRemove))
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          isUploading && 'pointer-events-none opacity-50',
          value.length >= maxFiles && 'pointer-events-none opacity-30'
        )}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-blue-500" />
            <p className="text-sm text-muted-foreground mb-2">{t('uploading')}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {isDragActive ? t('dropFiles') : t('dragDropFiles')}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {t('supportedFormats')} • {t('maxFiles', { count: maxFiles - value.length })}
            </p>
            <Button 
              type="button" 
              variant="outline" 
              disabled={value.length >= maxFiles}
              className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
            >
              {t('selectFiles')}
            </Button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="bg-gray-100 rounded-md p-3">
              <div className="flex justify-between text-sm mb-1">
                <span>{t('uploading')}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {value.map((url, index) => (
            <div key={url} className="relative group">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={url}
                  alt={t('imagePreview', { index: index + 1 })}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(url)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  {t('mainImage')}
                </div>
              )}
            </div>
          ))}
          
          {/* Add More Button */}
          {value.length < maxFiles && (
            <div
              {...getRootProps()}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            >
              <input {...getInputProps()} />
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs text-gray-500">{t('addMore')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}