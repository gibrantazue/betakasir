import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch website settings from database
export async function GET() {
  try {
    console.log('🎨 Fetching website settings from database...')
    
    // Try to get settings from database
    let settings = await prisma.websiteSettings.findFirst()
    
    // If no settings exist, create default settings
    if (!settings) {
      console.log('📝 No settings found, creating default settings...')
      settings = await prisma.websiteSettings.create({
        data: {
          logoUrl: '/logo.jpg',
          logoZoom: 100,
          logoHeaderUrl: '/logo.jpg',
          logoHeaderZoom: 100,
          companyName: 'Betarak',
          companyDescription: 'Betarak adalah penyedia solusi rak dan perlengkapan toko terlengkap di Indonesia. Kami berkomitmen memberikan produk berkualitas tinggi dengan pelayanan terbaik untuk mendukung kesuksesan bisnis Anda.',
          favicon: '/favicon.ico',
          siteTitle: 'Betarak - Store Warehouse Solution',
          siteDescription: 'Betarak adalah penyedia solusi rak dan perlengkapan toko terlengkap di Indonesia',
          address: 'Jl. Industri Raya No. 123, Jakarta Timur 13440',
          phone: '+62 21-1234-5678',
          whatsapp: '+62 812-3456-7890',
          email: 'info@betarak.co.id',
          heroWhatsapp: '+62 812-3456-7890',
          heroEmail: 'info@betarak.co.id',
          heroOperatingHours: 'Senin - Jumat WIB',
          paymentWhatsappNumber: '+62 813-4007-8956',
          mondayFriday: 'Senin - Jumat: 08:00 - 17:00 WIB',
          saturday: 'Sabtu: 08:00 - 15:00 WIB',
          sunday: 'Minggu: Tutup',
          serviceAreas: 'Jabodetabek, Bandung, Surabaya, Semarang, Yogyakarta, Medan, Makassar, dan kota besar lainnya',
          specialNote: '*Pengiriman ke seluruh Indonesia',
          facebookUrl: '#',
          instagramUrl: '#',
          youtubeUrl: '#',
          copyrightText: '© 2024 Betarak Indonesia. Semua hak dilindungi undang-undang.'
        }
      })
      console.log('✅ Default settings created successfully')
    }
    
    console.log('✅ Website settings fetched from database successfully')
    return NextResponse.json(settings)
    
  } catch (error) {
    console.error('❌ Error fetching website settings:', error)
    return NextResponse.json({ error: 'Failed to fetch website settings' }, { status: 500 })
  }
}

// PUT - Update website settings in database
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    console.log('🎨 Updating website settings in database:', data)
    
    // Find existing settings
    let settings = await prisma.websiteSettings.findFirst()
    
    if (settings) {
      // Update existing settings
      settings = await prisma.websiteSettings.update({
        where: { id: settings.id },
        data: {
          logoUrl: data.logoUrl || settings.logoUrl,
          logoZoom: data.logoZoom || settings.logoZoom,
          logoHeaderUrl: data.logoHeaderUrl || settings.logoHeaderUrl,
          logoHeaderZoom: data.logoHeaderZoom || settings.logoHeaderZoom,
          companyName: data.companyName || settings.companyName,
          companyDescription: data.companyDescription || settings.companyDescription,
          favicon: data.favicon || settings.favicon,
          siteTitle: data.siteTitle || settings.siteTitle,
          siteDescription: data.siteDescription || settings.siteDescription,
          address: data.address || settings.address,
          phone: data.phone || settings.phone,
          whatsapp: data.whatsapp || settings.whatsapp,
          email: data.email || settings.email,
          heroWhatsapp: data.heroWhatsapp || settings.heroWhatsapp,
          heroEmail: data.heroEmail || settings.heroEmail,
          heroOperatingHours: data.heroOperatingHours || settings.heroOperatingHours,
          paymentWhatsappNumber: data.paymentWhatsappNumber || settings.paymentWhatsappNumber,
          mondayFriday: data.mondayFriday || settings.mondayFriday,
          saturday: data.saturday || settings.saturday,
          sunday: data.sunday || settings.sunday,
          serviceAreas: data.serviceAreas || settings.serviceAreas,
          specialNote: data.specialNote || settings.specialNote,
          facebookUrl: data.facebookUrl || settings.facebookUrl,
          instagramUrl: data.instagramUrl || settings.instagramUrl,
          youtubeUrl: data.youtubeUrl || settings.youtubeUrl,
          copyrightText: data.copyrightText || settings.copyrightText
        }
      })
    } else {
      // Create new settings if none exist
      settings = await prisma.websiteSettings.create({
        data: {
          logoUrl: data.logoUrl || '/logo.jpg',
          logoZoom: data.logoZoom || 100,
          logoHeaderUrl: data.logoHeaderUrl || '/logo.jpg',
          logoHeaderZoom: data.logoHeaderZoom || 100,
          companyName: data.companyName || 'Betarak',
          companyDescription: data.companyDescription || 'Betarak adalah penyedia solusi rak dan perlengkapan toko terlengkap di Indonesia.',
          favicon: data.favicon || '/favicon.ico',
          siteTitle: data.siteTitle || 'Betarak - Store Warehouse Solution',
          siteDescription: data.siteDescription || 'Betarak adalah penyedia solusi rak dan perlengkapan toko terlengkap di Indonesia',
          address: data.address || 'Jl. Industri Raya No. 123, Jakarta Timur 13440',
          phone: data.phone || '+62 21-1234-5678',
          whatsapp: data.whatsapp || '+62 812-3456-7890',
          email: data.email || 'info@betarak.co.id',
          heroWhatsapp: data.heroWhatsapp || '+62 812-3456-7890',
          heroEmail: data.heroEmail || 'info@betarak.co.id',
          heroOperatingHours: data.heroOperatingHours || 'Senin - Jumat WIB',
          paymentWhatsappNumber: data.paymentWhatsappNumber || '+62 813-4007-8956',
          mondayFriday: data.mondayFriday || 'Senin - Jumat: 08:00 - 17:00 WIB',
          saturday: data.saturday || 'Sabtu: 08:00 - 15:00 WIB',
          sunday: data.sunday || 'Minggu: Tutup',
          serviceAreas: data.serviceAreas || 'Jabodetabek, Bandung, Surabaya, Semarang, Yogyakarta, Medan, Makassar, dan kota besar lainnya',
          specialNote: data.specialNote || '*Pengiriman ke seluruh Indonesia',
          facebookUrl: data.facebookUrl || '#',
          instagramUrl: data.instagramUrl || '#',
          youtubeUrl: data.youtubeUrl || '#',
          copyrightText: data.copyrightText || '© 2024 Betarak Indonesia. Semua hak dilindungi undang-undang.'
        }
      })
    }
    
    console.log('✅ Website settings updated in database successfully:', settings.id)
    
    // Broadcast to all connected clients for real-time updates
    if ((global as any).io) {
      console.log('🔄 Broadcasting website settings update to all clients...')
      ;(global as any).io.emit('website-settings-updated', settings)
    } else {
      console.log('⚠️ WebSocket not available for broadcasting')
    }
    
    return NextResponse.json(settings)
    
  } catch (error) {
    console.error('❌ Error updating website settings:', error)
    return NextResponse.json({ error: 'Failed to update website settings' }, { status: 500 })
  }
}
