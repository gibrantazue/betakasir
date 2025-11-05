'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useSocket } from '@/hooks/useSocket'
import { hasPermission, getAccessibleTabs, roleDisplayNames } from '@/lib/permissions'
import LogoDebug from '@/components/LogoDebug'
import {
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  ShoppingBagIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  PhotoIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import ImageUpload from '@/components/ImageUpload'

// Password Display Component
function PasswordDisplay({ password }: { password: string }) {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => {
    setIsVisible(!isVisible)
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <span className={`text-sm font-mono px-3 py-1 rounded-md border ${isVisible ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
          {isVisible ? password : '••••••••'}
        </span>
        <button
          onClick={toggleVisibility}
          className="text-blue-600 hover:text-blue-800 focus:outline-none p-1 hover:bg-blue-50 rounded transition-colors"
          title={isVisible ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {isVisible ? (
            <EyeIcon className="w-4 h-4" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.758 7.758M12 12l2.121-2.121M12 12L9.879 9.879m2.121 2.121l2.121-2.121" />
            </svg>
          )}
        </button>
        {isVisible && (
          <button
            onClick={() => navigator.clipboard.writeText(password)}
            className="text-green-600 hover:text-green-800 focus:outline-none p-1 hover:bg-green-50 rounded transition-colors"
            title="Copy password"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>
      <div className="text-xs text-gray-500 font-medium">
        🔑 Password untuk login
      </div>
      {isVisible && (
        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
          ✓ Dapat digunakan untuk login
        </div>
      )}
    </div>
  )
}

interface ProductVariant {
  id?: string
  name: string
  price: number
  originalPrice?: number
  isDefault: boolean
  sortOrder: number
  inStock: boolean
}

interface Product {
  id: number
  name: string
  description?: string
  price: number
  originalPrice?: number
  priceRange?: { min: number; max: number }
  hasVariants?: boolean
  variants?: ProductVariant[]
  category: string
  image?: string
  rating?: number
  reviews?: number
  inStock?: boolean
  tags?: string[]
  features?: string[]
  createdAt?: string
  updatedAt?: string
}

interface Order {
  id: string
  orderNumber?: string
  customerName: string
  customerFirstName?: string
  customerLastName?: string
  customerEmail?: string
  customerPhone?: string
  customerCompany?: string
  customerAddress?: string
  customerCity?: string
  customerState?: string
  customerPostalCode?: string
  paymentMethod?: string
  specialInstructions?: string
  totalAmount: number
  status: string
  createdAt: string
  itemsCount?: number
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  subject: string
  message: string
  inquiryType: string
  status: string
  createdAt: string
}

interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  password?: string
  role: string
  createdAt: string
}

interface Profile {
  id: string
  title: string
  description?: string
  category: string
  image: string
  images: string
  status: string
  client?: string
  location?: string
  year?: number
  uploadDate?: string
  tags: string
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  productCount?: number
}


interface WebsiteSettings {
  id: string
  // Logo & Company Info
  logoUrl: string              // Footer logo
  logoZoom: number            // Footer logo zoom (50-200%)
  logoHeaderUrl: string       // Header logo
  logoHeaderZoom: number      // Header logo zoom (50-200%)
  companyName: string
  companyDescription: string

  // Favicon & SEO
  favicon: string
  siteTitle: string
  siteDescription: string

  // Contact Information
  address: string
  phone: string
  whatsapp: string
  email: string

  // Hero Section Contact Info
  heroWhatsapp: string
  heroEmail: string
  heroOperatingHours: string

  // Payment Settings
  paymentWhatsappNumber: string

  // Operating Hours
  mondayFriday: string
  saturday: string
  sunday: string

  // Service Areas
  serviceAreas: string
  specialNote: string

  // Social Media
  facebookUrl: string
  instagramUrl: string
  youtubeUrl: string

  // Copyright
  copyrightText: string

  createdAt: string
  updatedAt: string
}

interface Testimonial {
  id: string
  name: string
  position?: string
  company?: string
  comment: string
  image?: string
  isActive: boolean
  isFeatured: boolean
  location?: string
  project?: string
}

interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  employmentType: string // 'full-time', 'part-time', 'contract', 'internship'
  description: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  salary?: string
  slug: string
  sortOrder: number
  isActive: boolean
  postedDate: string
  closingDate?: string
  createdAt: string
  updatedAt: string
}

interface CareerSettings {
  isHiring: boolean
  companyDescription: string
  whyJoinUs: string[]
  applicationInstructions: string
  hrEmail: string
  updatedAt: string
}

interface ContactSettings {
  id: string
  // Contact Information
  address: string
  phone: string
  whatsapp: string
  email: string

  // Operating Hours
  operatingHours: string

  // Contact Buttons
  whatsappButtonText: string
  phoneButtonText: string

  // Map Settings
  mapEmbedUrl?: string
  mapTitle: string

  // FAQ Section
  faqTitle: string
  faqItems: Array<{ question: string; answer: string }>

  // Page Content
  pageTitle: string
  pageDescription: string

  createdAt: string
  updatedAt: string
}

interface Advertisement {
  id: string
  title: string
  description?: string
  type: string
  position: string
  image: string
  link: string
  isActive: boolean
  startDate?: string
  endDate?: string
  priority: number
  createdAt: string
  updatedAt: string
}

interface SequelArticle {
  id: string
  title: string
  subtitle?: string
  excerpt: string
  content: string
  image: string
  slug: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

type FormData = Partial<Product & Order & Contact & User & Profile & Category & WebsiteSettings & ContactSettings & Testimonial & JobPosting & CareerSettings & Advertisement & SequelArticle & { password?: string }>
type ModalType = 'create' | 'edit' | 'view' | 'delete'
type EntityType = 'products' | 'orders' | 'contacts' | 'users' | 'profiles' | 'categories' | 'advertisements' | 'website-settings' | 'contact-settings' | 'testimonials' | 'sequel' | 'storyline'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const { socket, isConnected, joinAdminRoom } = useSocket()

  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null)
  const [contactSettings, setContactSettings] = useState<ContactSettings | null>(null)
  const [profileSettings, setProfileSettings] = useState<any | null>(null)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [sequelArticles, setSequelArticles] = useState<any[]>([])
  const [sequelSettings, setSequelSettings] = useState<any>(null)
  const [storyline, setStoryline] = useState<any>(null)
  const [careerSettings, setCareerSettings] = useState<any>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string>('')

  // Debug WebSocket connection
  useEffect(() => {
    console.log('🔌 WebSocket Status Debug:', {
      socket: !!socket,
      isConnected,
      socketId: socket?.id,
      listeners: socket?.listeners ? Object.keys(socket.listeners('admin_update') || {}).length : 0
    })
  }, [socket, isConnected])

  // Debug categories state changes
  useEffect(() => {
    console.log('📊 Categories State Debug:', {
      count: categories.length,
      categories: categories.map(c => ({ id: c.id, name: c.name }))
    })
  }, [categories])

  // Listen for website settings updates via WebSocket
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleWebsiteSettingsUpdate = (updatedSettings: WebsiteSettings) => {
      console.log('🎨 Admin received website settings update:', updatedSettings)
      setWebsiteSettings(updatedSettings)
    }

    console.log('🔌 Admin: Setting up website-settings-updated listener')
    socket.on('website-settings-updated', handleWebsiteSettingsUpdate)

    return () => {
      console.log('🔌 Admin: Cleaning up website-settings-updated listener')
      socket.off('website-settings-updated', handleWebsiteSettingsUpdate)
    }
  }, [socket, isConnected])

  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<ModalType>('create')
  const [currentEntity, setCurrentEntity] = useState<EntityType>('products')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Test WebSocket connection
  const testWebSocket = () => {
    console.log('🧪 Testing WebSocket connection...')
    console.log('📊 WebSocket Status:', {
      socket: !!socket,
      isConnected,
      socketId: socket?.id,
      timestamp: new Date().toISOString()
    })

    if (socket && isConnected) {
      console.log('✅ WebSocket is connected, testing admin room join...')
      joinAdminRoom()
    } else {
      console.error('❌ WebSocket is not connected!')
    }
  }

  // Test contact notification
  const testContactNotification = () => {
    console.log('Testing WebSocket connection...')
    console.log('WebSocket status:', { socket: !!socket, isConnected })

    if (socket && isConnected) {
      console.log('WebSocket connected, emitting test event...')
      socket.emit('admin_update', {
        action: 'category_created',
        category: { id: 'test-' + Date.now(), name: 'Test Category', productCount: 0 }
      })
    } else {
      console.log('WebSocket not connected')
    }
  }

  // Stats dengan fallback untuk mencegah error
  const stats = [
    {
      name: 'Total Produk',
      value: products?.length || 0,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Pesanan',
      value: orders?.length || 0,
      icon: ChartBarIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Pendapatan Bulan Ini',
      value: `Rp ${Math.floor((orders || []).reduce((total, order) => total + order.totalAmount, 0)).toLocaleString('id-ID')}`,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Inquiry Baru',
      value: (contacts || []).filter(c => c.status === 'NEW').length,
      icon: UsersIcon,
      color: 'bg-purple-500'
    }
  ]

  // Request notification permissions on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Define fetchContacts as useCallback to avoid dependency issues
  const fetchContacts = useCallback(async () => {
    try {
      console.log('🔍 Fetching contacts from API...')
      const response = await fetch('/api/contact')
      const data = await response.json()
      console.log('📊 Contacts API response:', {
        success: data.success,
        count: data.data?.contacts?.length || 0,
        timestamp: new Date().toISOString()
      })

      if (data.success) {
        setContacts(data.data.contacts)
        console.log('✅ Contacts updated in state, total:', data.data.contacts.length)
      } else {
        console.error('❌ Contacts API returned error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching contacts:', error)
    }
  }, [])

  // Auto-join admin room when WebSocket connects
  useEffect(() => {
    if (socket && isConnected && joinAdminRoom) {
      console.log('🔗 WebSocket connected, auto-joining admin room...')
      setTimeout(() => {
        joinAdminRoom()
      }, 500) // Small delay to ensure connection is stable
    }
  }, [socket, isConnected, joinAdminRoom])

  // Fetch data
  useEffect(() => {
    fetchProducts()
    fetchOrders()
    fetchContacts()
    fetchUsers()
    fetchProfiles()
    fetchCategories()
    fetchAdvertisements()
    fetchWebsiteSettings()
    fetchContactSettings()
    fetchProfileSettings()
    fetchTestimonials()
    fetchSequel()
    fetchStoryline()
  }, [])

  // Real-time WebSocket updates for all entities including orders
  useEffect(() => {
    console.log('🔌 WebSocket connection status:', {
      socket: !!socket,
      isConnected,
      socketId: socket?.id,
      timestamp: new Date().toISOString()
    })

    if (!socket || !isConnected) {
      console.log('⚠️ WebSocket not ready, skipping listener setup')
      return
    }

    console.log('✅ Setting up WebSocket listeners for admin updates')
    console.log('🎯 Admin dashboard WebSocket setup initiated')

    // Handle all admin notifications (orders, contacts, etc.)
    const handleAdminNotifications = (data: any) => {
      console.log('📢 Admin notification received:', data.type, data)

      // Handle order notifications
      if (data.type === 'ORDER_CREATED') {
        console.log('🆕 Adding new order to admin dashboard:', data.data.orderNumber)

        // Transform order data to match admin table format
        const orderForAdmin = {
          id: data.data.id || data.data.orderNumber,
          customerName: `${data.data.customerInfo.firstName} ${data.data.customerInfo.lastName}`,
          totalAmount: data.data.totalAmount * 100, // Convert back to cents for consistency
          status: data.data.status.toUpperCase(),
          createdAt: data.data.createdAt
        }

        setOrders(prev => {
          // Check if order already exists to prevent duplicates
          const exists = prev.some(o => o.id === orderForAdmin.id)
          if (exists) {
            console.log('⚠️ Order already exists, updating instead')
            return prev.map(o => o.id === orderForAdmin.id ? orderForAdmin : o)
          }
          console.log('✅ Adding new order to list')
          return [orderForAdmin, ...prev]
        })

        // Show browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Pesanan Baru!', {
            body: `Pesanan dari ${orderForAdmin.customerName} - ${data.data.orderNumber}`,
            icon: '/logo.jpg'
          })
        }
      }

      // Handle contact notifications  
      else if (data.type === 'NOTIFICATION' && data.data?.type === 'new_contact') {
        console.log('📧 New contact inquiry received:', data.data)
        console.log('📧 Contact ID:', data.data.contactId, 'Title:', data.data.title)

        // Dual approach for maximum reliability:
        // 1. Immediately fetch updated contacts list
        console.log('🔄 Fetching updated contacts for real-time display')
        fetchContacts()

        // 2. Force a small delay then fetch again to ensure we get the latest data
        setTimeout(() => {
          console.log('🔄 Secondary fetch to ensure data consistency')
          fetchContacts()
        }, 500)

        // Show browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
          console.log('🔔 Showing browser notification for new inquiry')
          new Notification('Inquiry Baru!', {
            body: data.data.message || 'Ada inquiry baru dari pelanggan',
            icon: '/logo.jpg'
          })
        }

        // Log success for debugging
        console.log('✅ Contact notification processed successfully')
      }
    }

    const handleAllAdminUpdates = (data: any) => {
      console.log('🔄 Real-time admin update received:', data)
      console.log('📋 Current entity:', currentEntity)
      console.log('🎯 Data action:', data.action)

      // Handle category updates
      if (data.action === 'category_created' && data.category) {
        console.log('➕ Adding new category:', data.category.name)
        console.log('📊 Category data:', data.category)
        setCategories(prev => {
          console.log('🔍 Current categories before update:', prev.length)
          // Check if category already exists to prevent duplicates
          const exists = prev.some(c => c.id === data.category.id)
          if (exists) {
            console.log('⚠️ Category already exists, updating instead')
            const updated = prev.map(c => c.id === data.category.id ? data.category : c)
            console.log('✅ Categories after update:', updated.length)
            return updated
          }
          const newList = [data.category, ...prev]
          console.log('✅ Categories after add:', newList.length)
          return newList
        })
      }

      if (data.action === 'category_updated' && data.category) {
        console.log('✏️ Updating category:', data.category.name)
        console.log('📊 Updated category data:', data.category)
        setCategories(prev => {
          console.log('🔍 Current categories before update:', prev.length)
          const updated = prev.map(c => c.id === data.category.id ? data.category : c)
          console.log('✅ Categories after update:', updated.length)
          return updated
        })
      }

      if (data.action === 'category_deleted' && data.categoryId) {
        console.log('🗑️ Deleting category:', data.categoryId)
        setCategories(prev => {
          console.log('🔍 Current categories before delete:', prev.length)
          const filtered = prev.filter(c => c.id !== data.categoryId)
          console.log('✅ Categories after delete:', filtered.length)
          return filtered
        })
      }

      // Handle product updates
      if (data.action === 'product_created' && data.product) {
        console.log('➕ Adding new product:', data.product.name)
        setProducts(prev => {
          const exists = prev.some(p => p.id === data.product.id)
          if (exists) return prev.map(p => p.id === data.product.id ? data.product : p)
          return [data.product, ...prev]
        })
      }

      if (data.action === 'product_updated' && data.product) {
        console.log('✏️ Updating product:', data.product.name)
        setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p))
      }

      if (data.action === 'product_deleted' && data.productId) {
        console.log('🗑️ Deleting product:', data.productId)
        setProducts(prev => prev.filter(p => p.id !== data.productId))
      }

      // Handle job posting updates
      if (data.action === 'sequel_created' && data.sequel) {
        console.log('➕ Adding new job posting:', data.sequel.title)
        setSequelArticles(prev => {
          const exists = prev.some(a => a.id === data.sequel.id)
          if (exists) return prev.map(a => a.id === data.sequel.id ? data.sequel : a)
          return [data.sequel, ...prev].sort((a, b) => a.sortOrder - b.sortOrder)
        })
      }

      if (data.action === 'sequel_updated' && data.sequel) {
        console.log('✏️ Updating job posting:', data.sequel.title)
        setSequelArticles(prev => prev.map(a => a.id === data.sequel.id ? data.sequel : a).sort((a, b) => a.sortOrder - b.sortOrder))
      }

      if (data.action === 'sequel_deleted' && data.sequelId) {
        console.log('🗑️ Deleting job posting:', data.sequelId)
        setSequelArticles(prev => prev.filter(a => a.id !== data.sequelId))
      }
    }

    // Note: Admin room joining is handled by auto-join useEffect above

    // Listen for admin room join confirmation
    socket.on('joined-admin', (data) => {
      console.log('🎉 Successfully joined admin room:', data)
    })

    // Listen for admin notifications (orders, contacts, etc.)
    console.log('🎧 Registering WebSocket listener for admin-notification')
    socket.on('admin-notification', handleAdminNotifications)

    // Listen for all admin updates
    console.log('🎧 Registering WebSocket listener for admin_update')
    socket.on('admin_update', handleAllAdminUpdates)

    return () => {
      console.log('🔇 Cleaning up WebSocket listeners')
      socket.off('joined-admin')
      socket.off('admin-notification', handleAdminNotifications)
      socket.off('admin_update', handleAllAdminUpdates)
    }
  }, [socket, isConnected, fetchContacts])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      console.log('📥 Fetching orders from API...')
      const response = await fetch('/api/orders')
      const data = await response.json()
      console.log('📊 Orders API response:', data)
      if (data.success) {
        console.log(`✅ Found ${data.data.length} orders in API`)
        setOrders(data.data)
      } else {
        console.log('❌ Orders API returned error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error)
    }
  }


  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      // Set fallback admin user
      setUsers([{
        id: '1',
        username: 'admin',
        email: 'admin@betarak.com',
        firstName: 'Admin',
        lastName: 'Betarak',
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      }])
    }
  }

  const fetchProfiles = async () => {
    try {
      console.log('🏢 Fetching profile data...')
      const response = await fetch('/api/profile')
      const data = await response.json()
      console.log('📊 Profile API response:', data)
      if (data.success) {
        console.log('✅ Found profiles:', data.data.length)
        setProfiles(data.data)
      } else {
        console.error('❌ Profile API error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching profiles:', error)
    }
  }

  const fetchCategories = async () => {
    console.log('🏷️ Loading categories...')

    // Try to fetch from API first
    try {
      console.log('🔄 Attempting API fetch...')
      const response = await fetch('/api/categories')
      const data = await response.json()
      console.log('📊 Categories API response:', data)
      if (data.success) {
        console.log('✅ Found API categories:', data.data.length)
        setCategories(data.data) // Use API data regardless of length
      } else {
        throw new Error('API returned false success')
      }
    } catch (error) {
      console.log('ℹ️ API not available, using fallback data:', error)
      // Only use fallback if API completely fails
      const fallbackCategories = getFallbackCategories()
      setCategories(fallbackCategories)
      console.log('✅ Loaded fallback categories:', fallbackCategories.length)
    }
  }

  const getFallbackCategories = () => {
    return [
      {
        id: 'rak-minimarket',
        name: 'Rak Minimarket',
        slug: 'rak-minimarket',
        description: 'Rak khusus untuk minimarket dengan berbagai ukuran dan kapasitas',
        isActive: true,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        productCount: 2
      },
      {
        id: 'meja-kasir',
        name: 'Meja Kasir',
        slug: 'meja-kasir',
        description: 'Meja kasir modern dan multifungsi untuk berbagai jenis toko',
        isActive: true,
        sortOrder: 2,
        createdAt: new Date().toISOString(),
        productCount: 2
      },
      {
        id: 'rak-rokok',
        name: 'Rak Rokok',
        slug: 'rak-rokok',
        description: 'Rak display khusus untuk produk rokok dengan sistem yang menarik',
        isActive: true,
        sortOrder: 3,
        createdAt: new Date().toISOString(),
        productCount: 1
      },
      {
        id: 'rak-gudang',
        name: 'Rak Gudang',
        slug: 'rak-gudang',
        description: 'Rak gudang heavy duty untuk penyimpanan dengan kapasitas besar',
        isActive: true,
        sortOrder: 4,
        createdAt: new Date().toISOString(),
        productCount: 1
      },
      {
        id: 'rak-serbaguna',
        name: 'Rak Serbaguna',
        slug: 'rak-serbaguna',
        description: 'Rak serbaguna untuk berbagai keperluan display dan penyimpanan',
        isActive: true,
        sortOrder: 5,
        createdAt: new Date().toISOString(),
        productCount: 0
      }
    ]
  }

  const fetchAdvertisements = async () => {
    try {
      console.log('📢 Fetching advertisements...')
      const response = await fetch('/api/advertisements')
      const data = await response.json()
      console.log('📊 Advertisements API response:', data)
      if (data.success) {
        console.log('✅ Advertisements loaded successfully')
        setAdvertisements(data.data || [])
      } else {
        console.error('❌ Advertisements API error:', data.error)
        setAdvertisements([])
      }
    } catch (error) {
      console.error('❌ Error fetching advertisements:', error)
      setAdvertisements([])
    }
  }

  const fetchWebsiteSettings = async () => {
    try {
      console.log('🎨 Fetching website settings...')
      const response = await fetch('/api/website-settings')
      const data = await response.json()
      console.log('📊 Website Settings API response:', data)
      if (response.ok) {
        console.log('✅ Website settings loaded successfully')
        setWebsiteSettings(data)
      } else {
        console.error('❌ Website settings API error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching website settings:', error)
    }
  }

  const fetchContactSettings = async () => {
    try {
      console.log('📋 Fetching contact settings...')
      const response = await fetch('/api/contact-settings')
      const data = await response.json()
      console.log('📊 Contact Settings API response:', data)
      if (data.success) {
        console.log('✅ Contact settings loaded successfully')
        setContactSettings(data.data)
      } else {
        console.error('❌ Contact settings API error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching contact settings:', error)
    }
  }

  const fetchProfileSettings = async () => {
    try {
      console.log('📋 Fetching profile settings...')
      const response = await fetch('/api/profile-settings')
      const data = await response.json()
      console.log('📊 Profile Settings API response:', data)
      if (data.success) {
        console.log('✅ Profile settings loaded successfully')
        setProfileSettings(data.data)
      } else {
        console.error('❌ Profile settings API error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching profile settings:', error)
    }
  }

  const fetchTestimonials = async () => {
    try {
      console.log('⭐ Fetching testimonials...')
      const response = await fetch('/api/testimonials')
      const data = await response.json()
      console.log('📊 Testimonials API response:', data)
      if (response.ok) {
        console.log('✅ Testimonials loaded successfully')
        setTestimonials(data.data || [])
      } else {
        console.error('❌ Testimonials API error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching testimonials:', error)
    }
  }

  const fetchSequel = async () => {
    try {
      console.log('📋 Fetching job postings...')
      const jobsResponse = await fetch('/api/career')
      const jobsData = await jobsResponse.json()

      const settingsResponse = await fetch('/api/career?type=settings')
      const settingsData = await settingsResponse.json()

      console.log('📊 Career API response:', { jobsData, settingsData })

      if (jobsData.success) {
        console.log('✅ Job postings loaded successfully')
        setSequelArticles(jobsData.data.jobs || [])
      }

      if (settingsData.success) {
        console.log('✅ Career settings loaded successfully')
        setSequelSettings(settingsData.data)
      }
    } catch (error) {
      console.error('❌ Error fetching career data:', error)
    }
  }

  const fetchStoryline = async () => {
    try {
      console.log('📖 Fetching storyline...')
      const response = await fetch('/api/storyline')
      const data = await response.json()
      console.log('📊 Storyline API response:', data)
      if (data.success) {
        console.log('✅ Storyline loaded successfully')
        setStoryline(data.data)
      } else {
        console.error('❌ Storyline API error:', data.error)
      }
    } catch (error) {
      console.error('❌ Error fetching storyline:', error)
    }
  }

  const handleSaveCareerSettings = async () => {
    if (!careerSettings) {
      alert('Tidak ada pengaturan karir untuk disimpan')
      return
    }

    try {
      console.log('💾 Saving career settings...', careerSettings)
      setLoading(true)

      const response = await fetch('/api/careers?type=settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(careerSettings)
      })

      const data = await response.json()
      console.log('📊 Career settings save response:', data)

      if (response.ok) {
        console.log('✅ Career settings saved successfully')
        setCareerSettings(data.data)

        // Show success message
        alert('✅ Pengaturan karir berhasil disimpan!\n\nPerubahan akan tampil di halaman careers dalam beberapa detik.')

        // Force refresh sequel data to ensure sync
        await fetchSequel()

      } else {
        console.error('❌ Error saving career settings:', data.error)
        alert('❌ Gagal menyimpan pengaturan karir: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error saving career settings:', error)
      alert('❌ Terjadi kesalahan saat menyimpan pengaturan karir')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSequelSettings = async () => {
    if (!sequelSettings) {
      alert('Tidak ada pengaturan karir untuk disimpan')
      return
    }

    try {
      console.log('💾 Saving career settings...', sequelSettings)
      setLoading(true)

      const response = await fetch('/api/career?type=settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sequelSettings)
      })

      const data = await response.json()
      console.log('📊 Career settings save response:', data)

      if (data.success) {
        console.log('✅ Career settings saved successfully')
        setSequelSettings(data.data)
        alert('✅ Pengaturan Karir berhasil disimpan!')
        await fetchSequel()
      } else {
        console.error('❌ Error saving career settings:', data.error)
        alert('❌ Gagal menyimpan pengaturan: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error saving career settings:', error)
      alert('❌ Terjadi kesalahan saat menyimpan pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStoryline = async (autoSave = false) => {
    if (!storyline) {
      if (!autoSave) alert('Tidak ada storyline untuk disimpan')
      return false
    }

    try {
      console.log('💾 Saving storyline...', {
        autoSave,
        image: storyline.image,
        catalogImages: storyline.catalogImages,
        fullData: storyline
      })

      if (autoSave) {
        setAutoSaving(true)
        setSaveStatus('💾 Menyimpan gambar...')
      } else {
        setLoading(true)
      }

      const response = await fetch('/api/storyline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storyline)
      })

      const data = await response.json()
      console.log('📊 Storyline save response:', data)

      if (data.success) {
        console.log('✅ Storyline saved successfully', {
          savedImage: data.data.image,
          savedCatalogImages: data.data.catalogImages
        })
        setStoryline(data.data)

        // Broadcast real-time update via WebSocket
        if (socket && isConnected) {
          console.log('📡 Broadcasting storyline update via WebSocket')
          socket.emit('admin_update', {
            action: 'storyline_updated',
            storyline: data.data,
            timestamp: new Date().toISOString()
          })
        }

        if (!autoSave) {
          alert('✅ Storyline berhasil disimpan!\n\nPerubahan akan tampil di homepage dalam beberapa detik.')
        } else {
          setSaveStatus('✅ Gambar berhasil disimpan!')
          console.log('🔄 Auto-save completed successfully')
          // Clear success message after 3 seconds
          setTimeout(() => setSaveStatus(''), 3000)
        }
        await fetchStoryline()
        return true

      } else {
        console.error('❌ Error saving storyline:', data.error)
        if (autoSave) {
          setSaveStatus('❌ Gagal menyimpan: ' + (data.error || 'Unknown error'))
          setTimeout(() => setSaveStatus(''), 5000)
        } else {
          alert('❌ Gagal menyimpan storyline: ' + (data.error || 'Unknown error'))
        }
        return false
      }
    } catch (error) {
      console.error('❌ Error saving storyline:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      if (autoSave) {
        setSaveStatus('❌ Error: ' + errorMsg)
        setTimeout(() => setSaveStatus(''), 5000)
      } else {
        alert('❌ Terjadi kesalahan saat menyimpan storyline: ' + errorMsg)
      }
      return false
    } finally {
      if (autoSave) {
        setAutoSaving(false)
      } else {
        setLoading(false)
      }
    }
  }


  const handleSaveWebsiteSettings = async () => {
    if (!websiteSettings) return

    try {
      console.log('🎨 Saving website settings...')
      setLoading(true)

      const response = await fetch('/api/website-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(websiteSettings)
      })

      const data = await response.json()
      console.log('📊 Website Settings Save response:', data)

      if (response.ok) {
        console.log('✅ Website settings saved successfully')
        setWebsiteSettings(data)

        // Trigger event untuk DynamicHead
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('website-settings-saved', { detail: data }))
          console.log('🔔 Dispatched website-settings-saved event')
        }

        // Show success message
        alert('✅ Pengaturan website berhasil disimpan!\n\nRefresh halaman untuk melihat perubahan favicon & title.')

      } else {
        console.error('❌ Error saving website settings:', data.error)
        alert('❌ Gagal menyimpan pengaturan: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error saving website settings:', error)
      alert('Terjadi kesalahan saat menyimpan pengaturan')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContactSettings = async () => {
    if (!contactSettings) return

    try {
      console.log('📋 Saving contact settings...')
      setLoading(true)

      const response = await fetch('/api/contact-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactSettings)
      })

      const data = await response.json()
      console.log('📊 Contact Settings Save response:', data)

      if (data.success) {
        console.log('✅ Contact settings saved successfully')
        setContactSettings(data.data)

        // Show success message
        alert('✅ Pengaturan kontak berhasil disimpan!\n\nPerubahan akan tampil di halaman kontak dalam beberapa detik.')

        // Force refresh contact settings to ensure sync
        await fetchContactSettings()

      } else {
        console.error('❌ Error saving contact settings:', data.error)
        alert('❌ Gagal menyimpan pengaturan kontak: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error saving contact settings:', error)
      alert('❌ Terjadi kesalahan saat menyimpan pengaturan kontak')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfileSettings = async () => {
    if (!profileSettings) return

    try {
      console.log('📋 Saving profile settings...')
      setLoading(true)

      const formData = new FormData()
      
      // Add text fields
      Object.keys(profileSettings).forEach(key => {
        if (key !== 'heroImage' && key !== 'visionImage' && key !== 'heroImageFile' && key !== 'visionImageFile' && key !== 'heroImagePreview' && key !== 'visionImagePreview' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          formData.append(key, profileSettings[key])
        }
      })

      // Check if images should be deleted (set to null in state)
      if (profileSettings.heroImage === null && !profileSettings.heroImageFile) {
        formData.append('deleteHeroImage', 'true')
      }
      if (profileSettings.visionImage === null && !profileSettings.visionImageFile) {
        formData.append('deleteVisionImage', 'true')
      }

      // Add image files if they exist
      if (profileSettings.heroImageFile) {
        formData.append('heroImage', profileSettings.heroImageFile)
      }
      if (profileSettings.visionImageFile) {
        formData.append('visionImage', profileSettings.visionImageFile)
      }

      const response = await fetch('/api/profile-settings', {
        method: 'PUT',
        body: formData
      })

      const data = await response.json()
      console.log('📊 Profile Settings Save response:', data)

      if (data.success) {
        console.log('✅ Profile settings saved successfully')
        // Update state with saved data from API (includes new image URLs)
        const updatedSettings = {
          ...data.data,
          // Clear preview files after successful save
          heroImageFile: null,
          heroImagePreview: null,
          visionImageFile: null,
          visionImagePreview: null
        }
        setProfileSettings(updatedSettings)
        alert('✅ Pengaturan profile berhasil disimpan!\n\nPerubahan akan tampil di halaman profile secara realtime.')
      } else {
        console.error('❌ Error saving profile settings:', data.error)
        alert('❌ Gagal menyimpan pengaturan profile: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error saving profile settings:', error)
      alert('❌ Terjadi kesalahan saat menyimpan pengaturan profile')
    } finally {
      setLoading(false)
    }
  }

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('Ukuran file terlalu besar. Maksimal 2MB.')
      return
    }

    try {
      console.log('📤 Uploading logo file...')
      setLoading(true)

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success && data.logoUrl) {
        console.log('✅ Logo uploaded successfully:', data.logoUrl)

        // Save logo URL to database
        try {
          const saveResponse = await fetch('/api/website-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoUrl: data.logoUrl })
          })

          if (saveResponse.ok) {
            console.log('✅ Logo URL saved to database')
            // Update local state
            setWebsiteSettings(prev => prev ? ({
              ...prev,
              logoUrl: data.logoUrl
            }) : null)
            alert('Logo berhasil diupload dan disimpan!')
          } else {
            throw new Error('Failed to save logo URL to database')
          }
        } catch (saveError) {
          console.error('❌ Error saving logo URL:', saveError)
          alert('Logo diupload tapi gagal disimpan ke database')
        }
      } else {
        console.error('❌ Logo upload failed:', data.error)
        alert('Gagal mengupload logo: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error uploading logo:', error)
      alert('Terjadi kesalahan saat mengupload logo')
    } finally {
      setLoading(false)
    }
  }

  // Handle header logo upload  
  const handleHeaderLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('Ukuran file terlalu besar. Maksimal 2MB.')
      return
    }

    try {
      console.log('📤 Uploading header logo file...')
      setLoading(true)

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok && data.success && data.logoUrl) {
        console.log('✅ Header logo uploaded successfully:', data.logoUrl)

        // Save header logo URL to database
        try {
          const saveResponse = await fetch('/api/website-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoHeaderUrl: data.logoUrl })
          })

          if (saveResponse.ok) {
            console.log('✅ Header logo URL saved to database')
            // Update local state
            setWebsiteSettings(prev => prev ? ({
              ...prev,
              logoHeaderUrl: data.logoUrl
            }) : null)
            alert('Logo header berhasil diupload dan disimpan!')

            // Emit real-time update
            const socket = (window as any).socket
            if (socket && socket.connected) {
              socket.emit('website-settings-updated', {
                logoHeaderUrl: data.logoUrl
              })
              console.log('🔌 Broadcasting header logo update via WebSocket')
            }
          } else {
            throw new Error('Failed to save header logo URL to database')
          }
        } catch (saveError) {
          console.error('❌ Error saving header logo URL:', saveError)
          alert('Logo header diupload tapi gagal disimpan ke database')
        }
      } else {
        console.error('❌ Header logo upload failed:', data.error)
        alert('Gagal mengupload logo header: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error uploading header logo:', error)
      alert('Terjadi kesalahan saat mengupload logo header')
    } finally {
      setLoading(false)
    }
  }

  // Handle advertisement image upload
  const handleAdvertisementImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.')
      return
    }

    if (file.size > 20 * 1024 * 1024) { // 20MB
      alert('Ukuran file terlalu besar. Maksimal 20MB.')
      return
    }

    try {
      console.log('📤 Uploading advertisement image...')
      setUploading(true)

      // Create FormData for file upload
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      const response = await fetch('/api/upload/advertisement', {
        method: 'POST',
        body: uploadFormData
      })

      const data = await response.json()

      if (response.ok && data.success && data.imageUrl) {
        console.log('✅ Advertisement image uploaded successfully:', data.imageUrl)

        // Update form data with uploaded image URL
        handleInputChange('image', data.imageUrl)
        alert('Gambar berhasil diupload!')
      } else {
        console.error('❌ Advertisement image upload failed:', data.error)
        alert('Gagal mengupload gambar: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error uploading advertisement image:', error)
      alert('Terjadi kesalahan saat mengupload gambar')
    } finally {
      setUploading(false)
    }
  }

  // Handle job posting image upload
  const handleSequelImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.')
      return
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      alert('Ukuran file terlalu besar. Maksimal 50MB.')
      return
    }

    try {
      console.log('📤 Uploading job posting image...')
      console.log('📦 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
      setUploading(true)

      // Method 1: Try primary upload service
      console.log('🔄 Attempting primary upload method...')
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)

      let response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      let data = await response.json()

      // If primary method fails, try alternative method
      if (!response.ok || !data.success) {
        console.log('⚠️ Primary upload failed, trying alternative method...')

        // Method 2: Convert to base64 and try alternative endpoint
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const base64Data = await base64Promise

        response = await fetch('/api/upload-alt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            filename: file.name
          })
        })

        data = await response.json()
      }

      if (response.ok && data.success && data.imageUrl) {
        console.log('✅ Sequel image uploaded successfully:', data.imageUrl)

        // Update form data with uploaded image URL
        handleInputChange('image', data.imageUrl)
        alert('✅ Gambar berhasil diupload!')
      } else {
        console.error('❌ Sequel image upload failed:', data.error)
        alert('❌ Gagal mengupload gambar: ' + (data.error || 'Unknown error') + '\n\nCoba gunakan gambar yang lebih kecil atau format lain.')
      }
    } catch (error) {
      console.error('❌ Error uploading sequel image:', error)
      alert('❌ Terjadi kesalahan saat mengupload gambar.\n\nSaran:\n- Coba gambar dengan ukuran lebih kecil\n- Pastikan koneksi internet stabil\n- Atau gunakan opsi URL manual di bawah')
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const createSampleCategories = async () => {
    const sampleCategories = [
      { name: 'Rak Minimarket', description: 'Rak khusus untuk minimarket dengan berbagai ukuran dan kapasitas' },
      { name: 'Meja Kasir', description: 'Meja kasir modern dan multifungsi untuk berbagai jenis toko' },
      { name: 'Rak Rokok', description: 'Rak display khusus untuk produk rokok dengan sistem yang menarik' },
      { name: 'Rak Gudang', description: 'Rak gudang heavy duty untuk penyimpanan dengan kapasitas besar' },
      { name: 'Rak Serbaguna', description: 'Rak serbaguna untuk berbagai keperluan display dan penyimpanan' }
    ]

    console.log('🏷️ Creating sample categories...')
    for (const category of sampleCategories) {
      try {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category)
        })
        const data = await response.json()
        if (data.success) {
          console.log(`✅ Created category: ${category.name}`)
        }
      } catch (error) {
        console.error(`❌ Failed to create category ${category.name}:`, error)
      }
    }
    // Refetch after creating
    setTimeout(() => fetchCategories(), 1000)
  }

  // Helper functions for CRUD
  const getApiEndpoint = (entityType: EntityType): string => {
    const endpoints = {
      products: '/api/products',
      orders: '/api/orders',
      contacts: '/api/contact',
      users: '/api/users',
      profiles: '/api/profile',
      categories: '/api/categories',
      advertisements: '/api/advertisements',
      'website-settings': '/api/website-settings',
      'contact-settings': '/api/contact-settings',
      testimonials: '/api/testimonials',
      sequel: '/api/career',
      storyline: '/api/storyline'
    }
    return endpoints[entityType] || '/api/unknown'
  }

  const refreshEntityData = async (entityType: EntityType) => {
    switch (entityType) {
      case 'products':
        await fetchProducts()
        break
      case 'orders':
        await fetchOrders()
        break
      case 'contacts':
        await fetchContacts()
        break
      case 'users':
        await fetchUsers()
        break
      case 'profiles':
        await fetchProfiles()
        break
      case 'categories':
        await fetchCategories()
        break
      case 'advertisements':
        await fetchAdvertisements()
        break
      case 'website-settings':
        await fetchWebsiteSettings()
        break
      case 'testimonials':
        await fetchTestimonials()
        break
      case 'sequel':
        await fetchSequel()
        break
      case 'storyline':
        await fetchStoryline()
        break
    }
  }

  // CRUD Operations  
  const handleCreate = (entityType: EntityType, preFilledData?: any) => {
    setCurrentEntity(entityType)
    setModalType('create')
    setSelectedItem(preFilledData || null)

    // Pre-fill form data if provided
    if (preFilledData) {
      setFormData(preFilledData)
    } else {
      // Set default form data based on entity type
      if (entityType === 'sequel') {
        setFormData({
          title: '',
          subtitle: '',
          excerpt: '',
          content: '',
          image: '',
          sortOrder: 0,
          isActive: true
        })
      } else {
        setFormData({})
      }
    }

    setShowModal(true)
  }

  const handleEdit = (entityType: EntityType, item: any) => {
    console.log('🔧 Edit modal opening for:', entityType, item)
    console.log('📋 Original item data:', JSON.stringify(item, null, 2))

    setCurrentEntity(entityType)
    setModalType('edit')
    setSelectedItem(item)

    // Special handling for orders to ensure proper field mapping
    if (entityType === 'orders') {
      const mappedFormData = {
        ...item,
        // Ensure the status field is properly mapped
        status: item.status || 'PENDING_CONFIRMATION',
        // Map customerName back to individual fields if needed
        customerFirstName: item.customerFirstName || item.customerName?.split(' ')[0] || '',
        customerLastName: item.customerLastName || item.customerName?.split(' ').slice(1).join(' ') || '',
        customerEmail: item.customerEmail || '',
        customerPhone: item.customerPhone || '',
        customerCompany: item.customerCompany || '',
        specialInstructions: item.specialInstructions || ''
      }
      console.log('📝 Mapped form data for orders:', JSON.stringify(mappedFormData, null, 2))
      setFormData(mappedFormData)
    } else if (entityType === 'products') {
      // Special handling for products to detect multi-price state
      const hasVariantsData = item.hasVariants || (item.variants && item.variants.length > 0)
      const mappedProductData = {
        ...item,
        hasVariants: hasVariantsData,
        variants: item.variants || []
      }
      console.log('📝 Mapped product data for editing:', {
        hasVariants: mappedProductData.hasVariants,
        variantCount: mappedProductData.variants.length,
        variants: mappedProductData.variants
      })
      setFormData(mappedProductData)
    } else if (entityType === 'sequel') {
      // Special handling for career/sequel to convert JSON arrays to textarea format
      const jsonToText = (jsonStr: string | null | undefined): string => {
        if (!jsonStr) return ''
        try {
          const arr = JSON.parse(jsonStr)
          return Array.isArray(arr) ? arr.join('\n') : ''
        } catch {
          return jsonStr || ''
        }
      }

      const mappedCareerData = {
        ...item,
        requirements: jsonToText(item.requirements),
        responsibilities: jsonToText(item.responsibilities),
        benefits: jsonToText(item.benefits),
        // Map description to content for backward compatibility
        content: item.description || item.content || ''
      }
      console.log('📝 Mapped career data for editing:', mappedCareerData)
      setFormData(mappedCareerData)
    } else {
      setFormData(item)
    }

    setFormErrors({})
    setShowModal(true)
  }

  const handleView = (entityType: EntityType, item: any) => {
    setCurrentEntity(entityType)
    setModalType('view')
    setSelectedItem(item)
    setFormData(item)
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = (entityType: EntityType, item: any) => {
    setCurrentEntity(entityType)
    setModalType('delete')
    setSelectedItem(item)
    setFormData(item)
    setFormErrors({})
    setShowModal(true)
  }

  const handleToggleAdStatus = async (ad: any) => {
    try {
      const response = await fetch(`/api/advertisements?id=${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ad,
          isActive: !ad.isActive
        })
      })

      const data = await response.json()
      if (data.success) {
        await fetchAdvertisements()
      }
    } catch (error) {
      console.error('Error toggling ad status:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormErrors({})

    // Validate advertisements before submit
    if (currentEntity === 'advertisements' && modalType === 'create') {
      const errors: any = {}

      if (!formData.title) {
        errors.title = 'Judul iklan harus diisi'
      }

      if (!formData.image) {
        errors.image = 'Gambar harus diupload'
      }

      if (!formData.link) {
        errors.link = 'Link tujuan harus diisi'
      }

      if (!formData.type) {
        errors.type = 'Type iklan harus diisi'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setLoading(false)
        alert('Mohon lengkapi semua field yang wajib diisi')
        return
      }
    }

    // Validate job postings before submit (skip for delete)
    if (currentEntity === 'sequel' && modalType !== 'delete') {
      const errors: any = {}

      if (!formData.title || formData.title.trim() === '') {
        errors.title = 'Judul lowongan harus diisi'
      }

      if (!formData.department || formData.department.trim() === '') {
        errors.department = 'Departemen harus diisi'
      }

      if (!formData.location || formData.location.trim() === '') {
        errors.location = 'Lokasi harus diisi'
      }

      if (!formData.employmentType || formData.employmentType.trim() === '') {
        errors.employmentType = 'Tipe pekerjaan harus diisi'
      }

      if (!formData.content || (typeof formData.content === 'string' && formData.content.trim() === '')) {
        errors.content = 'Deskripsi pekerjaan harus diisi'
      }

      const responsibilities = formData.responsibilities as string | undefined
      if (!responsibilities || (typeof responsibilities === 'string' && responsibilities.trim() === '')) {
        errors.responsibilities = 'Tanggung jawab harus diisi'
      }

      const requirements = formData.requirements as string | undefined
      if (!requirements || (typeof requirements === 'string' && requirements.trim() === '')) {
        errors.requirements = 'Kualifikasi harus diisi'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setLoading(false)
        alert('Mohon lengkapi semua field yang wajib diisi')
        return
      }
    }

    try {
      const apiEndpoint = getApiEndpoint(currentEntity)
      let method = modalType === 'create' ? 'POST' : modalType === 'edit' ? 'PUT' : 'DELETE'
      let url = apiEndpoint

      if (modalType === 'edit') {
        // For orders, products, categories, users, and sequel use query parameter
        if (currentEntity === 'products' || currentEntity === 'categories' || currentEntity === 'orders' || currentEntity === 'users' || currentEntity === 'sequel') {
          url = `${apiEndpoint}?id=${selectedItem?.id}`
        } else {
          url = `${apiEndpoint}/${selectedItem?.id}`
        }
      } else if (modalType === 'delete') {
        // For DELETE requests, use proper URL pattern based on entity
        if (currentEntity === 'products' || currentEntity === 'categories' || currentEntity === 'orders' || currentEntity === 'contacts' || currentEntity === 'users' || currentEntity === 'sequel') {
          url = `${apiEndpoint}?id=${selectedItem?.id}`
        } else {
          // For profiles - use path parameter
          url = `${apiEndpoint}/${selectedItem?.id}`
        }
      }

      let body = undefined
      if (modalType !== 'delete') {
        body = JSON.stringify(formData)
      }

      console.log('📡 Sending CRUD request:', {
        entity: currentEntity,
        modalType,
        method,
        url,
        selectedItem: selectedItem,
        formData: formData,
        bodyToSend: body
      })


      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        ...(body && { body })
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Response not OK:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()

      console.log('📝 API Response:', data)
      if (data.success) {
        // Immediate state update as fallback + real-time as enhancement
        if (currentEntity === 'categories') {
          console.log('⚡ Immediate category state update as fallback')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            setCategories(prev => {
              const exists = prev.some(c => c.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev]
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state  
            setCategories(prev => prev.map(c => c.id === data.data.id ? data.data : c))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            setCategories(prev => prev.filter(c => c.id !== selectedItem.id))
          }
        } else if (currentEntity === 'orders') {
          console.log('⚡ Immediate order state update as fallback')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            setOrders(prev => {
              const exists = prev.some(o => o.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev]
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state - THIS WAS MISSING!
            console.log('🔄 Updating order in frontend state:', data.data)
            setOrders(prev => prev.map(o => {
              if (o.id === data.data.id || o.id === selectedItem?.id) {
                console.log('✅ Order found and updated:', data.data.id || data.data.orderNumber)
                // Transform the API response to match the frontend format
                return {
                  id: data.data.id || data.data.orderNumber,
                  orderNumber: data.data.orderNumber,
                  customerName: `${data.data.customerInfo?.firstName || data.data.customerFirstName} ${data.data.customerInfo?.lastName || data.data.customerLastName}`,
                  customerFirstName: data.data.customerInfo?.firstName || data.data.customerFirstName,
                  customerLastName: data.data.customerInfo?.lastName || data.data.customerLastName,
                  customerEmail: data.data.customerInfo?.email || data.data.customerEmail,
                  customerPhone: data.data.customerInfo?.phone || data.data.customerPhone,
                  customerCompany: data.data.customerInfo?.company || data.data.customerCompany,
                  customerAddress: data.data.customerInfo?.address || data.data.customerAddress,
                  customerCity: data.data.customerInfo?.city || data.data.customerCity,
                  customerState: data.data.customerInfo?.state || data.data.customerState,
                  customerPostalCode: data.data.customerInfo?.postalCode || data.data.customerPostalCode,
                  paymentMethod: data.data.paymentMethod,
                  specialInstructions: data.data.specialInstructions,
                  totalAmount: data.data.totalAmount,
                  status: data.data.status,
                  createdAt: data.data.createdAt,
                  itemsCount: o.itemsCount
                }
              }
              return o
            }))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            setOrders(prev => prev.filter(o => o.id !== selectedItem.id))
          }

          // Also refresh from server for safety
          await refreshEntityData(currentEntity)
        } else if (currentEntity === 'contacts') {
          console.log('⚡ Immediate contact state update as fallback')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            setContacts(prev => {
              const exists = prev.some(c => c.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev]
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state
            console.log('✏️ Updating contact in state:', data.data.id)
            setContacts(prev => prev.map(c => c.id === data.data.id ? data.data : c))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            console.log('🗑️ Removing contact from state:', selectedItem.id)
            setContacts(prev => {
              const filtered = prev.filter(c => c.id !== selectedItem.id)
              console.log(`✅ Contact removed, total contacts: ${filtered.length}`)
              return filtered
            })
          }

          // Also refresh from server for safety
          await refreshEntityData(currentEntity)
        } else if (currentEntity === 'profiles') {
          console.log('⚡ Immediate profile state update as fallback')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            console.log('➕ Adding profile to state:', data.data.id, data.data.title)
            setProfiles(prev => {
              const exists = prev.some(g => g.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev]
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state
            console.log('✏️ Updating profile in state:', data.data.id, data.data.title)
            setProfiles(prev => prev.map(g => g.id === data.data.id ? data.data : g))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            console.log('🗑️ Removing profile from state:', selectedItem.id, selectedItem.title)
            setProfiles(prev => {
              const filtered = prev.filter(g => g.id !== selectedItem.id)
              console.log(`✅ Profile removed, total profiles: ${filtered.length}`)
              return filtered
            })
          }

          // Also refresh from server for safety
          await refreshEntityData(currentEntity)
        } else if (currentEntity === 'users') {
          console.log('⚡ Immediate user state update as fallback')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            console.log('➕ Adding user to state:', data.data.id, data.data.email)
            setUsers(prev => {
              const exists = prev.some(u => u.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev]
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state
            console.log('✏️ Updating user in state:', data.data.id, data.data.email)
            setUsers(prev => prev.map(u => u.id === data.data.id ? data.data : u))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            console.log('🗑️ Removing user from state:', selectedItem.id, selectedItem.email)
            setUsers(prev => {
              const filtered = prev.filter(u => u.id !== selectedItem.id)
              console.log(`✅ User removed, total users: ${filtered.length}`)
              return filtered
            })
          }

          // Also refresh from server for safety
          await refreshEntityData(currentEntity)
        } else if (currentEntity === 'testimonials') {
          console.log('⚡ Immediate testimonial state update as fallback')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            console.log('➕ Adding testimonial to state:', data.data.id, data.data.name)
            setTestimonials(prev => {
              const exists = prev.some(t => t.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev]
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state
            console.log('✏️ Updating testimonial in state:', data.data.id, data.data.name)
            setTestimonials(prev => prev.map(t => t.id === data.data.id ? data.data : t))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            console.log('🗑️ Removing testimonial from state:', selectedItem.id, selectedItem.name)
            setTestimonials(prev => {
              const filtered = prev.filter(t => t.id !== selectedItem.id)
              console.log(`✅ Testimonial removed, total testimonials: ${filtered.length}`)
              return filtered
            })
          }

          // Also refresh from server for safety
          await refreshEntityData(currentEntity)
        } else if (currentEntity === 'advertisements') {
          console.log('⚡ Immediate advertisement state update')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            console.log('➕ Adding advertisement to state:', data.data.id, data.data.title)
            setAdvertisements(prev => {
              const exists = prev.some(a => a.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev]
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state
            console.log('✏️ Updating advertisement in state:', data.data.id, data.data.title)
            setAdvertisements(prev => prev.map(a => a.id === data.data.id ? data.data : a))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            console.log('🗑️ Removing advertisement from state:', selectedItem.id, selectedItem.title)
            setAdvertisements(prev => {
              const filtered = prev.filter(a => a.id !== selectedItem.id)
              console.log(`✅ Advertisement removed, total advertisements: ${filtered.length}`)
              return filtered
            })
          }

          // No refresh needed - immediate update is sufficient
        } else if (currentEntity === 'sequel') {
          console.log('⚡ Immediate job posting state update')

          if (modalType === 'create' && data.data) {
            // Immediate add to state
            console.log('➕ Adding job posting to state:', data.data.id, data.data.title)
            setSequelArticles(prev => {
              const exists = prev.some(a => a.id === data.data.id)
              if (exists) return prev
              return [data.data, ...prev].sort((a, b) => a.sortOrder - b.sortOrder)
            })
          } else if (modalType === 'edit' && data.data) {
            // Immediate update in state
            console.log('✏️ Updating job posting in state:', data.data.id, data.data.title)
            setSequelArticles(prev => prev.map(a => a.id === data.data.id ? data.data : a).sort((a, b) => a.sortOrder - b.sortOrder))
          } else if (modalType === 'delete' && selectedItem) {
            // Immediate remove from state
            console.log('🗑️ Removing job posting from state:', selectedItem.id, selectedItem.title)
            setSequelArticles(prev => {
              const filtered = prev.filter(a => a.id !== selectedItem.id)
              console.log(`✅ Job posting removed, total: ${filtered.length}`)
              return filtered
            })
          }

          // Also refresh from server for safety
          await refreshEntityData(currentEntity)
        } else {
          // For other entities, use manual refresh
          await refreshEntityData(currentEntity)
        }
        setShowModal(false)

        // Broadcast real-time update via WebSocket
        if (socket && isConnected) {
          const actionSuffix = modalType === 'delete' ? 'deleted' : modalType === 'create' ? 'created' : 'updated'
          const updateData = {
            action: `${currentEntity.slice(0, -1)}_${actionSuffix}`,
            [`${currentEntity.slice(0, -1)}`]: modalType === 'delete' ? null : data.data,
            [`${currentEntity.slice(0, -1)}Id`]: modalType === 'delete' ? selectedItem?.id : null,
            timestamp: new Date().toISOString()
          }

          console.log('📡 Broadcasting real-time update:', updateData)
          socket.emit('admin_update', updateData)

          // Special handling for orders - send additional WebSocket event for frontend sync
          if (currentEntity === 'orders') {
            if (modalType === 'edit' && data.data) {
              console.log('📡 Broadcasting ORDER_UPDATED for frontend sync:', data.data.orderNumber || data.data.id)
              // Transform admin data to frontend format for real-time sync
              const frontendFormat = {
                id: data.data.orderNumber || data.data.id,
                orderNumber: data.data.orderNumber || data.data.id,
                status: data.data.status,
                customerInfo: {
                  firstName: data.data.customerFirstName,
                  lastName: data.data.customerLastName,
                  name: `${data.data.customerFirstName} ${data.data.customerLastName}`,
                  email: data.data.customerEmail,
                  phone: data.data.customerPhone
                },
                totalAmount: data.data.totalAmount,
                specialInstructions: data.data.specialInstructions,
                updatedAt: new Date().toISOString()
              }

              // Send ORDER_UPDATED event directly to all clients
              fetch('/api/debug/websocket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'ORDER_UPDATED',
                  data: frontendFormat
                })
              }).catch(error => console.error('Failed to broadcast ORDER_UPDATED:', error))
            }
          }
        }

        // Show success message
        console.log(`✅ ${modalType} operation successful for ${currentEntity}`)
      } else {
        setFormErrors({ general: data.error || 'Operation failed' })
      }
    } catch (error) {
      console.error(`❌ Error in ${modalType} operation for ${currentEntity}:`, error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        type: typeof error,
        error: error
      })
      setFormErrors({ general: `Network error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    console.log(`📝 Input changed - ${field}:`, value)
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }


      return newData
    })

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">B</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Betarak Admin</h1>
                  <p className="text-sm text-gray-500">Dashboard Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Debug Buttons */}
              <button
                onClick={testWebSocket}
                className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
              >
                Test WS
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/orders')
                    const data = await response.json()
                    console.log('🔍 Database Orders:', data)
                    alert(`Found ${data.data?.count || 0} orders in database. Check console for details.`)
                  } catch (error) {
                    console.error('Error checking database:', error)
                    alert('Error checking database')
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Check DB
              </button>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug/websocket', { method: 'POST' })
                    const data = await response.json()
                    console.log('📡 WebSocket Test:', data)
                    alert('WebSocket test sent. Check console and admin notifications.')
                  } catch (error) {
                    console.error('Error testing WebSocket:', error)
                    alert('Error testing WebSocket')
                  }
                }}
                className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
              >
                Test WS API
              </button>

              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Simulating ORDER_DELETED WebSocket broadcast...')
                    const response = await fetch('/api/debug/websocket', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'ORDER_DELETED',
                        data: {
                          orderNumber: 'BTK-TEST-DELETE',
                          orderId: 'test-123'
                        }
                      })
                    })
                    const data = await response.json()
                    console.log('📡 Debug WebSocket response:', data)
                    alert('Debug WebSocket ORDER_DELETED sent. Check frontend console.')
                  } catch (error) {
                    console.error('Error testing WebSocket:', error)
                    alert('Error testing WebSocket')
                  }
                }}
                className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
              >
                Test ORDER_DELETED
              </button>

              <button
                onClick={async () => {
                  try {
                    console.log('🧪 Simulating ORDER_UPDATED WebSocket broadcast...')
                    const testOrder = {
                      id: 'BTK-1758966980442FCA5',
                      orderNumber: 'BTK-1758966980442FCA5',
                      status: 'confirmed',
                      customerInfo: {
                        firstName: 'Gibran',
                        lastName: 'Test Update',
                        name: 'Gibran Test Update',
                        email: 'test@example.com',
                        phone: '123456789'
                      },
                      totalAmount: 2300000,
                      specialInstructions: 'Test real-time update',
                      updatedAt: new Date().toISOString()
                    }

                    const response = await fetch('/api/debug/websocket', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'ORDER_UPDATED',
                        data: testOrder
                      })
                    })
                    const data = await response.json()
                    console.log('📡 Debug ORDER_UPDATED response:', data)
                    alert('Debug ORDER_UPDATED sent. Check frontend console for real-time update.')
                  } catch (error) {
                    console.error('Error testing ORDER_UPDATED:', error)
                    alert('Error testing ORDER_UPDATED')
                  }
                }}
                className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200"
              >
                Test ORDER_UPDATED
              </button>

              <button
                onClick={async () => {
                  try {
                    // Get orders from localStorage
                    const localOrders = JSON.parse(localStorage.getItem('betarak-orders') || '[]')
                    if (localOrders.length === 0) {
                      alert('No orders found in localStorage to migrate.')
                      return
                    }

                    console.log('🔄 Migrating orders from localStorage:', localOrders)
                    const response = await fetch('/api/migrate/orders', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orders: localOrders })
                    })
                    const data = await response.json()

                    if (data.success) {
                      alert(`Successfully migrated ${data.data.migratedCount} orders to database!`)
                      // Refresh orders after migration
                      fetchOrders()
                    } else {
                      alert(`Migration failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Error migrating orders:', error)
                    alert('Error migrating orders')
                  }
                }}
                className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors"
              >
                Migrate Orders
              </button>

              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to clear ALL orders from database? This cannot be undone!')) {
                    return
                  }

                  try {
                    const response = await fetch('/api/debug/clear-orders', { method: 'DELETE' })
                    const data = await response.json()

                    if (data.success) {
                      alert(`Successfully cleared ${data.data.deletedOrders} orders from database!`)
                      // Refresh orders after clearing
                      fetchOrders()
                    } else {
                      alert(`Clear failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Error clearing orders:', error)
                    alert('Error clearing orders')
                  }
                }}
                className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
              >
                Clear All Orders
              </button>

              {/* WebSocket Status Indicator */}
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                title={isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}>
              </div>

              {/* User Info */}
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium text-gray-900">{user?.username}</span>
              </div>

              {/* Test WebSocket Button */}
              <button
                onClick={testWebSocket}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors mr-2"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Test WS
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mr-2"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>Logout</span>
              </button>

              {/* Back to Website */}
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali ke Website</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="p-6">
            {/* Role display */}
            {user?.role && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Role</div>
                <div className="text-sm font-medium text-gray-900">
                  {roleDisplayNames[user.role as keyof typeof roleDisplayNames] || user.role}
                </div>
              </div>
            )}

            {/* Dynamic navigation based on permissions */}
            <ul className="space-y-2">
              {getAccessibleTabs(user?.role || 'USER').map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    title={tab.description}
                  >
                    {tab.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* Show message if no permissions */}
            {getAccessibleTabs(user?.role || 'USER').length === 1 && (
              <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800">
                  <strong>Info:</strong> Akses terbatas berdasarkan role Anda.
                </div>
              </div>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'dashboard' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Admin</h2>
                <div className="flex items-center space-x-3">
                  {/* WebSocket Status Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">
                      {isConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <button
                    onClick={testWebSocket}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Test WS
                  </button>
                </div>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        {/* Trend indicator */}
                        <div className="flex items-center mt-2">
                          <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-green-600 font-medium">+12% dari bulan lalu</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.color}`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Categories Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Kategori Produk</h3>
                    <span className="text-2xl font-bold text-indigo-600">{categories.length}</span>
                  </div>
                  <div className="space-y-2">
                    {categories.slice(0, 3).map((category) => (
                      <div key={category.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{category.name}</span>
                        <span className="font-medium text-gray-900">{category.productCount || 0} produk</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gallery Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Profile Perusahaan</h3>
                    <span className="text-2xl font-bold text-purple-600">{profiles.length}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Published</span>
                      <span className="font-medium text-gray-900">
                        {profiles.filter(g => g.status === 'published').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Draft</span>
                      <span className="font-medium text-gray-900">
                        {profiles.filter(g => g.status === 'draft').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Total Users</h3>
                    <span className="text-2xl font-bold text-teal-600">{users.length}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Admin</span>
                      <span className="font-medium text-gray-900">
                        {users.filter(u => u.role === 'ADMIN').length}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Digital Marketing</span>
                      <span className="font-medium text-gray-900">
                        {users.filter(u => u.role === 'DIGITAL_MARKETING').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities & Quick Actions Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Pesanan Terbaru</h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0
                            }).format(order.totalAmount)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            order.status === 'PENDING_CONFIRMATION' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {getOrderStatusDisplay(order.status).label}
                          </span>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm">Belum ada pesanan</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Inquiries */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Inquiry Terbaru</h3>
                    <button
                      onClick={() => setActiveTab('contacts')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="space-y-3">
                    {contacts.slice(0, 5).map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{contact.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(contact.createdAt).toLocaleDateString('id-ID')}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${contact.status === 'NEW' ? 'bg-yellow-100 text-yellow-800' :
                            contact.status === 'RESPONDED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {contact.status === 'NEW' ? 'Baru' :
                              contact.status === 'RESPONDED' ? 'Direspon' : 'Ditutup'}
                          </span>
                        </div>
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm">Belum ada inquiry</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions - Enhanced */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {hasPermission(user?.role || 'USER', 'products') && (
                    <button
                      onClick={() => setActiveTab('products')}
                      className="p-6 border border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <PlusIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Tambah Produk</p>
                      <p className="text-xs text-gray-500 mt-1">Kelola inventory</p>
                    </button>
                  )}
                  {hasPermission(user?.role || 'USER', 'orders') && (
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="p-6 border border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                    >
                      <EyeIcon className="w-8 h-8 text-gray-400 group-hover:text-green-500 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Lihat Pesanan</p>
                      <p className="text-xs text-gray-500 mt-1">Kelola transaksi</p>
                    </button>
                  )}
                  {hasPermission(user?.role || 'USER', 'contacts') && (
                    <button
                      onClick={() => setActiveTab('contacts')}
                      className="p-6 border border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                    >
                      <UsersIcon className="w-8 h-8 text-gray-400 group-hover:text-purple-500 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Kelola Inquiry</p>
                      <p className="text-xs text-gray-500 mt-1">Customer service</p>
                    </button>
                  )}
                  {hasPermission(user?.role || 'USER', 'profiles') && (
                    <button
                      onClick={() => setActiveTab('profiles')}
                      className="p-6 border border-dashed border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                    >
                      <PhotoIcon className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mx-auto mb-3 transition-colors" />
                      <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Kelola Profile</p>
                      <p className="text-xs text-gray-500 mt-1">Profile perusahaan</p>
                    </button>
                  )}
                </div>

                {/* System Info */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Selamat Datang, {user?.email}!</h4>
                      <p className="text-sm text-blue-700">
                        Role: <span className="font-medium">{roleDisplayNames[user?.role as keyof typeof roleDisplayNames] || 'User'}</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Anda memiliki akses ke {getAccessibleTabs(user?.role || 'USER').length} fitur dashboard
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-700">Server Time</p>
                      <p className="text-xs text-blue-600">{new Date().toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics & Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Monthly Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Revenue Overview</h3>
                    <select className="text-sm border border-gray-200 rounded-md px-2 py-1">
                      <option>Last 6 months</option>
                      <option>Last 12 months</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                      const value = Math.floor(Math.random() * 50) + 10
                      return (
                        <div key={month} className="flex items-center">
                          <div className="w-8 text-xs text-gray-600">{month}</div>
                          <div className="flex-1 mx-3">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${value}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-right text-sm font-medium">Rp {(value * 500000).toLocaleString('id-ID')}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.reviews} reviews</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">⭐ {product.rating || 0}</p>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">Belum ada data produk</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Status & Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Database Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Database</h4>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connection</span>
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response Time</span>
                      <span className="text-gray-900">12ms</span>
                    </div>
                  </div>
                </div>

                {/* API Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">API Status</h4>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Uptime</span>
                      <span className="text-green-600 font-medium">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requests/min</span>
                      <span className="text-gray-900">127</span>
                    </div>
                  </div>
                </div>

                {/* Storage Usage */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Storage</h4>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Used</span>
                      <span className="text-yellow-600 font-medium">2.1 GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available</span>
                      <span className="text-gray-900">7.9 GB</span>
                    </div>
                  </div>
                </div>

                {/* WebSocket Status */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">WebSocket</h4>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Socket ID</span>
                      <span className="text-gray-900 font-mono text-xs">{socket?.id?.slice(-6) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && hasPermission(user?.role || 'USER', 'products') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manajemen Produk</h2>
                <button
                  onClick={() => handleCreate('products')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Tambah Produk
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(products || []).length > 0 ? (
                      (products || []).map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 capitalize">{product.category}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(product.price)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${product.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {product.inStock ? 'Tersedia' : 'Habis'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{product.reviews}</td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView('products', product)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('products', product)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('products', product)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <ShoppingBagIcon className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Belum ada produk tersedia</p>
                            <p className="text-sm text-gray-400">Tambahkan produk pertama Anda</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && hasPermission(user?.role || 'USER', 'orders') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manajemen Pesanan</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={fetchOrders}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => handleCreate('orders')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Tambah Pesanan
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(orders || []).length > 0 ? (
                      (orders || []).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{order.orderNumber || `#${order.id.slice(-8)}`}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{order.customerName}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0,
                            }).format(order.totalAmount)}
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const statusDisplay = getOrderStatusDisplay(order.status)
                              return (
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusDisplay.class}`}>
                                  {statusDisplay.label}
                                </span>
                              )
                            })()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView('orders', order)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('orders', order)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('orders', order)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <ChartBarIcon className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Belum ada pesanan tersedia</p>
                            <p className="text-sm text-gray-400">Pesanan akan muncul ketika customer melakukan pemesanan</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && hasPermission(user?.role || 'USER', 'contacts') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manajemen Inquiry</h2>
                <button
                  onClick={() => handleCreate('contacts')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Tambah Inquiry
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Layanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(contacts || []).length > 0 ? (
                      (contacts || []).map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</div>
                            <div className="text-sm text-gray-500">{contact.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{contact.email}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{contact.subject}</div>
                            <div className="text-sm text-gray-500">{contact.message?.substring(0, 50)}...</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {contact.inquiryType?.toLowerCase() === 'general' ? 'Konsultasi Umum' :
                                contact.inquiryType?.toLowerCase() === 'quotation' ? 'Minta Penawaran' :
                                  contact.inquiryType?.toLowerCase() === 'support' ? 'Dukungan Teknis' :
                                    contact.inquiryType?.toLowerCase() === 'partnership' ? 'Kemitraan' :
                                      contact.inquiryType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${contact.status === 'NEW'
                              ? 'bg-yellow-100 text-yellow-800'
                              : contact.status === 'RESPONDED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {contact.status === 'NEW' ? 'Baru' : contact.status === 'RESPONDED' ? 'Direspon' : 'Ditutup'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(contact.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView('contacts', contact)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('contacts', contact)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('contacts', contact)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <UsersIcon className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Belum ada inquiry tersedia</p>
                            <p className="text-sm text-gray-400">Inquiry dari form contact akan muncul di sini</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && hasPermission(user?.role || 'USER', 'users') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Manajemen Users</h2>
                  <p className="text-sm text-gray-600 mt-1">Kelola akun pengguna dan lihat kredential login untuk setiap akun</p>
                </div>
                <button
                  onClick={() => handleCreate('users')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Tambah User
                </button>
              </div>

              {/* Login Credentials Info */}
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 mb-2">🔐 Kredential Login untuk Semua User:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                  <div>
                    <strong>🆔 Username:</strong> Gunakan username dari kolom "Username" (bukan email)
                    <br />
                    <strong>🔑 Password:</strong> admin123 (untuk semua user)
                  </div>
                  <div className="bg-green-100 p-2 rounded">
                    <strong>Contoh Login:</strong><br />
                    <code>Username: admin</code><br />
                    <code>Password: admin123</code>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Daftar</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(users || []).length > 0 ? (
                      (users || []).map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{user.username || user.firstName || 'User'}</div>
                            <div className="text-xs text-gray-500">Account Name</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <div>
                                <div className="text-sm text-gray-900 font-medium">{user.username || 'admin'}</div>
                                <div className="text-xs text-gray-500">Username login</div>
                              </div>
                              <button
                                onClick={() => navigator.clipboard.writeText(user.username || 'admin')}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Copy username"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">{user.email}</div>
                            <div className="text-xs text-gray-500">Email account</div>
                          </td>
                          <td className="px-6 py-4">
                            <PasswordDisplay password={user.password || 'admin123'} />
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.role === 'ADMIN'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'DIGITAL_MARKETING'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'CUSTOMER_SERVICE'
                                  ? 'bg-green-100 text-green-800'
                                  : user.role === 'USER'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                              {user.role === 'ADMIN' ? 'Admin'
                                : user.role === 'DIGITAL_MARKETING' ? 'Digital Marketing'
                                  : user.role === 'CUSTOMER_SERVICE' ? 'Customer Service'
                                    : user.role === 'USER' ? 'User'
                                      : 'Guest'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(user.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView('users', user)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('users', user)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('users', user)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <UsersIcon className="w-12 h-12 text-gray-300 mb-2" />
                            <p>Belum ada users tersedia</p>
                            <p className="text-sm text-gray-400">Tambahkan user pertama Anda</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fallback jika user mencoba akses users tapi tidak punya permission */}
          {activeTab === 'users' && !hasPermission(user?.role || 'USER', 'users') && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Akses Terbatas</h3>
                <p className="text-gray-600 mb-4">Hanya user dengan role ADMIN yang dapat mengakses manajemen users.</p>
                <p className="text-sm text-gray-500">Silakan hubungi administrator untuk mendapatkan akses.</p>
              </div>
            </div>
          )}

          {activeTab === 'profiles' && hasPermission(user?.role || 'USER', 'profiles') && (
            <div>
              {/* Profile Settings Section */}
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-semibold">Pengaturan Halaman Profile</h2>
                      <p className="text-sm text-gray-600 mt-1">Kelola konten yang ditampilkan di halaman /profile</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <a
                        href="/profile"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        <EyeIcon className="w-5 h-5" />
                        <span>Lihat Halaman</span>
                      </a>
                    </div>
                  </div>

                  {profileSettings ? (
                    <div className="space-y-6">
                      {/* Hero Section */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Banner</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left Column - Text Content */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Judul Hero</label>
                              <input
                                type="text"
                                value={profileSettings.heroTitle}
                                onChange={(e) => setProfileSettings({ ...profileSettings, heroTitle: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tentang Betarak"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Hero</label>
                              <textarea
                                rows={4}
                                value={profileSettings.heroDescription}
                                onChange={(e) => setProfileSettings({ ...profileSettings, heroDescription: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Solusi terpercaya untuk kebutuhan rak..."
                              />
                            </div>
                          </div>

                          {/* Right Column - Image Upload */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gambar Hero (Opsional)
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                {profileSettings.heroImage || profileSettings.heroImagePreview ? (
                                  <div className="space-y-3">
                                    <img
                                      src={profileSettings.heroImagePreview || profileSettings.heroImage}
                                      alt="Hero preview"
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProfileSettings({ 
                                          ...profileSettings, 
                                          heroImage: null,
                                          heroImageFile: null,
                                          heroImagePreview: null 
                                        })
                                      }}
                                      className="text-sm text-red-600 hover:text-red-800"
                                    >
                                      Hapus Gambar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="text-sm text-gray-600">Upload gambar hero banner</p>
                                    <p className="text-xs text-gray-500">Kosongkan untuk background gradient default</p>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      // Check file size (10MB = 10 * 1024 * 1024 bytes)
                                      const maxSize = 10 * 1024 * 1024
                                      if (file.size > maxSize) {
                                        alert('❌ Ukuran file terlalu besar!\n\nMaksimal 10MB. File Anda: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB\n\nSilakan kompres gambar terlebih dahulu.')
                                        e.target.value = ''
                                        return
                                      }
                                      
                                      const reader = new FileReader()
                                      reader.onloadend = () => {
                                        setProfileSettings({ 
                                          ...profileSettings, 
                                          heroImageFile: file,
                                          heroImagePreview: reader.result as string
                                        })
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                  className="mt-3 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF (Max 10MB)</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visi & Misi Section */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visi & Misi</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left Column - Text Content */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Judul Section</label>
                              <input
                                type="text"
                                value={profileSettings.visionTitle}
                                onChange={(e) => setProfileSettings({ ...profileSettings, visionTitle: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Visi & Misi Kami"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Konten Visi</label>
                              <textarea
                                rows={3}
                                value={profileSettings.visionContent}
                                onChange={(e) => setProfileSettings({ ...profileSettings, visionContent: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Menjadi penyedia solusi rak..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Judul Misi</label>
                              <input
                                type="text"
                                value={profileSettings.missionTitle}
                                onChange={(e) => setProfileSettings({ ...profileSettings, missionTitle: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Misi"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Item Misi (JSON Array)</label>
                              <textarea
                                rows={4}
                                value={profileSettings.missionItems}
                                onChange={(e) => setProfileSettings({ ...profileSettings, missionItems: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                placeholder='["Item 1","Item 2"]'
                              />
                              <p className="text-xs text-gray-500 mt-1">Format: JSON array</p>
                            </div>
                          </div>

                          {/* Right Column - Image Upload */}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Gambar Visi & Misi
                              </label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                {profileSettings.visionImage || profileSettings.visionImagePreview ? (
                                  <div className="space-y-3">
                                    <img
                                      src={profileSettings.visionImagePreview || profileSettings.visionImage}
                                      alt="Vision preview"
                                      className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProfileSettings({ 
                                          ...profileSettings, 
                                          visionImage: null,
                                          visionImageFile: null,
                                          visionImagePreview: null 
                                        })
                                      }}
                                      className="text-sm text-red-600 hover:text-red-800"
                                    >
                                      Hapus Gambar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <p className="text-sm text-gray-600">Upload gambar visi & misi</p>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      // Check file size (10MB = 10 * 1024 * 1024 bytes)
                                      const maxSize = 10 * 1024 * 1024
                                      if (file.size > maxSize) {
                                        alert('❌ Ukuran file terlalu besar!\n\nMaksimal 10MB. File Anda: ' + (file.size / 1024 / 1024).toFixed(2) + 'MB\n\nSilakan kompres gambar terlebih dahulu.')
                                        e.target.value = ''
                                        return
                                      }
                                      
                                      const reader = new FileReader()
                                      reader.onloadend = () => {
                                        setProfileSettings({ 
                                          ...profileSettings, 
                                          visionImageFile: file,
                                          visionImagePreview: reader.result as string
                                        })
                                      }
                                      reader.readAsDataURL(file)
                                    }
                                  }}
                                  className="mt-3 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF (Max 10MB)</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Why Choose Us Section */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mengapa Memilih Kami</h3>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Judul Section</label>
                          <input
                            type="text"
                            value={profileSettings.whyChooseTitle}
                            onChange={(e) => setProfileSettings({ ...profileSettings, whyChooseTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Mengapa Memilih Betarak?"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Feature 1 */}
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-3">Feature 1</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                                <select
                                  value={profileSettings.feature1Icon}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature1Icon: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                >
                                  <option value="check">Check (✓)</option>
                                  <option value="money">Money ($)</option>
                                  <option value="shield">Shield (🛡️)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
                                <input
                                  type="text"
                                  value={profileSettings.feature1Title}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature1Title: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  placeholder="Kualitas Premium"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                                <textarea
                                  rows={3}
                                  value={profileSettings.feature1Description}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature1Description: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  placeholder="Material berkualitas tinggi..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Feature 2 */}
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-3">Feature 2</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                                <select
                                  value={profileSettings.feature2Icon}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature2Icon: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                >
                                  <option value="check">Check (✓)</option>
                                  <option value="money">Money ($)</option>
                                  <option value="shield">Shield (🛡️)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
                                <input
                                  type="text"
                                  value={profileSettings.feature2Title}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature2Title: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  placeholder="Harga Terpercaya"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                                <textarea
                                  rows={3}
                                  value={profileSettings.feature2Description}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature2Description: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  placeholder="Dapatkan produk berkualitas..."
                                />
                              </div>
                            </div>
                          </div>

                          {/* Feature 3 */}
                          <div className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-3">Feature 3</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Icon</label>
                                <select
                                  value={profileSettings.feature3Icon}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature3Icon: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                >
                                  <option value="check">Check (✓)</option>
                                  <option value="money">Money ($)</option>
                                  <option value="shield">Shield (🛡️)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Judul</label>
                                <input
                                  type="text"
                                  value={profileSettings.feature3Title}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature3Title: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  placeholder="Garansi Resmi"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Deskripsi</label>
                                <textarea
                                  rows={3}
                                  value={profileSettings.feature3Description}
                                  onChange={(e) => setProfileSettings({ ...profileSettings, feature3Description: e.target.value })}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                                  placeholder="Kepercayaan dan kepuasan pelanggan..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gallery Section */}
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio & Galeri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Judul Gallery</label>
                            <input
                              type="text"
                              value={profileSettings.galleryTitle}
                              onChange={(e) => setProfileSettings({ ...profileSettings, galleryTitle: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Portfolio & Galeri Kami"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi Gallery</label>
                            <textarea
                              rows={3}
                              value={profileSettings.galleryDescription}
                              onChange={(e) => setProfileSettings({ ...profileSettings, galleryDescription: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Lihat berbagai proyek dan pencapaian kami..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                          onClick={() => fetchProfileSettings()}
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleSaveProfileSettings()}
                          disabled={loading}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {loading ? 'Menyimpan...' : 'Simpan Pengaturan Profile'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Memuat Pengaturan...</h3>
                      <p className="text-gray-500">Mohon tunggu sebentar</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Items Management */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Manajemen Profile Items</h2>
                  <p className="text-sm text-gray-600 mt-1">Kelola portfolio dan galeri yang ditampilkan</p>
                </div>
                <button
                  onClick={() => handleCreate('profiles')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Tambah Profile
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul Profile</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(profiles || []).length > 0 ? (
                      (profiles || []).map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <img
                              src={project.image || 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=100'}
                              alt={project.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{project.title}</div>
                            <div className="text-sm text-gray-500">{project.description?.substring(0, 50)}...</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 capitalize">{project.category}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${project.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {project.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(project.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView('profiles', project)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('profiles', project)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('profiles', project)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p>Belum ada profile</p>
                            <p className="text-sm text-gray-400">Tambahkan profile pertama Anda</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'categories' && hasPermission(user?.role || 'USER', 'categories') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manajemen Kategori</h2>
                <button
                  onClick={() => handleCreate('categories')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Tambah Kategori
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(categories || []).length > 0 ? (
                      (categories || []).map((category) => (
                        <tr key={category.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{category.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{category.slug}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {category.description ? (
                              <span>{category.description.substring(0, 50)}...</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{category.productCount || 0}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${category.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {category.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView('categories', category)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('categories', category)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('categories', category)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <p>Belum ada kategori tersedia</p>
                            <p className="text-sm text-gray-400">Tambahkan kategori pertama Anda</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* UI-IKLAN (Advertisements) Management */}
          {activeTab === 'advertisements' && hasPermission(user?.role || 'USER', 'advertisements') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manajemen UI-IKLAN</h2>
                <button
                  onClick={() => handleCreate('advertisements')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Tambah Iklan
                </button>
              </div>

              {/* Homepage Hero Section Quick Setup */}
              <div className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Setup Cepat Homepage Hero Section</h3>
                    <p className="text-sm text-gray-600">Atur semua elemen homepage hero section dengan mudah</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { type: 'hero-slide', icon: '🎬', title: 'Hero Carousel', desc: 'Gambar untuk carousel hero (bisa banyak)', hasImage: true, isText: true, multiple: true },
                    { type: 'sidebar-product', icon: '🛍️', title: 'Sidebar Product', desc: 'Card produk di sidebar (max 3)', hasImage: true, isText: true, multiple: true },
                    { type: 'categories-title', icon: '📂', title: 'Judul Kategori', desc: 'Text "Produk Terbaru"', hasImage: false, isText: true, multiple: false }
                  ].map((item) => {
                    const existingAds = advertisements?.filter(ad => ad.type === item.type && ad.position === 'homepage') || []
                    const existingAd = existingAds[0]
                    return (
                      <div key={item.type} className={`bg-white rounded-lg p-4 border-2 transition-colors ${item.hasImage
                        ? 'border-blue-200 hover:border-blue-300 bg-blue-50/30'
                        : 'border-green-200 hover:border-green-300 bg-green-50/30'
                        }`}>
                        <div className="text-center">
                          <div className="text-2xl mb-2">{item.icon}</div>
                          <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-500 mb-2">{item.desc}</p>

                          {/* Type Indicator */}
                          <div className="flex gap-1 justify-center mb-3">
                            {item.isText && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                📝 Text
                              </span>
                            )}
                            {item.hasImage && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                🖼️ Image
                              </span>
                            )}
                          </div>

                          {item.multiple ? (
                            <div className="space-y-2">
                              {existingAds.length > 0 && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  ✓ {existingAds.length} item
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  const newAd = {
                                    type: item.type,
                                    position: 'homepage',
                                    title: '',
                                    description: '',
                                    image: '',
                                    link: '',
                                    isActive: true,
                                    startDate: new Date().toISOString().split('T')[0],
                                    endDate: null,
                                    priority: existingAds.length
                                  }
                                  handleCreate('advertisements', newAd)
                                }}
                                className="w-full text-xs bg-pink-600 text-white px-3 py-2 rounded hover:bg-pink-700 transition-colors"
                              >
                                + Tambah
                              </button>
                              {existingAds.length > 0 && (
                                <button
                                  onClick={() => {
                                    setCurrentEntity('advertisements')
                                    setActiveTab('advertisements')
                                  }}
                                  className="w-full text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition-colors"
                                >
                                  Lihat Semua
                                </button>
                              )}
                            </div>
                          ) : existingAd ? (
                            <div className="space-y-2">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                ✓ Sudah diatur
                              </span>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleEdit('advertisements', existingAd)}
                                  className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleView('advertisements', existingAd)}
                                  className="flex-1 text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                                >
                                  Lihat
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                const newAd = {
                                  type: item.type,
                                  position: 'homepage',
                                  title: '',
                                  description: '',
                                  image: '',
                                  link: '',
                                  isActive: true,
                                  startDate: new Date().toISOString().split('T')[0],
                                  endDate: null,
                                  priority: 0
                                }
                                handleCreate('advertisements', newAd)
                              }}
                              className="w-full text-xs bg-pink-600 text-white px-3 py-2 rounded hover:bg-pink-700 transition-colors"
                            >
                              + Tambah
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 space-y-4">
                  {/* Legend */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Jenis Elemen:</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded"></div>
                        <span className="text-sm text-gray-700">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 mr-2">📝 Text</span>
                          Elemen yang hanya mengatur text/tulisan
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-100 border-2 border-blue-200 rounded"></div>
                        <span className="text-sm text-gray-700">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-2">🖼️ Image</span>
                          Elemen yang mengatur gambar/icon
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <strong>Tips:</strong>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li><strong>Text Elements:</strong> Atur Title dan Description untuk mengubah text</li>
                          <li><strong>Image Elements:</strong> Atur Image URL untuk mengubah gambar, Title untuk alt text</li>
                          <li>Semua perubahan akan terlihat real-time di homepage</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul Iklan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posisi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(advertisements || []).length > 0 ? (
                      (advertisements || []).map((ad) => (
                        <tr key={ad.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <img
                              src={ad.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100'}
                              alt={ad.title}
                              className="w-20 h-16 object-cover rounded-lg border"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{ad.title}</div>
                            <div className="text-sm text-gray-500">{ad.description?.substring(0, 50)}...</div>
                            {ad.link && (
                              <div className="text-xs text-blue-600 mt-1">
                                Link: {ad.link}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ad.type === 'banner'
                              ? 'bg-purple-100 text-purple-800'
                              : ad.type === 'promo'
                                ? 'bg-orange-100 text-orange-800'
                                : ad.type === 'hero-slide'
                                  ? 'bg-purple-100 text-purple-800'
                                  : ad.type === 'sidebar-product'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}>
                              {ad.type === 'banner' ? 'Banner'
                                : ad.type === 'promo' ? 'Promo'
                                  : ad.type === 'hero-slide' ? 'Hero Carousel'
                                    : ad.type === 'sidebar-product' ? 'Sidebar Product'
                                      : ad.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-600 capitalize">{ad.position}</span>
                              {ad.position === 'sidebar' && ad.isActive && (
                                <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Homepage
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ad.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {ad.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div>
                              <div>Mulai: {ad.startDate ? new Date(ad.startDate).toLocaleDateString('id-ID') : '-'}</div>
                              <div>Selesai: {ad.endDate ? new Date(ad.endDate).toLocaleDateString('id-ID') : 'Tidak terbatas'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleView('advertisements', ad)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Lihat"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('advertisements', ad)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('advertisements', ad)}
                                className="text-red-600 hover:text-red-900"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleAdStatus(ad)}
                                className={`${ad.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                title={ad.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {ad.isActive ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                            <p>Belum ada iklan tersedia</p>
                            <p className="text-sm text-gray-400">Tambahkan iklan pertama untuk frontend</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Total Iklan</p>
                      <p className="text-lg font-semibold text-gray-900">{(advertisements || []).length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">✓</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Iklan Aktif</p>
                      <p className="text-lg font-semibold text-gray-900">{(advertisements || []).filter(ad => ad.isActive).length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">B</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Banner</p>
                      <p className="text-lg font-semibold text-gray-900">{(advertisements || []).filter(ad => ad.type === 'banner').length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">P</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Promo</p>
                      <p className="text-lg font-semibold text-gray-900">{(advertisements || []).filter(ad => ad.type === 'promo').length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'website-settings' && hasPermission(user?.role || 'USER', 'website-settings') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manajemen UI-FRONTEND</h2>
              </div>

              {/* Debug Component */}
              <LogoDebug />

              {websiteSettings ? (
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6">
                    {/* Favicon & Site Title Section */}
                    <div className="mb-8 pb-8 border-b">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Favicon & Judul Website</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Favicon */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <label className="block text-sm font-medium text-purple-800 mb-2">
                            🔖 Favicon (Icon Tab Browser)
                          </label>
                          <div className="space-y-2">
                            {websiteSettings.favicon && (
                              <div className="w-16 h-16 bg-white border rounded-lg p-2 flex items-center justify-center">
                                <img
                                  src={websiteSettings.favicon}
                                  alt="Current Favicon"
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return

                                // Show loading
                                setLoading(true)
                                console.log('📤 Uploading favicon:', file.name, 'Size:', file.size, 'Type:', file.type)

                                const formData = new FormData()
                                formData.append('logo', file) // API expects 'logo' field name
                                
                                try {
                                  const response = await fetch('/api/upload/logo', {
                                    method: 'POST',
                                    body: formData
                                  })
                                  
                                  const data = await response.json()
                                  console.log('📊 Upload response:', data)
                                  
                                  if (data.success && (data.url || data.logoUrl)) {
                                    const faviconUrl = data.url || data.logoUrl
                                    setWebsiteSettings({ ...websiteSettings, favicon: faviconUrl })
                                    console.log('✅ Favicon URL set to:', faviconUrl)
                                    alert('✅ Favicon berhasil diupload! Jangan lupa klik "Simpan Pengaturan"')
                                  } else {
                                    throw new Error(data.error || 'Upload failed')
                                  }
                                } catch (error) {
                                  console.error('❌ Error uploading favicon:', error)
                                  alert('❌ Gagal upload favicon: ' + (error instanceof Error ? error.message : 'Unknown error'))
                                } finally {
                                  setLoading(false)
                                  // Reset input
                                  e.target.value = ''
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
                              disabled={loading}
                            />
                            {loading && <p className="text-xs text-blue-600">⏳ Uploading favicon...</p>}
                            <p className="text-xs text-purple-600">Ukuran ideal: 32x32 px atau 64x64 px (PNG/ICO)</p>
                          </div>
                        </div>

                        {/* Site Title & Description */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📝 Judul Website (Tab Browser)
                            </label>
                            <input
                              type="text"
                              value={websiteSettings.siteTitle || 'Betarak - Store Warehouse Solution'}
                              onChange={(e) => setWebsiteSettings({ ...websiteSettings, siteTitle: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Betarak - Store Warehouse Solution"
                            />
                            <p className="text-xs text-gray-500 mt-1">Muncul di tab browser & hasil pencarian Google</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📄 Deskripsi Website (SEO)
                            </label>
                            <textarea
                              value={websiteSettings.siteDescription || ''}
                              onChange={(e) => setWebsiteSettings({ ...websiteSettings, siteDescription: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={3}
                              placeholder="Deskripsi singkat website untuk SEO..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Muncul di hasil pencarian Google (max 160 karakter)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Logo & Company Info */}
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo & Informasi Perusahaan</h3>

                          <div className="space-y-6">
                            {/* Header Logo */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <label className="block text-sm font-medium text-blue-800 mb-2">
                                🏢 Logo Header (Navbar)
                              </label>
                              <div className="space-y-2">
                                {websiteSettings.logoHeaderUrl && (
                                  <div className="w-24 h-24 bg-white border rounded-lg p-2 flex items-center justify-center">
                                    <img
                                      src={websiteSettings.logoHeaderUrl}
                                      alt="Current Header Logo"
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleHeaderLogoUpload(e)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                                <p className="text-xs text-blue-600">Upload logo untuk header/navbar website</p>
                              </div>
                            </div>

                            {/* Footer Logo */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <label className="block text-sm font-medium text-gray-800 mb-2">
                                📄 Logo Footer
                              </label>
                              <div className="space-y-2">
                                {websiteSettings.logoUrl && (
                                  <div className="w-24 h-24 bg-white border rounded-lg p-2 flex items-center justify-center">
                                    <img
                                      src={websiteSettings.logoUrl}
                                      alt="Current Footer Logo"
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleLogoUpload(e)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                                <p className="text-xs text-gray-600">Upload logo untuk footer website</p>
                              </div>
                            </div>

                            {/* Header Logo Zoom */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <label className="block text-sm font-medium text-blue-800 mb-2">
                                🔍 Zoom Logo Header
                              </label>
                              <div className="space-y-4">
                                {/* Preview Header Logo */}
                                <div className="bg-white p-4 rounded-lg border">
                                  <p className="text-xs text-blue-600 mb-2 text-center">Preview Logo di Header:</p>
                                  <div className="flex justify-center">
                                    <div
                                      className="bg-white shadow-lg flex items-center justify-center transition-all duration-300 px-4 py-2 rounded"
                                      style={{
                                        height: `${40 * (websiteSettings.logoHeaderZoom / 100)}px`,
                                      }}
                                    >
                                      {websiteSettings.logoHeaderUrl ? (
                                        <img
                                          src={websiteSettings.logoHeaderUrl}
                                          alt="Header Logo Preview"
                                          className="object-contain transition-all duration-300"
                                          style={{
                                            height: '100%',
                                            transform: `scale(${websiteSettings.logoHeaderZoom / 100})`
                                          }}
                                        />
                                      ) : (
                                        <div className="text-gray-400 text-xs">No Header Logo</div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Header Zoom Slider */}
                                <input
                                  type="range"
                                  min="50"
                                  max="200"
                                  step="10"
                                  value={websiteSettings.logoHeaderZoom}
                                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, logoHeaderZoom: parseInt(e.target.value) })}
                                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                                    [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                                />
                                <div className="flex justify-between text-xs text-blue-600">
                                  <span>50%</span>
                                  <span className="font-medium">{websiteSettings.logoHeaderZoom}%</span>
                                  <span>200%</span>
                                </div>
                                <p className="text-xs text-blue-600">Atur ukuran logo di header/navbar</p>
                              </div>
                            </div>

                            {/* Footer Logo Zoom */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <label className="block text-sm font-medium text-gray-800 mb-2">
                                🔍 Zoom Logo Footer
                              </label>
                              <div className="space-y-4">
                                {/* Preview Footer Logo */}
                                <div className="bg-gray-900 p-4 rounded-lg">
                                  <p className="text-xs text-gray-300 mb-2 text-center">Preview Logo di Footer:</p>
                                  <div className="flex justify-center">
                                    <div
                                      className="bg-white rounded-full p-4 shadow-lg flex items-center justify-center transition-all duration-300"
                                      style={{
                                        width: `${80 * (websiteSettings.logoZoom / 100)}px`,
                                        height: `${80 * (websiteSettings.logoZoom / 100)}px`,
                                      }}
                                    >
                                      {websiteSettings.logoUrl ? (
                                        <img
                                          src={websiteSettings.logoUrl}
                                          alt="Footer Logo Preview"
                                          className="object-contain transition-all duration-300"
                                          style={{
                                            maxWidth: '90%',
                                            height: 'auto',
                                            transform: `scale(${websiteSettings.logoZoom / 100})`
                                          }}
                                        />
                                      ) : (
                                        <div className="text-gray-400 text-xs">No Footer Logo</div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Footer Zoom Slider */}
                                <input
                                  type="range"
                                  min="50"
                                  max="200"
                                  step="10"
                                  value={websiteSettings.logoZoom}
                                  onChange={(e) => setWebsiteSettings({ ...websiteSettings, logoZoom: parseInt(e.target.value) })}
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 
                                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-600 [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full 
                                    [&::-moz-range-thumb]:bg-gray-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none"
                                />
                                <div className="flex justify-between text-xs text-gray-600">
                                  <span>50%</span>
                                  <span className="font-medium">{websiteSettings.logoZoom}%</span>
                                  <span>200%</span>
                                </div>
                                <p className="text-xs text-gray-600">Atur ukuran logo di footer</p>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Perusahaan
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.companyName}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, companyName: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Betarak"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deskripsi Perusahaan
                              </label>
                              <textarea
                                rows={3}
                                value={websiteSettings.companyDescription}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, companyDescription: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Deskripsi perusahaan..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Hero Section Contact Info */}
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <h3 className="text-lg font-semibold text-purple-800 mb-4">🎯 Kontak Info Hero Section</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">
                                WhatsApp Hero
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.heroWhatsapp}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, heroWhatsapp: e.target.value })}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="+62 812-3456-7890"
                              />
                              <p className="text-xs text-purple-600 mt-1">Nomor WhatsApp yang tampil di hero section</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">
                                Email Hero
                              </label>
                              <input
                                type="email"
                                value={websiteSettings.heroEmail}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, heroEmail: e.target.value })}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="info@betarak.com"
                              />
                              <p className="text-xs text-purple-600 mt-1">Email yang tampil di hero section</p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-purple-700 mb-2">
                                Jam Operasional Hero
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.heroOperatingHours}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, heroOperatingHours: e.target.value })}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Senin - Jumat WIB"
                              />
                              <p className="text-xs text-purple-600 mt-1">Jam operasional yang tampil di hero section</p>
                            </div>
                          </div>
                        </div>

                        {/* Payment Settings */}
                        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                          <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                            💳 Pengaturan Pembayaran WhatsApp
                          </h3>
                          <p className="text-xs text-green-700 mb-4">
                            Nomor WhatsApp ini akan digunakan untuk sistem pembayaran di checkout page
                          </p>

                          <div>
                            <label className="block text-sm font-medium text-green-700 mb-2">
                              Nomor WhatsApp Pembayaran *
                            </label>
                            <input
                              type="text"
                              value={websiteSettings.paymentWhatsappNumber || '+62 813-4007-8956'}
                              onChange={(e) => setWebsiteSettings({ ...websiteSettings, paymentWhatsappNumber: e.target.value })}
                              className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                              placeholder="+62 812-3456-7890"
                            />
                            <p className="text-xs text-green-600 mt-1">
                              ⚠️ Nomor ini akan digunakan customer saat checkout untuk pembayaran via WhatsApp
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Format: +62 xxx-xxxx-xxxx (dengan kode negara)
                            </p>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Alamat
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.address}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, address: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Jl. Industri Raya No. 123, Jakarta"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telepon
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.phone}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="+62 21-1234-5678"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                WhatsApp
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.whatsapp}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, whatsapp: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="+62 812-3456-7890"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                              </label>
                              <input
                                type="email"
                                value={websiteSettings.email}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="info@betarak.com"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Operating Hours & Service Areas */}
                      <div className="space-y-6">
                        {/* Operating Hours */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jam Operasional</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Senin - Jumat
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.mondayFriday}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, mondayFriday: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="08:00 - 17:00 WIB"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sabtu
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.saturday}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, saturday: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="08:00 - 15:00 WIB"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Minggu
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.sunday}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, sunday: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tutup"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Service Areas */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Area Layanan</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kota Layanan
                              </label>
                              <textarea
                                rows={3}
                                value={websiteSettings.serviceAreas}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, serviceAreas: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Jabodetabek, Bandung, Surabaya..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Catatan Khusus
                              </label>
                              <input
                                type="text"
                                value={websiteSettings.specialNote}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, specialNote: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="*Pengiriman ke seluruh Indonesia"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Social Media */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h3>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Facebook URL
                              </label>
                              <input
                                type="url"
                                value={websiteSettings.facebookUrl}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, facebookUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://facebook.com/betarak"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Instagram URL
                              </label>
                              <input
                                type="url"
                                value={websiteSettings.instagramUrl}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, instagramUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://instagram.com/betarak"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                YouTube URL
                              </label>
                              <input
                                type="url"
                                value={websiteSettings.youtubeUrl}
                                onChange={(e) => setWebsiteSettings({ ...websiteSettings, youtubeUrl: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://youtube.com/@betarak"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Copyright */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Copyright</h3>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Teks Copyright
                            </label>
                            <input
                              type="text"
                              value={websiteSettings.copyrightText}
                              onChange={(e) => setWebsiteSettings({ ...websiteSettings, copyrightText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="© 2024 Betarak Indonesia. Semua hak dilindungi undang-undang."
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
                      <button
                        onClick={() => fetchWebsiteSettings()}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleSaveWebsiteSettings()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Memuat Pengaturan Website...</h3>
                    <p className="text-gray-500">Mohon tunggu sebentar</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TESTIMONIALS MANAGEMENT */}
          {activeTab === 'testimonials' && hasPermission(user?.role || 'USER', 'testimonials') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Manajemen Testimoni</h2>
                <button
                  onClick={() => handleCreate('testimonials')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Tambah Testimoni</span>
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAMA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PERUSAHAAN</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RATING</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PROYEK</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {testimonials.map((testimonial) => (
                        <tr key={testimonial.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{testimonial.name}</div>
                              <div className="text-sm text-gray-500">{testimonial.position}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{testimonial.company || '-'}</div>
                            <div className="text-sm text-gray-500">{testimonial.location || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-2 text-sm text-gray-600">({testimonial.rating}/5)</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{testimonial.project || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${testimonial.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {testimonial.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                              {testimonial.isFeatured && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Featured
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView('testimonials', testimonial)}
                                className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                                title="Lihat Detail"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit('testimonials', testimonial)}
                                className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded transition-colors"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete('testimonials', testimonial)}
                                className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                                title="Hapus"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {testimonials.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-gray-500">Belum ada testimoni</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* KARIR MANAGEMENT */}
          {activeTab === 'sequel' && hasPermission(user?.role || 'USER', 'sequel') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Manajemen Karir</h2>
                  <p className="text-sm text-gray-600 mt-1">Kelola lowongan pekerjaan dan pengaturan karir</p>
                </div>
                <div className="flex items-center space-x-3">
                  <a
                    href="/karir"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    <EyeIcon className="w-5 h-5" />
                    <span>Lihat Halaman</span>
                  </a>
                  <button
                    onClick={() => handleCreate('sequel')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    <span>Tambah Lowongan</span>
                  </button>
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">✨ Sistem CRUD Aktif</h4>
                    <p className="text-sm text-blue-700">
                      Semua fitur CRUD (Create, Read, Update, Delete) untuk Karir sudah aktif dan berfungsi secara real-time.
                      Perubahan akan langsung tersinkronisasi dengan halaman frontend.
                    </p>
                  </div>
                </div>
              </div>

              {/* Sequel Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Lowongan</p>
                      <p className="text-2xl font-bold text-blue-900">{sequelArticles.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Lowongan Aktif</p>
                      <p className="text-2xl font-bold text-green-900">{sequelArticles.filter(a => a.isActive).length}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">Status</p>
                      <p className="text-lg font-bold text-purple-900">
                        {sequelSettings?.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sequel Settings */}
              {sequelSettings && (
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Karir</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
                      <input
                        type="text"
                        value={sequelSettings.heroTitle}
                        onChange={(e) => setSequelSettings({ ...sequelSettings, heroTitle: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subtitle</label>
                      <textarea
                        value={sequelSettings.heroSubtitle}
                        onChange={(e) => setSequelSettings({ ...sequelSettings, heroSubtitle: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                      <textarea
                        value={sequelSettings.companyDescription}
                        onChange={(e) => setSequelSettings({ ...sequelSettings, companyDescription: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pilihan Tipe Pekerjaan</label>
                      <textarea
                        value={sequelSettings.employmentTypes ?
                          (typeof sequelSettings.employmentTypes === 'string' && sequelSettings.employmentTypes.startsWith('[')
                            ? JSON.parse(sequelSettings.employmentTypes).join('\n')
                            : sequelSettings.employmentTypes)
                          : 'Full-time\nPart-time\nContract\nInternship\nFreelance'}
                        onChange={(e) => setSequelSettings({
                          ...sequelSettings,
                          employmentTypes: JSON.stringify(
                            e.target.value.split('\n').map(line => line.trim()).filter(line => line.length > 0)
                          )
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                        rows={6}
                        placeholder="Full-time&#10;Part-time&#10;Contract&#10;Internship&#10;Freelance"
                      />
                      <p className="text-xs text-gray-500 mt-1">Satu tipe pekerjaan per baris. Pilihan ini akan muncul di dropdown saat tambah/edit lowongan.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email HR</label>
                      <input
                        type="email"
                        value={sequelSettings.hrEmail}
                        onChange={(e) => setSequelSettings({ ...sequelSettings, hrEmail: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        placeholder="hr@betarak.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instruksi Melamar</label>
                      <textarea
                        value={sequelSettings.applicationInstructions}
                        onChange={(e) => setSequelSettings({ ...sequelSettings, applicationInstructions: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        rows={3}
                      />
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Pengaturan Detail Lowongan</h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Judul Card Melamar</label>
                          <input
                            type="text"
                            value={sequelSettings.applyCardTitle || 'Tertarik Melamar?'}
                            onChange={(e) => setSequelSettings({ ...sequelSettings, applyCardTitle: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Tertarik Melamar?"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Text Tombol Melamar</label>
                          <input
                            type="text"
                            value={sequelSettings.applyButtonText || 'Kirim Lamaran'}
                            onChange={(e) => setSequelSettings({ ...sequelSettings, applyButtonText: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Kirim Lamaran"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Judul Card Bagikan</label>
                          <input
                            type="text"
                            value={sequelSettings.shareCardTitle || 'Bagikan Lowongan'}
                            onChange={(e) => setSequelSettings({ ...sequelSettings, shareCardTitle: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Bagikan Lowongan"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nomor WhatsApp Share (opsional)</label>
                          <input
                            type="text"
                            value={sequelSettings.whatsappShareNumber || ''}
                            onChange={(e) => setSequelSettings({ ...sequelSettings, whatsappShareNumber: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="+62812345678 (kosongkan untuk share biasa)"
                          />
                          <p className="text-xs text-gray-500 mt-1">Jika diisi, tombol WhatsApp akan langsung chat ke nomor ini</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Text Tombol WhatsApp</label>
                          <input
                            type="text"
                            value={sequelSettings.whatsappButtonText || 'WhatsApp'}
                            onChange={(e) => setSequelSettings({ ...sequelSettings, whatsappButtonText: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="WhatsApp"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Text Tombol Salin Link</label>
                          <input
                            type="text"
                            value={sequelSettings.copyLinkButtonText || 'Salin Link'}
                            onChange={(e) => setSequelSettings({ ...sequelSettings, copyLinkButtonText: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="Salin Link"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveSequelSettings}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Postings List */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daftar Lowongan</h3>

                {sequelArticles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Belum ada lowongan</p>
                    <p className="text-sm mt-2">Klik "Tambah Lowongan" untuk membuat lowongan baru</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sequelArticles.map((article) => (
                      <div key={article.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{article.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.excerpt}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${article.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {article.isActive ? 'Aktif' : 'Nonaktif'}
                              </span>
                              <span className="text-xs text-gray-500">Order: {article.sortOrder}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => window.open(`/karir/${article.slug}`, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Lihat"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit('sequel', article)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('sequel', article)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Hapus"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STORYLINE MANAGEMENT */}
          {activeTab === 'storyline' && hasPermission(user?.role || 'USER', 'storyline') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Manajemen Storyline</h2>
                  <p className="text-sm text-gray-600 mt-1">Kelola section "Our Storyline" dan "Latest Catalog" di homepage</p>
                </div>
                <div className="flex items-center space-x-3">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    <EyeIcon className="w-5 h-5" />
                    <span>Lihat Homepage</span>
                  </a>
                </div>
              </div>

              {storyline ? (
                <div className="space-y-6">
                  {/* Our Storyline Section */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📖</span>
                      Our Storyline Section
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Judul Kecil
                          </label>
                          <input
                            type="text"
                            value={storyline.smallTitle}
                            onChange={(e) => setStoryline({ ...storyline, smallTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Our Storyline,"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link URL
                          </label>
                          <input
                            type="text"
                            value={storyline.linkUrl}
                            onChange={(e) => setStoryline({ ...storyline, linkUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="/about"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Judul Utama
                        </label>
                        <input
                          type="text"
                          value={storyline.mainTitle}
                          onChange={(e) => setStoryline({ ...storyline, mainTitle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Some Journey Can't be Seen, Only Felt."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Konten Cerita
                        </label>
                        <textarea
                          rows={10}
                          value={storyline.content}
                          onChange={(e) => setStoryline({ ...storyline, content: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                          placeholder="Tulis cerita Anda di sini..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Gunakan Enter untuk membuat paragraf baru</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Link
                          </label>
                          <input
                            type="text"
                            value={storyline.linkText}
                            onChange={(e) => setStoryline({ ...storyline, linkText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="The line continues →"
                          />
                        </div>

                        <div>
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={storyline.isActive}
                              onChange={(e) => setStoryline({ ...storyline, isActive: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Tampilkan di Homepage</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <ImageUpload
                          value={storyline.image || ''}
                          onChange={async (url) => {
                            console.log('🖼️ Storyline image uploaded:', url)
                            const updatedStoryline = { ...storyline, image: url }
                            setStoryline(updatedStoryline)

                            // Auto-save after image upload with the UPDATED data
                            console.log('🔄 Auto-saving storyline after image upload...')
                            setSaveStatus('💾 Menyimpan gambar...')
                            setAutoSaving(true)

                            try {
                              // Save directly with updated data (don't wait for state update)
                              const response = await fetch('/api/storyline', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedStoryline)
                              })

                              const data = await response.json()
                              console.log('📊 Storyline save response:', data)

                              if (data.success) {
                                console.log('✅ Gambar storyline berhasil disimpan ke database!')
                                setSaveStatus('✅ Gambar berhasil disimpan!')

                                // Broadcast update via WebSocket
                                if (socket && isConnected) {
                                  socket.emit('admin_update', {
                                    action: 'storyline_updated',
                                    storyline: data.data,
                                    timestamp: new Date().toISOString()
                                  })
                                }

                                setTimeout(() => setSaveStatus(''), 3000)
                              } else {
                                console.error('❌ Error saving storyline:', data.error)
                                setSaveStatus('❌ Gagal menyimpan: ' + (data.error || 'Unknown error'))
                                setStoryline(storyline) // Rollback
                                setTimeout(() => setSaveStatus(''), 5000)
                              }
                            } catch (error) {
                              console.error('❌ Error saving storyline:', error)
                              setSaveStatus('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'))
                              setStoryline(storyline) // Rollback
                              setTimeout(() => setSaveStatus(''), 5000)
                            } finally {
                              setAutoSaving(false)
                            }
                          }}
                          label="Gambar Storyline (Kanan)"
                          placeholder="Upload gambar untuk section storyline"
                          folder="storyline"
                        />

                        {/* Save Status Indicator */}
                        {(autoSaving || saveStatus) && (
                          <div className={`mt-2 p-2 rounded-md text-sm ${saveStatus.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' :
                            saveStatus.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                            {saveStatus || '💾 Menyimpan...'}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                          💡 Gambar akan otomatis tersimpan setelah upload selesai
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Latest Catalog Section */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="text-2xl mr-2">📸</span>
                      Latest Catalog Section
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Judul Catalog
                          </label>
                          <input
                            type="text"
                            value={storyline.catalogTitle}
                            onChange={(e) => setStoryline({ ...storyline, catalogTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Latest Catalog"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subjudul (Merah)
                          </label>
                          <input
                            type="text"
                            value={storyline.catalogSubtitle}
                            onChange={(e) => setStoryline({ ...storyline, catalogSubtitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="THE FIRST BORN"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deskripsi Catalog
                        </label>
                        <textarea
                          rows={2}
                          value={storyline.catalogDescription}
                          onChange={(e) => setStoryline({ ...storyline, catalogDescription: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Embrace and mark your journey with us..."
                        />
                      </div>

                      {/* Catalog Images */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Gambar Catalog (Gallery)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {storyline.catalogImages && storyline.catalogImages.map((imageUrl: string, index: number) => (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Catalog ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                              <button
                                onClick={async () => {
                                  const newImages = storyline.catalogImages.filter((_: any, i: number) => i !== index)
                                  const updatedStoryline = { ...storyline, catalogImages: newImages }
                                  setStoryline(updatedStoryline)

                                  // Auto-save after delete with the UPDATED data
                                  console.log('🗑️ Auto-saving after deleting catalog image...')
                                  setSaveStatus('💾 Menghapus gambar...')
                                  setAutoSaving(true)

                                  try {
                                    // Save directly with updated data
                                    const response = await fetch('/api/storyline', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(updatedStoryline)
                                    })

                                    const data = await response.json()

                                    if (data.success) {
                                      console.log('✅ Gambar catalog berhasil dihapus dari database!')
                                      setSaveStatus('✅ Gambar berhasil dihapus!')

                                      // Broadcast update via WebSocket
                                      if (socket && isConnected) {
                                        socket.emit('admin_update', {
                                          action: 'storyline_updated',
                                          storyline: data.data,
                                          timestamp: new Date().toISOString()
                                        })
                                      }

                                      setTimeout(() => setSaveStatus(''), 3000)
                                    } else {
                                      setSaveStatus('❌ Gagal menghapus')
                                      setStoryline({ ...storyline, catalogImages: storyline.catalogImages }) // Rollback
                                      setTimeout(() => setSaveStatus(''), 5000)
                                    }
                                  } catch (error) {
                                    setSaveStatus('❌ Error menghapus')
                                    setStoryline({ ...storyline, catalogImages: storyline.catalogImages }) // Rollback
                                    setTimeout(() => setSaveStatus(''), 5000)
                                  } finally {
                                    setAutoSaving(false)
                                  }
                                }}
                                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <ImageUpload
                          value=""
                          onChange={async (url) => {
                            console.log('🖼️ Catalog image uploaded:', url)
                            const newImages = [...(storyline.catalogImages || []), url]
                            const updatedStoryline = { ...storyline, catalogImages: newImages }
                            setStoryline(updatedStoryline)

                            // Auto-save after image upload with the UPDATED data
                            console.log('🔄 Auto-saving storyline after catalog image upload...')
                            setSaveStatus('💾 Menyimpan gambar catalog...')
                            setAutoSaving(true)

                            try {
                              // Save directly with updated data (don't wait for state update)
                              const response = await fetch('/api/storyline', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(updatedStoryline)
                              })

                              const data = await response.json()
                              console.log('📊 Catalog save response:', data)

                              if (data.success) {
                                console.log('✅ Gambar catalog berhasil disimpan ke database!')
                                setSaveStatus('✅ Gambar catalog berhasil disimpan!')

                                // Broadcast update via WebSocket
                                if (socket && isConnected) {
                                  socket.emit('admin_update', {
                                    action: 'storyline_updated',
                                    storyline: data.data,
                                    timestamp: new Date().toISOString()
                                  })
                                }

                                setTimeout(() => setSaveStatus(''), 3000)
                              } else {
                                console.error('❌ Error saving catalog:', data.error)
                                setSaveStatus('❌ Gagal menyimpan: ' + (data.error || 'Unknown error'))
                                setStoryline({ ...storyline, catalogImages: storyline.catalogImages }) // Rollback
                                setTimeout(() => setSaveStatus(''), 5000)
                              }
                            } catch (error) {
                              console.error('❌ Error saving catalog:', error)
                              setSaveStatus('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'))
                              setStoryline({ ...storyline, catalogImages: storyline.catalogImages }) // Rollback
                              setTimeout(() => setSaveStatus(''), 5000)
                            } finally {
                              setAutoSaving(false)
                            }
                          }}
                          label="Tambah Gambar Baru"
                          placeholder="Upload gambar untuk catalog gallery"
                          folder="catalog"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Gambar akan otomatis tersimpan setelah upload. Rekomendasi: 3-4 gambar
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSaveStoryline()}
                      disabled={loading}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {loading ? 'Menyimpan...' : '💾 Simpan Storyline'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                  <p className="text-gray-500 mt-4">Loading storyline...</p>
                </div>
              )}
            </div>
          )}

          {/* CONTACT SETTINGS MANAGEMENT */}
          {activeTab === 'contact-settings' && hasPermission(user?.role || 'USER', 'contact-settings') && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Pengaturan Kontak Info</h2>
                  <p className="text-sm text-gray-600 mt-1">Kelola informasi kontak yang ditampilkan di halaman kontak</p>
                </div>
                <div className="flex items-center space-x-3">
                  <a
                    href="/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    <EyeIcon className="w-5 h-5" />
                    <span>Lihat Halaman</span>
                  </a>
                </div>
              </div>

              {contactSettings ? (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="space-y-8">
                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Kontak</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alamat
                          </label>
                          <textarea
                            rows={4}
                            value={contactSettings.address}
                            onChange={(e) => setContactSettings({ ...contactSettings, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Jl. Industri Raya No. 123&#10;Jakarta Timur 13440&#10;Indonesia"
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Telepon
                            </label>
                            <input
                              type="text"
                              value={contactSettings.phone}
                              onChange={(e) => setContactSettings({ ...contactSettings, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="+62 21-1234-5678"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              WhatsApp
                            </label>
                            <input
                              type="text"
                              value={contactSettings.whatsapp}
                              onChange={(e) => setContactSettings({ ...contactSettings, whatsapp: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="+62 812-3456-7890"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email
                            </label>
                            <input
                              type="email"
                              value={contactSettings.email}
                              onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="info@betarak.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operating Hours & Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Jam Operasional</h3>
                        <textarea
                          rows={5}
                          value={contactSettings.operatingHours}
                          onChange={(e) => setContactSettings({ ...contactSettings, operatingHours: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Senin - Jumat: 08:00 - 17:00 WIB&#10;Sabtu: 08:00 - 15:00 WIB&#10;Minggu: Tutup"
                        />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tombol Kontak</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Teks Tombol WhatsApp
                            </label>
                            <input
                              type="text"
                              value={contactSettings.whatsappButtonText}
                              onChange={(e) => setContactSettings({ ...contactSettings, whatsappButtonText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Chat WhatsApp"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Teks Tombol Telepon
                            </label>
                            <input
                              type="text"
                              value={contactSettings.phoneButtonText}
                              onChange={(e) => setContactSettings({ ...contactSettings, phoneButtonText: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Telepon Marketing"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Map Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Peta & Lokasi</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Judul Peta
                          </label>
                          <textarea
                            rows={2}
                            value={contactSettings.mapTitle}
                            onChange={(e) => setContactSettings({ ...contactSettings, mapTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Peta Lokasi&#10;Kunjungi toko kami secara langsung"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL Embed Google Maps (Opsional)
                          </label>
                          <input
                            type="url"
                            value={contactSettings.mapEmbedUrl || ''}
                            onChange={(e) => setContactSettings({ ...contactSettings, mapEmbedUrl: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://www.google.com/maps/embed?pb=..."
                          />
                          <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin menampilkan peta</p>
                        </div>
                      </div>
                    </div>

                    {/* Page Content */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Konten Halaman</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Judul Halaman
                          </label>
                          <input
                            type="text"
                            value={contactSettings.pageTitle}
                            onChange={(e) => setContactSettings({ ...contactSettings, pageTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Hubungi Kami"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deskripsi Halaman
                          </label>
                          <textarea
                            rows={3}
                            value={contactSettings.pageDescription}
                            onChange={(e) => setContactSettings({ ...contactSettings, pageDescription: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan rak dan perlengkapan toko Anda."
                          />
                        </div>
                      </div>
                    </div>

                    {/* FAQ Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">FAQ (Pertanyaan yang Sering Diajukan)</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Judul FAQ
                          </label>
                          <input
                            type="text"
                            value={contactSettings.faqTitle}
                            onChange={(e) => setContactSettings({ ...contactSettings, faqTitle: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Pertanyaan yang Sering Diajukan"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Daftar FAQ
                          </label>
                          <div className="space-y-3">
                            {contactSettings.faqItems.map((faq, index) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Pertanyaan {index + 1}
                                    </label>
                                    <input
                                      type="text"
                                      value={faq.question}
                                      onChange={(e) => {
                                        const newFaqItems = [...contactSettings.faqItems]
                                        newFaqItems[index].question = e.target.value
                                        setContactSettings({ ...contactSettings, faqItems: newFaqItems })
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      placeholder="Pertanyaan FAQ"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Jawaban {index + 1}
                                    </label>
                                    <textarea
                                      rows={3}
                                      value={faq.answer}
                                      onChange={(e) => {
                                        const newFaqItems = [...contactSettings.faqItems]
                                        newFaqItems[index].answer = e.target.value
                                        setContactSettings({ ...contactSettings, faqItems: newFaqItems })
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      placeholder="Jawaban FAQ"
                                    />
                                  </div>
                                  <div className="flex justify-end">
                                    <button
                                      onClick={() => {
                                        const newFaqItems = contactSettings.faqItems.filter((_, i) => i !== index)
                                        setContactSettings({ ...contactSettings, faqItems: newFaqItems })
                                      }}
                                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                      Hapus FAQ
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => {
                                const newFaqItems = [...contactSettings.faqItems, { question: '', answer: '' }]
                                setContactSettings({ ...contactSettings, faqItems: newFaqItems })
                              }}
                              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                            >
                              + Tambah FAQ Baru
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <button
                        onClick={() => fetchContactSettings()}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleSaveContactSettings()}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Memuat Pengaturan Kontak...</h3>
                    <p className="text-gray-500">Mohon tunggu sebentar</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Universal fallback for unauthorized access */}
          {activeTab !== 'dashboard' &&
            !hasPermission(user?.role || 'USER', activeTab as any) &&
            getAccessibleTabs(user?.role || 'USER').every(tab => tab.id !== activeTab) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V7m0 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Akses Tidak Diizinkan</h3>
                  <p className="text-gray-600 mb-4">
                    Role Anda ({roleDisplayNames[user?.role as keyof typeof roleDisplayNames] || user?.role || 'User'})
                    tidak memiliki akses ke fitur ini.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Fitur yang dapat Anda akses:</p>
                    <div className="flex flex-wrap gap-2">
                      {getAccessibleTabs(user?.role || 'USER').map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          {tab.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Silakan hubungi administrator untuk upgrade akses.</p>
                </div>
              </div>
            )}
        </main>
      </div>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'create' && `Tambah ${getEntityName(currentEntity)}`}
                {modalType === 'edit' && `Edit ${getEntityName(currentEntity)}`}
                {modalType === 'view' && `Detail ${getEntityName(currentEntity)}`}
                {modalType === 'delete' && `Hapus ${getEntityName(currentEntity)}`}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalType === 'delete' ? (
                <div>
                  <p className="text-gray-700 mb-4">
                    Apakah Anda yakin ingin menghapus {getEntityName(currentEntity)} ini?
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {renderFormFields()}

                  {formErrors.general && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {formErrors.general}
                    </div>
                  )}

                  {modalType !== 'view' && (
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Menyimpan...' : modalType === 'create' ? 'Tambah' : 'Simpan'}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Helper function to get entity display name
  function getEntityName(entityType: EntityType): string {
    const names = {
      products: 'Produk',
      orders: 'Pesanan',
      contacts: 'Inquiry',
      users: 'User',
      profiles: 'Profile',
      categories: 'Kategori',
      advertisements: 'Iklan',
      'website-settings': 'Pengaturan Website',
      'contact-settings': 'Informasi Kontak',
      testimonials: 'Testimoni',
      sequel: 'Karir',
      storyline: 'Storyline'
    }
    return names[entityType]
  }

  // Helper function to get order status display
  function getOrderStatusDisplay(status: string) {
    const statusMap: Record<string, { label: string; class: string }> = {
      // Database format (uppercase with underscores)
      'PENDING_CONFIRMATION': { label: 'Menunggu Konfirmasi', class: 'bg-yellow-100 text-yellow-800' },
      'CONFIRMED': { label: 'Dikonfirmasi', class: 'bg-blue-100 text-blue-800' },
      'PROCESSING': { label: 'Diproses', class: 'bg-orange-100 text-orange-800' },
      'SHIPPED': { label: 'Dikirim', class: 'bg-purple-100 text-purple-800' },
      'DELIVERED': { label: 'Selesai', class: 'bg-green-100 text-green-800' },
      'CANCELLED': { label: 'Dibatalkan', class: 'bg-red-100 text-red-800' },
      // Frontend format (lowercase) - for backward compatibility
      'pending': { label: 'Menunggu Konfirmasi', class: 'bg-yellow-100 text-yellow-800' },
      'confirmed': { label: 'Dikonfirmasi', class: 'bg-blue-100 text-blue-800' },
      'processing': { label: 'Diproses', class: 'bg-orange-100 text-orange-800' },
      'shipped': { label: 'Dikirim', class: 'bg-purple-100 text-purple-800' },
      'delivered': { label: 'Selesai', class: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Dibatalkan', class: 'bg-red-100 text-red-800' }
    }

    // Try exact match first, then try lowercase
    const exactMatch = statusMap[status]
    if (exactMatch) return exactMatch

    const normalizedStatus = status.toLowerCase()
    return statusMap[normalizedStatus] || {
      label: status,
      class: 'bg-gray-100 text-gray-800'
    }
  }

  // Render form fields based on entity type
  function renderFormFields() {
    if (modalType === 'view') {
      return renderViewFields()
    }

    switch (currentEntity) {
      case 'products':
        return renderProductFields()
      case 'categories':
        return renderCategoryFields()
      case 'profiles':
        return renderProfileFields()
      case 'contacts':
        return renderContactFields()
      case 'users':
        return renderUserFields()
      case 'orders':
        return renderOrderFields()
      case 'testimonials':
        return renderTestimonialFields()
      case 'advertisements':
        return renderAdvertisementFields()
      case 'sequel':
        return renderSequelFields()
      case 'storyline':
        return <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">Form untuk {getEntityName(currentEntity)} belum tersedia.</p>
          <p className="text-sm text-yellow-600 mt-2">Gunakan form khusus di tab masing-masing.</p>
        </div>
      default:
        return <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <p className="text-gray-600">Form untuk {currentEntity} belum diimplementasikan.</p>
        </div>
    }
  }

  function renderViewFields() {
    if (!selectedItem) return null

    return (
      <div className="space-y-4">
        {Object.entries(selectedItem).map(([key, value]) => {
          if (key === 'id' || key === 'createdAt' || key === 'updatedAt') {
            return (
              <div key={key} className="grid grid-cols-3 gap-4">
                <label className="text-sm font-medium text-gray-700 capitalize">
                  {key === 'createdAt' ? 'Tanggal Dibuat' : key === 'updatedAt' ? 'Tanggal Update' : 'ID'}
                </label>
                <div className="col-span-2 text-sm text-gray-900">
                  {key.includes('At') ? new Date(value as string).toLocaleString('id-ID') : String(value)}
                </div>
              </div>
            )
          }

          return (
            <div key={key} className="grid grid-cols-3 gap-4">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </label>
              <div className="col-span-2 text-sm text-gray-900">
                {typeof value === 'boolean' ? (value ? 'Ya' : 'Tidak') :
                  typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) :
                    String(value || '-')}
              </div>
            </div>
          )
        })}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Tutup
          </button>
        </div>
      </div>
    )
  }

  function renderProductFields() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Produk</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Masukkan deskripsi produk..."
          />
          {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
        </div>

        {/* Multi-Harga Toggle */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="hasVariants"
              checked={formData.hasVariants || false}
              onChange={(e) => {
                handleInputChange('hasVariants', e.target.checked)
                if (!e.target.checked) {
                  // Reset variants jika multi-harga dimatikan
                  handleInputChange('variants', [])
                }
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="hasVariants" className="text-sm font-medium text-gray-700">
              🏷️ Aktifkan Multi-Harga (Varian)
            </label>
          </div>

          <p className="text-xs text-gray-500 mb-2">
            Contoh: Meja Kasir 120cm = Rp. 5.000.000, Meja Kasir 150cm = Rp. 5.500.000
          </p>
        </div>

        {/* Conditional Pricing Fields */}
        {!formData.hasVariants ? (
          /* Single Price Mode */
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                required
                min="0"
                placeholder="2500000"
              />
              {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Asli (Opsional)</label>
              <input
                type="number"
                value={formData.originalPrice || ''}
                onChange={(e) => handleInputChange('originalPrice', parseInt(e.target.value) || undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                min="0"
                placeholder="2800000"
              />
              {formErrors.originalPrice && <p className="text-red-500 text-xs mt-1">{formErrors.originalPrice}</p>}
            </div>
          </>
        ) : (
          /* Multi-Price Mode */
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">🏷️ Varian Harga</h4>
              <button
                type="button"
                onClick={() => {
                  const currentVariants = formData.variants || []
                  const newVariant = {
                    id: `temp-${Date.now()}`,
                    name: '',
                    price: 0,
                    originalPrice: undefined,
                    isDefault: currentVariants.length === 0, // First variant is default
                    sortOrder: currentVariants.length,
                    inStock: true
                  }
                  handleInputChange('variants', [...currentVariants, newVariant])
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                + Tambah Varian
              </button>
            </div>

            {(formData.variants || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Belum ada varian harga</p>
                <p className="text-xs mt-1">Klik "Tambah Varian" untuk menambah varian pertama</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(formData.variants || []).map((variant, index) => (
                  <div key={variant.id || index} className="border rounded p-3 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Varian</label>
                        <input
                          type="text"
                          value={variant.name || ''}
                          onChange={(e) => {
                            const updatedVariants = [...(formData.variants || [])]
                            updatedVariants[index] = { ...variant, name: e.target.value }
                            handleInputChange('variants', updatedVariants)
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Meja kasir 120cm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Harga (Rp)</label>
                        <input
                          type="number"
                          value={variant.price || ''}
                          onChange={(e) => {
                            const updatedVariants = [...(formData.variants || [])]
                            updatedVariants[index] = { ...variant, price: parseInt(e.target.value) || 0 }
                            handleInputChange('variants', updatedVariants)
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          placeholder="5000000"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Harga Asli (Opsional)</label>
                        <input
                          type="number"
                          value={variant.originalPrice || ''}
                          onChange={(e) => {
                            const updatedVariants = [...(formData.variants || [])]
                            updatedVariants[index] = { ...variant, originalPrice: parseInt(e.target.value) || undefined }
                            handleInputChange('variants', updatedVariants)
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          placeholder="5500000"
                          min="0"
                        />
                      </div>

                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={variant.isDefault || false}
                            onChange={(e) => {
                              const updatedVariants = [...(formData.variants || [])]
                              // Hanya satu yang bisa default
                              updatedVariants.forEach((v, i) => {
                                v.isDefault = i === index ? e.target.checked : false
                              })
                              handleInputChange('variants', updatedVariants)
                            }}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-700">Default</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={variant.inStock !== false}
                            onChange={(e) => {
                              const updatedVariants = [...(formData.variants || [])]
                              updatedVariants[index] = { ...variant, inStock: e.target.checked }
                              handleInputChange('variants', updatedVariants)
                            }}
                            className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-xs text-gray-700">Stok</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Varian #{index + 1} {variant.isDefault ? '(Default)' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedVariants = (formData.variants || []).filter((_, i) => i !== index)
                          handleInputChange('variants', updatedVariants)
                        }}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 hover:bg-red-50 rounded transition-colors"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.variants && formData.variants.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-800">
                  ℹ️ <strong>Tips:</strong> Pastikan minimal satu varian diset sebagai "Default".
                  Varian default akan menjadi harga utama yang ditampilkan di katalog.
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            value={formData.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Pilih Kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
          {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
        </div>

        <div>
          <ImageUpload
            value={formData.image || ''}
            onChange={(url) => handleInputChange('image', url)}
            label="Gambar Produk"
            placeholder="Klik untuk upload gambar produk"
            error={formErrors.image}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rating Produk</label>
          <select
            value={formData.rating || 0}
            onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value={0}>0 - Tidak ada rating</option>
            <option value={1}>⭐ 1 - Buruk</option>
            <option value={1.5}>⭐ 1.5 - Buruk+</option>
            <option value={2}>⭐⭐ 2 - Kurang</option>
            <option value={2.5}>⭐⭐ 2.5 - Kurang+</option>
            <option value={3}>⭐⭐⭐ 3 - Cukup</option>
            <option value={3.5}>⭐⭐⭐ 3.5 - Cukup+</option>
            <option value={4}>⭐⭐⭐⭐ 4 - Baik</option>
            <option value={4.5}>⭐⭐⭐⭐ 4.5 - Baik+</option>
            <option value={5}>⭐⭐⭐⭐⭐ 5 - Excellent</option>
          </select>
          {formErrors.rating && <p className="text-red-500 text-xs mt-1">{formErrors.rating}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Review</label>
          <input
            type="number"
            value={formData.reviews || 0}
            onChange={(e) => handleInputChange('reviews', parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            min="0"
            placeholder="0"
          />
          {formErrors.reviews && <p className="text-red-500 text-xs mt-1">{formErrors.reviews}</p>}
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.inStock !== false}
              onChange={(e) => handleInputChange('inStock', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Produk Tersedia</span>
          </label>
        </div>
      </div>
    )
  }

  function renderCategoryFields() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={formData.slug || ''}
            onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          {formErrors.slug && <p className="text-red-500 text-xs mt-1">{formErrors.slug}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
          />
          {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive || false}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Kategori Aktif</span>
          </label>
        </div>
      </div>
    )
  }

  function renderProfileFields() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Profile</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            value={formData.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Pilih Kategori</option>
            <option value="minimarket">Minimarket</option>
            <option value="retail">Retail</option>
            <option value="warehouse">Warehouse</option>
          </select>
          {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
          />
          {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
        </div>

        <div>
          <ImageUpload
            value={formData.image || ''}
            onChange={(url) => handleInputChange('image', url)}
            label="Gambar Proyek"
            placeholder="Klik untuk upload gambar profile"
            error={formErrors.image}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klien</label>
            <input
              type="text"
              value={formData.client || ''}
              onChange={(e) => handleInputChange('client', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Nama klien/perusahaan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Lokasi proyek"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
            <input
              type="number"
              value={formData.year || new Date().getFullYear()}
              onChange={(e) => handleInputChange('year', parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              min="2000"
              max={new Date().getFullYear() + 5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Upload</label>
            <input
              type="datetime-local"
              value={formData.uploadDate ? new Date(formData.uploadDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)}
              onChange={(e) => handleInputChange('uploadDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">Tanggal dan waktu yang akan ditampilkan di website</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status || 'draft'}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
    )
  }

  function renderContactFields() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Depan</label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Belakang</label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            {formErrors.lastName && <p className="text-red-500 text-xs mt-1">{formErrors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={formData.subject || ''}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          {formErrors.subject && <p className="text-red-500 text-xs mt-1">{formErrors.subject}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status || 'NEW'}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="NEW">Baru</option>
            <option value="RESPONDED">Direspon</option>
            <option value="CLOSED">Ditutup</option>
          </select>
        </div>
      </div>
    )
  }

  function renderUserFields() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input
            type="text"
            value={formData.username || ''}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Username untuk login (contoh: admin, user123)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Username ini akan digunakan untuk login ke sistem</p>
          {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            required
          />
          {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={formData.role || 'USER'}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="USER">User</option>
            <option value="DIGITAL_MARKETING">Digital Marketing</option>
            <option value="CUSTOMER_SERVICE">Customer Service</option>
            <option value="ADMIN">Admin</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            <strong>User:</strong> Dashboard only | <strong>Digital Marketing:</strong> Dashboard, Produk, Galeri, Kategori, Testimoni | <strong>Customer Service:</strong> Dashboard, Pesanan, Inquiry | <strong>Admin:</strong> Full access
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={formData.password || ''}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder={modalType === 'edit' ? 'Kosongkan jika tidak ingin mengubah password' : 'Masukkan password'}
            required={modalType === 'create'}
          />
          {modalType === 'edit' && (
            <p className="text-sm text-gray-500 mt-1">Kosongkan jika tidak ingin mengubah password</p>
          )}
          {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
        </div>
      </div>
    )
  }

  function renderOrderFields() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Depan</label>
            <input
              type="text"
              value={formData.customerFirstName || ''}
              onChange={(e) => handleInputChange('customerFirstName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            {formErrors.customerFirstName && <p className="text-red-500 text-xs mt-1">{formErrors.customerFirstName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Belakang</label>
            <input
              type="text"
              value={formData.customerLastName || ''}
              onChange={(e) => handleInputChange('customerLastName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            {formErrors.customerLastName && <p className="text-red-500 text-xs mt-1">{formErrors.customerLastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.customerEmail || ''}
              onChange={(e) => handleInputChange('customerEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            {formErrors.customerEmail && <p className="text-red-500 text-xs mt-1">{formErrors.customerEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
            <input
              type="tel"
              value={formData.customerPhone || ''}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            />
            {formErrors.customerPhone && <p className="text-red-500 text-xs mt-1">{formErrors.customerPhone}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status || 'PENDING_CONFIRMATION'}
            onChange={(e) => {
              console.log('📝 Status changed from:', formData.status, 'to:', e.target.value)
              handleInputChange('status', e.target.value)
            }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="PENDING_CONFIRMATION">Menunggu Konfirmasi</option>
            <option value="CONFIRMED">Dikonfirmasi</option>
            <option value="PROCESSING">Diproses</option>
            <option value="SHIPPED">Dikirim</option>
            <option value="DELIVERED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>
          {/* Debug info for troubleshooting */}
          {modalType === 'edit' && (
            <div className="text-xs text-gray-500 mt-1">
              Debug: Current formData.status = "{formData.status}", selectedItem.status = "{selectedItem?.status}"
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Khusus</label>
          <textarea
            value={formData.specialInstructions || ''}
            onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Catatan khusus untuk pesanan ini..."
          />
        </div>
      </div>
    )
  }

  function renderTestimonialFields() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pelanggan *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Nama lengkap pelanggan"
              required
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posisi/Jabatan</label>
            <input
              type="text"
              value={formData.position || ''}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Manager, Owner, dll"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan</label>
            <input
              type="text"
              value={formData.company || ''}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="PT. Contoh, CV. Berkah, dll"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Jakarta, Bandung, dll"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
            <select
              value={formData.rating || 5}
              onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            >
              <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
              <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
              <option value={3}>⭐⭐⭐ (3 Bintang)</option>
              <option value={2}>⭐⭐ (2 Bintang)</option>
              <option value={1}>⭐ (1 Bintang)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Proyek Terkait</label>
            <input
              type="text"
              value={formData.project || ''}
              onChange={(e) => handleInputChange('project', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Rak Minimarket, Rak Gudang, dll"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Testimoni *</label>
          <textarea
            value={formData.comment || ''}
            onChange={(e) => handleInputChange('comment', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={4}
            placeholder="Tulis testimoni pelanggan di sini..."
            required
          />
          {formErrors.comment && <p className="text-red-500 text-xs mt-1">{formErrors.comment}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Pelanggan</label>
          <input
            type="url"
            value={formData.image || ''}
            onChange={(e) => handleInputChange('image', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="https://example.com/foto-pelanggan.jpg"
          />
          <p className="text-gray-500 text-xs mt-1">Opsional: URL foto profil pelanggan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive !== false}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Aktif (tampilkan di website)
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFeatured"
              checked={formData.isFeatured || false}
              onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
              className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700">
              Featured (prioritas tampil pertama)
            </label>
          </div>
        </div>
      </div>
    )
  }

  function renderCareerFields() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Posisi *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Frontend Developer"
              required
            />
            {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="IT Development"
              required
            />
            {formErrors.department && <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi *</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Jakarta"
              required
            />
            {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pekerjaan *</label>
            <select
              value={formData.type || 'full-time'}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Kontrak</option>
              <option value="internship">Magang</option>
            </select>
            {formErrors.type && <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range Gaji</label>
            <input
              type="text"
              value={formData.salary || ''}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="5-8 juta / bulan"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pekerjaan *</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={4}
            placeholder="Berikan deskripsi detail tentang pekerjaan ini..."
            required
          />
          {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Persyaratan (pisahkan dengan enter)</label>
          <textarea
            value={Array.isArray(formData.requirements) ? formData.requirements.join('\n') : formData.requirements || ''}
            onChange={(e) => handleInputChange('requirements', e.target.value.split('\n').filter(item => item.trim()))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={4}
            placeholder="S1 Teknik Informatika&#10;Pengalaman 2+ tahun&#10;Menguasai ReactJS"
          />
          <p className="text-gray-500 text-xs mt-1">Tulis satu persyaratan per baris</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Benefit & Fasilitas (pisahkan dengan enter)</label>
          <textarea
            value={Array.isArray(formData.benefits) ? formData.benefits.join('\n') : formData.benefits || ''}
            onChange={(e) => handleInputChange('benefits', e.target.value.split('\n').filter(item => item.trim()))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="BPJS Kesehatan &amp; Ketenagakerjaan&#10;Bonus tahunan&#10;Laptop kerja"
          />
          <p className="text-gray-500 text-xs mt-1">Tulis satu benefit per baris</p>
        </div>


      </div>
    )
  }

  function renderAdvertisementFields() {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Iklan *</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Nama produk atau judul iklan"
            required
          />
          {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            rows={3}
            placeholder="Deskripsi singkat untuk sidebar product"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Gambar *</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleAdvertisementImageUpload}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            disabled={uploading}
          />
          <p className="text-gray-500 text-xs mt-1">Format: JPG, PNG, GIF, WebP. Maksimal 20MB</p>
          {formErrors.image && <p className="text-red-500 text-xs mt-1">{formErrors.image}</p>}
          {uploading && (
            <div className="mt-2 text-blue-600 text-sm">
              <span className="animate-pulse">⏳ Mengupload gambar...</span>
            </div>
          )}
          {formData.image && !uploading && (
            <div className="mt-2">
              <img src={formData.image} alt="Preview" className="h-32 object-contain rounded border" />
              <p className="text-green-600 text-xs mt-1">✓ Gambar berhasil diupload</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Link Tujuan *</label>
          <input
            type="url"
            value={formData.link || ''}
            onChange={(e) => handleInputChange('link', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="/products atau https://example.com"
            required
          />
          {formErrors.link && <p className="text-red-500 text-xs mt-1">{formErrors.link}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <input
              type="text"
              value={formData.type || ''}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
              readOnly
            />
            <p className="text-gray-500 text-xs mt-1">Otomatis terisi dari tombol yang diklik</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
            <input
              type="text"
              value={formData.position || 'homepage'}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
              readOnly
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={formData.startDate ? formData.startDate.split('T')[0] : new Date().toISOString().split('T')[0]}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Berakhir</label>
            <input
              type="date"
              value={formData.endDate ? formData.endDate.split('T')[0] : ''}
              onChange={(e) => handleInputChange('endDate', e.target.value || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <p className="text-gray-500 text-xs mt-1">Kosongkan jika tidak ada batas waktu</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority (urutan tampil)</label>
          <input
            type="number"
            value={formData.priority || 0}
            onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            min="0"
          />
          <p className="text-gray-500 text-xs mt-1">Semakin kecil angka, semakin awal ditampilkan</p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive !== false}
            onChange={(e) => handleInputChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Aktif (tampilkan di homepage)
          </label>
        </div>
      </div>
    )
  }

  function renderSequelFields() {
    return (
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul Lowongan *</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            placeholder="Contoh: Digital Marketing Specialist"
            required
          />
          {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departemen *</label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => handleInputChange('department', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Marketing, Sales, IT"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi *</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Jakarta, Remote, Hybrid"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Pekerjaan *</label>
            <select
              value={formData.employmentType || ''}
              onChange={(e) => handleInputChange('employmentType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Pilih tipe pekerjaan</option>
              {(() => {
                try {
                  const types = sequelSettings?.employmentTypes
                    ? (typeof sequelSettings.employmentTypes === 'string' && sequelSettings.employmentTypes.startsWith('[')
                      ? JSON.parse(sequelSettings.employmentTypes)
                      : ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'])
                    : ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
                  return types.map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))
                } catch {
                  return ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))
                }
              })()}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Range Gaji (opsional)</label>
            <input
              type="text"
              value={formData.salary || ''}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Rp 5.000.000 - Rp 8.000.000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Batas Akhir Lamaran (opsional)</label>
          <input
            type="date"
            value={formData.closingDate ? formData.closingDate.split('T')[0] : ''}
            onChange={(e) => handleInputChange('closingDate', e.target.value || null)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ada batas waktu</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Pekerjaan *</label>
          <textarea
            value={formData.content || ''}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
            rows={6}
            placeholder="Deskripsi lengkap tentang pekerjaan ini..."
            required
          />
          {formErrors.content && <p className="text-red-500 text-xs mt-1">{formErrors.content}</p>}
        </div>

        {/* Responsibilities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggung Jawab *</label>
          <textarea
            value={formData.responsibilities || ''}
            onChange={(e) => handleInputChange('responsibilities', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
            rows={6}
            placeholder="Masukkan satu tanggung jawab per baris:&#10;Mengelola kampanye marketing&#10;Membuat konten social media&#10;Analisis performa campaign"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Satu item per baris</p>
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kualifikasi *</label>
          <textarea
            value={formData.requirements || ''}
            onChange={(e) => handleInputChange('requirements', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
            rows={6}
            placeholder="Masukkan satu kualifikasi per baris:&#10;Minimal S1 Marketing&#10;Pengalaman 2 tahun di bidang digital marketing&#10;Menguasai Google Ads dan Facebook Ads"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Satu item per baris</p>
        </div>

        {/* Benefits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Benefit & Fasilitas (opsional)</label>
          <textarea
            value={formData.benefits || ''}
            onChange={(e) => handleInputChange('benefits', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono text-sm"
            rows={5}
            placeholder="Masukkan satu benefit per baris:&#10;BPJS Kesehatan & Ketenagakerjaan&#10;Bonus kinerja&#10;Laptop dan peralatan kerja&#10;Flexible working hours"
          />
          <p className="text-xs text-gray-500 mt-1">Satu item per baris. Kosongkan jika tidak ada.</p>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              value={formData.sortOrder || 0}
              onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">Urutan tampil (semakin kecil semakin awal)</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sequelActive"
              checked={formData.isActive !== false}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sequelActive" className="ml-2 block text-sm text-gray-700">
              Aktif (tampilkan di halaman Karir)
            </label>
          </div>
        </div>
      </div>
    )
  }
}

