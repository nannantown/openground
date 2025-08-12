'use client'

import { useState, useEffect } from 'react'

export type ViewMode = 'grid' | 'list'

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    const savedViewMode = localStorage.getItem('listing-view-mode') as ViewMode
    if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
      setViewMode(savedViewMode)
    }
  }, [])

  // 表示モードの切り替えとローカルストレージへの保存
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('listing-view-mode', mode)
  }

  return {
    viewMode,
    setViewMode: toggleViewMode,
  }
}