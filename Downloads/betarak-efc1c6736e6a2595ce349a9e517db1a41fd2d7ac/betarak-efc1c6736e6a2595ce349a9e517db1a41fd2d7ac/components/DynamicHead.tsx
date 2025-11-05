'use client'

import { useEffect, useState } from 'react'

interface WebsiteSettings {
  favicon: string
  siteTitle: string
  siteDescription: string
}

export default function DynamicHead() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('🔄 DynamicHead: Fetching website settings...')
        const response = await fetch('/api/website-settings')
        const data = await response.json()
        
        console.log('📊 DynamicHead: Settings received:', data)
        
        if (data && (data.favicon || data.siteTitle || data.siteDescription)) {
          setSettings({
            favicon: data.favicon || '/favicon.ico',
            siteTitle: data.siteTitle || 'Betarak - Store Warehouse Solution',
            siteDescription: data.siteDescription || 'Betarak adalah penyedia solusi rak dan perlengkapan toko terlengkap di Indonesia'
          })
          console.log('✅ DynamicHead: Settings updated')
        }
      } catch (error) {
        console.error('❌ DynamicHead: Error fetching settings:', error)
      }
    }

    fetchSettings()

    // Listen for save events from admin
    const handleSettingsSaved = () => {
      console.log('🔔 DynamicHead: Settings saved event received, refreshing...')
      fetchSettings()
    }

    // Listen for WebSocket updates
    const handleWebSocketUpdate = (event: any) => {
      console.log('🔔 DynamicHead: WebSocket update received:', event.detail)
      if (event.detail?.type === 'WEBSITE_SETTINGS_UPDATED') {
        fetchSettings()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('website-settings-saved', handleSettingsSaved)
      window.addEventListener('websocket-update', handleWebSocketUpdate)
      
      return () => {
        window.removeEventListener('website-settings-saved', handleSettingsSaved)
        window.removeEventListener('websocket-update', handleWebSocketUpdate)
      }
    }
  }, [])

  useEffect(() => {
    if (settings) {
      // Update document title
      document.title = settings.siteTitle

      // Update favicon
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = settings.favicon

      // Update meta description
      let metaDescription = document.querySelector("meta[name='description']")
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', settings.siteDescription)

      // Update og:title
      let ogTitle = document.querySelector("meta[property='og:title']")
      if (!ogTitle) {
        ogTitle = document.createElement('meta')
        ogTitle.setAttribute('property', 'og:title')
        document.head.appendChild(ogTitle)
      }
      ogTitle.setAttribute('content', settings.siteTitle)

      // Update og:description
      let ogDescription = document.querySelector("meta[property='og:description']")
      if (!ogDescription) {
        ogDescription = document.createElement('meta')
        ogDescription.setAttribute('property', 'og:description')
        document.head.appendChild(ogDescription)
      }
      ogDescription.setAttribute('content', settings.siteDescription)
    }
  }, [settings])

  return null // This component doesn't render anything
}
