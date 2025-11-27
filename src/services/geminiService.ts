import { GEMINI_API_KEY, USE_GEMINI, OPENROUTER_API_KEY, USE_OPENROUTER, HUGGINGFACE_API_KEY, USE_HUGGINGFACE, DEEPSEEK_API_KEY, USE_DEEPSEEK, USE_DEMO_MODE } from '../config/gemini';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class GeminiService {
  private conversationHistory: ChatMessage[] = [];
  private responseCache: Map<string, { response: string; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  // System prompt dengan formatting rules - DIRECT & CONCISE
  private readonly SYSTEM_PROMPT = 'Kamu adalah BetaKasir AI Assistant buatan BetaGroup. PENTING: Saat menjawab pertanyaan user, LANGSUNG JAWAB tanpa perkenalan ulang! Jangan mulai dengan "Halo Bapak/Ibu...", "Saya BetaKasir AI...", atau perkenalan lainnya di SETIAP response. Cukup sapa di awal conversation saja, selanjutnya LANGSUNG ke analisis/jawaban! Kamu punya akses ke SEMUA data bisnis (produk, transaksi, HPP, profit, ROI, forecast, dll). Jawab dalam bahasa Indonesia yang CONCISE, DIRECT, dan DATA-DRIVEN. Jangan minta ID atau data tambahan karena semua sudah tersedia! FORMATTING: Gunakan markdown: **bold** untuk angka penting, ## untuk section headers, - untuk bullets, 1. untuk numbering. Pisahkan paragraf dengan line breaks. Akhiri dengan 1 pertanyaan follow-up singkat. KHUSUS: Jika user bertanya tentang masalah/kendala/error/bug ATAU cara sewa/upgrade/berlangganan plan, WAJIB sertakan kontak WhatsApp developer: **Gibran Ade Bintang** di [wa.me/6281340078956](https://wa.me/6281340078956) untuk bantuan langsung. DETAIL MODE: Jika user meminta penjelasan "lengkap", "detail", "secara detail", "dengan lengkap", "comprehensive", atau kata-kata serupa, berikan response yang SANGAT LENGKAP dengan: 1) Penjelasan mendalam setiap poin, 2) Contoh konkret, 3) Step-by-step guide, 4) Tips & best practices, 5) Warning/catatan penting, 6) Related features, 7) Troubleshooting common issues. Jangan singkat, berikan informasi selengkap-lengkapnya!';

  constructor() {
    if (USE_DEMO_MODE) {
      console.log('✨ Using DEMO MODE - Works Offline, No API Key Needed!');
    } else if (USE_DEEPSEEK) {
      console.log('✨ Using DeepSeek AI - FREE, FAST & UNLIMITED!');
    } else if (USE_HUGGINGFACE) {
      console.log('✨ Using Hugging Face AI - FREE & UNLIMITED!');
    } else if (USE_OPENROUTER) {
      console.log('✨ Using OpenRouter AI - FREE & RELIABLE!');
    } else if (USE_GEMINI) {
      console.log('✨ Using Google Gemini AI - FREE & NO CORS!');
    }
  }

  async sendMessage(userMessage: string, includeBusinessData: boolean = true): Promise<string> {
    try {
      console.log('📤 Sending message:', userMessage);
      
      // Check cache first for instant response
      const cacheKey = userMessage.toLowerCase().trim();
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log('⚡ Using cached response (instant!)');
        this.conversationHistory.push({
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
        });
        this.conversationHistory.push({
          role: 'assistant',
          content: cached.response,
          timestamp: new Date(),
        });
        return cached.response;
      }
      
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      // Detect if user wants detailed/comprehensive explanation
      const detailKeywords = ['lengkap', 'detail', 'secara detail', 'dengan lengkap', 'comprehensive', 'mendalam', 'mendetail', 'selengkapnya', 'lebih detail', 'lebih lengkap', 'explain in detail', 'jelaskan lengkap', 'jelaskan detail', 'penjelasan lengkap', 'penjelasan detail'];
      const wantsDetailedResponse = detailKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));
      
      if (wantsDetailedResponse) {
        console.log('🔍 User wants DETAILED response - activating comprehensive mode');
      }

      // Auto-inject business data context
      let fullMessage = userMessage;
      if (includeBusinessData) {
        try {
          const { aiContextService } = await import('./aiContextService');
          const businessData = aiContextService.getBusinessData();
          
          // Get app version info
          const versionInfo = await aiContextService.getAppVersionInfo();
          
          // Build instruction based on detail level
          let instruction = 'Gunakan data bisnis dan informasi versi aplikasi di atas untuk jawab pertanyaan user dengan spesifik dan akurat. Jangan minta ID atau data lagi, semua sudah tersedia di atas!';
          
          if (wantsDetailedResponse) {
            instruction = `User meminta penjelasan LENGKAP dan DETAIL! Berikan response yang SANGAT COMPREHENSIVE dengan:

📚 **FORMAT RESPONSE DETAIL:**
1. **Overview/Pengantar** - Jelaskan topik secara umum dulu
2. **Penjelasan Mendalam** - Breakdown setiap aspek dengan detail
3. **Contoh Konkret** - Berikan contoh real case dari data bisnis user
4. **Step-by-Step Guide** - Langkah-langkah praktis jika applicable
5. **Tips & Best Practices** - Saran untuk optimize
6. **Warning/Catatan Penting** - Hal-hal yang perlu diperhatikan
7. **Related Features** - Fitur terkait yang bisa digunakan
8. **Troubleshooting** - Common issues dan solusinya
9. **Summary** - Ringkasan poin-poin penting

Jangan singkat! Berikan informasi selengkap-lengkapnya dengan penjelasan yang mudah dipahami. Gunakan data bisnis di atas untuk contoh konkret. Target: Response minimal 500 kata dengan struktur yang jelas dan informatif!`;
          }
          
          // Inject business data + version info before user message
          fullMessage = `${versionInfo}\n\n${businessData}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n👤 PERTANYAAN USER:\n${userMessage}\n\n💡 INSTRUKSI:\n${instruction}`;
          
          console.log('✅ Business data + version info auto-injected to AI context');
        } catch (error) {
          console.warn('⚠️ Failed to inject business data:', error);
          // Continue without business data
        }
      }

      // Call AI API
      let response;
      let assistantMessage;
      
      if (USE_DEMO_MODE) {
        console.log('✨ Using DEMO MODE - Generating smart response...');
        
        // Smart demo responses based on user query
        const query = userMessage.toLowerCase();
        
        if (query.includes('halo') || query.includes('hai') || query.includes('hello')) {
          assistantMessage = 'Halo! Saya BetaKasir Assistant. Saya sudah punya akses ke semua data bisnis kamu. Ada yang bisa saya bantu? 😊';
        } else if (query.includes('produk') && (query.includes('laris') || query.includes('terlaris') || query.includes('terbaik'))) {
          assistantMessage = 'Berdasarkan data transaksi kamu, saya bisa lihat produk-produk terlaris. Untuk analisis detail, saya perlu koneksi ke AI server. Tapi saat ini kamu bisa cek di menu Laporan > Tab Produk untuk melihat Top 10 produk terlaris! 📊';
        } else if (query.includes('pendapatan') || query.includes('revenue') || query.includes('omzet')) {
          assistantMessage = 'Untuk melihat pendapatan, buka menu Laporan. Di sana kamu bisa lihat:\n- Total pendapatan\n- Pendapatan hari ini\n- Grafik tren 7 hari\n- Breakdown per metode pembayaran\n\nKamu juga bisa filter by periode: Hari Ini, 7 Hari, 30 Hari, atau custom! 💰';
        } else if (query.includes('stok') && (query.includes('menipis') || query.includes('habis') || query.includes('kosong'))) {
          assistantMessage = 'Untuk cek produk yang stoknya menipis, buka menu Produk dan lihat badge merah pada produk. Kamu juga bisa sort by stok untuk lihat produk mana yang perlu restock. Saran: Set alert stok minimum untuk setiap produk! 📦';
        } else if (query.includes('karyawan') || query.includes('employee')) {
          assistantMessage = 'Untuk manage karyawan, buka menu Karyawan. Di sana kamu bisa:\n- Tambah karyawan baru\n- Set role & permissions\n- Generate QR code untuk login\n- Print ID card\n- Track performa\n\nAda 3 role: Owner, Admin, dan Cashier dengan permissions berbeda! 👥';
        } else if (query.includes('kasir') || query.includes('transaksi') || query.includes('checkout')) {
          assistantMessage = 'Tips kasir super cepat:\n1. Tekan F2 untuk fokus search\n2. Scan barcode atau ketik nama produk\n3. Enter untuk tambah ke cart\n4. F8 untuk proses pembayaran\n5. F9 untuk tunai\n6. Ctrl+S untuk selesaikan\n\nTarget: < 20 detik per transaksi! ⚡';
        } else if (query.includes('barcode') || query.includes('scan')) {
          assistantMessage = 'BetaKasir support 2 jenis barcode scanner:\n1. Kamera (built-in) - Tekan F3\n2. Hardware scanner (USB/Bluetooth)\n\nSupport format: EAN13, EAN8, Code128, QR Code. Pastikan pencahayaan cukup dan barcode tidak rusak! 📷';
        } else if (query.includes('struk') || query.includes('print') || query.includes('cetak')) {
          assistantMessage = 'Untuk cetak struk:\n1. Selesaikan transaksi\n2. Struk auto-print (jika printer connected)\n3. Atau klik "Cetak Struk" di detail transaksi\n\nKamu bisa custom template struk di Settings > Toko. Support printer thermal 58mm & 80mm! 🖨️';
        } else if (query.includes('saran') || query.includes('rekomendasi') || query.includes('tips')) {
          assistantMessage = 'Saran untuk tingkatkan penjualan:\n1. Analisis produk terlaris & slow-moving\n2. Buat bundle promo produk komplementer\n3. Diskon untuk produk yang kurang laku\n4. Training kasir untuk upselling\n5. Program loyalitas pelanggan\n6. Marketing di social media\n\nCek Laporan untuk data-driven insights! 💡';
        } else if (query.includes('laporan') || query.includes('report') || query.includes('analisis')) {
          assistantMessage = 'Menu Laporan punya 4 tab:\n1. Overview - Metrik utama (Revenue, Profit, Margin)\n2. Produk - Top 10 terlaris, slow-moving\n3. Karyawan - Ranking performa\n4. Grafik - Tren pendapatan 7 hari\n\nSemua realtime sync dengan Firebase! 📈';
        } else if (query.includes('help') || query.includes('bantuan') || query.includes('cara')) {
          assistantMessage = 'Butuh bantuan? Saya bisa bantu dengan:\n- Cara pakai fitur kasir\n- Setup barcode scanner\n- Manage produk & stok\n- Kelola karyawan\n- Analisis laporan\n- Tips bisnis\n\nTanya aja spesifik, misalnya: "Bagaimana cara scan barcode?" 🤝';
        } else if (query.includes('error') || query.includes('bug') || query.includes('masalah') || query.includes('kendala') || query.includes('tidak bisa') || query.includes('gagal')) {
          assistantMessage = '⚠️ Ada masalah teknis? Saya sarankan hubungi developer langsung untuk bantuan cepat:\n\n📱 **Gibran Ade Bintang**\n[Klik untuk WhatsApp](https://wa.me/6281340078956)\n\nJelaskan masalahnya dengan detail (screenshot jika perlu) agar bisa dibantu lebih cepat! 🚀';
        } else if (query.includes('sewa') || query.includes('berlangganan') || query.includes('upgrade') || query.includes('plan') || query.includes('paket') || query.includes('harga') || query.includes('biaya')) {
          assistantMessage = '💎 Tertarik upgrade ke plan premium?\n\nBetaKasir punya 3 plan:\n- **Free** - Fitur dasar\n- **Pro** - Unlimited produk & karyawan\n- **Enterprise** - AI Assistant + Advanced Analytics\n\nUntuk info lengkap harga & cara berlangganan, hubungi:\n\n📱 **Gibran Ade Bintang**\n[Klik untuk WhatsApp](https://wa.me/6281340078956)\n\nDapatkan penawaran terbaik! 🎉';
        } else {
          assistantMessage = `Terima kasih sudah bertanya! Saat ini saya dalam DEMO MODE (offline). Untuk jawaban yang lebih spesifik dan analisis mendalam berdasarkan data bisnis kamu, kamu perlu:\n\n1. Setup API key AI (Gemini/OpenRouter/DeepSeek)\n2. Atau upgrade ke plan yang include AI Assistant\n\nTapi saya tetap bisa bantu dengan:\n- Panduan fitur BetaKasir\n- Tips & trik kasir\n- Best practices bisnis\n\nAda yang bisa saya bantu? 😊`;
        }
        
        // Simulate API delay for realism
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } else if (USE_DEEPSEEK) {
        console.log('✨ Calling DeepSeek API');
        response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: this.SYSTEM_PROMPT
              },
              {
                role: 'user',
                content: fullMessage
              }
            ],
            temperature: 0.7,
            max_tokens: 500,
          })
        });
      } else if (USE_HUGGINGFACE) {
        console.log('✨ Calling Hugging Face API');
        
        // Use Mistral-7B-Instruct - Fast, Free, Unlimited!
        const prompt = `<s>[INST] ${this.SYSTEM_PROMPT}\n\n${fullMessage} [/INST]`;
        
        response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // API key optional - works without it!
            ...(HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY !== 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' 
              ? { 'Authorization': `Bearer ${HUGGINGFACE_API_KEY}` }
              : {}
            ),
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              top_p: 0.95,
              return_full_text: false,
            }
          })
        });
      } else if (USE_OPENROUTER) {
        console.log('✨ Calling OpenRouter API');
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://betakasir.app',
            'X-Title': 'BetaKasir AI Assistant',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [
              {
                role: 'system',
                content: this.SYSTEM_PROMPT
              },
              {
                role: 'user',
                content: fullMessage
              }
            ],
            temperature: 0.7,
            max_tokens: 500,
          })
        });
      } else {
        console.log('✨ Calling Google Gemini API');
        // Use gemini-flash-lite-latest (fastest & most reliable!)
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `${this.SYSTEM_PROMPT}\n\n${fullMessage}\n\nAssistant:`
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              }
            })
          }
        );
      }

      // Check response only if not in DEMO MODE
      if (!USE_DEMO_MODE && response) {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('📦 Full API Response:', JSON.stringify(data, null, 2));
        
        if (USE_DEEPSEEK) {
        // DeepSeek uses OpenAI-compatible format
        assistantMessage = data.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa memproses pertanyaan Anda saat ini.';
      } else if (USE_HUGGINGFACE) {
        // Hugging Face returns array with generated_text
        if (Array.isArray(data) && data.length > 0) {
          assistantMessage = data[0].generated_text || 'Maaf, saya tidak bisa memproses pertanyaan Anda saat ini.';
        } else if (data.error) {
          // Model loading, retry after a moment
          if (data.error.includes('loading')) {
            assistantMessage = '⏳ Model sedang loading... Coba lagi dalam beberapa detik.';
          } else {
            throw new Error(data.error);
          }
        } else {
          assistantMessage = 'Maaf, saya tidak bisa memproses pertanyaan Anda saat ini.';
        }
      } else if (USE_OPENROUTER) {
        assistantMessage = data.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa memproses pertanyaan Anda saat ini.';
      } else {
          assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak bisa memproses pertanyaan Anda saat ini.';
        }
      }
      
      // Clean up response
      assistantMessage = assistantMessage.trim();
      
      // Check if empty
      if (!assistantMessage || assistantMessage.length === 0) {
        assistantMessage = 'Maaf, AI tidak memberikan response. Silakan coba lagi.';
      }
      
      console.log('✅ Response received from Gemini');
      console.log('💬 Assistant Message:', assistantMessage);

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date(),
      });

      // Cache the response for future instant replies
      this.responseCache.set(cacheKey, {
        response: assistantMessage,
        timestamp: Date.now()
      });

      console.log('✅ Message sent successfully');
      return assistantMessage;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    console.log('🗑️ Chat history cleared');
  }

  getHistory(): ChatMessage[] {
    return this.conversationHistory;
  }
}

// Singleton instance
export const geminiService = new GeminiService();
