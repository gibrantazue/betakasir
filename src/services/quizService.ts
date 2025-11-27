// Interactive Quiz Service
import { Quiz, QuizQuestion, QuizResult } from '../types/aiAdvanced';

class QuizService {
  // Generate quiz based on category
  generateQuiz(category: string, difficulty: string = 'sedang'): Quiz {
    const quizzes = this.getQuizTemplates();
    const filtered = quizzes.filter(q => 
      q.category === category && q.difficulty === difficulty
    );
    
    return filtered[0] || quizzes[0];
  }

  private getQuizTemplates(): Quiz[] {
    return [
      {
        id: 'kasir-basic',
        title: 'Kuis Dasar Kasir',
        description: 'Test pengetahuan dasar mengoperasikan kasir',
        category: 'kasir',
        difficulty: 'mudah',
        questions: [
          {
            id: 'q1',
            question: 'Shortcut keyboard untuk fokus ke search bar adalah?',
            options: ['F1', 'F2', 'F3', 'F4'],
            correctAnswer: 1,
            explanation: 'F2 digunakan untuk fokus ke search bar agar bisa langsung ketik nama produk',
            points: 10,
          },
          {
            id: 'q2',
            question: 'Untuk scan barcode menggunakan kamera, tekan tombol?',
            options: ['F2', 'F3', 'F4', 'F5'],
            correctAnswer: 1,
            explanation: 'F3 membuka kamera untuk scan barcode produk',
            points: 10,
          },
          {
            id: 'q3',
            question: 'Shortcut untuk proses pembayaran adalah?',
            options: ['F6', 'F7', 'F8', 'F9'],
            correctAnswer: 2,
            explanation: 'F8 untuk membuka dialog pembayaran',
            points: 10,
          },
          {
            id: 'q4',
            question: 'Untuk pembayaran tunai cepat, tekan?',
            options: ['F8', 'F9', 'F10', 'F11'],
            correctAnswer: 1,
            explanation: 'F9 untuk pembayaran tunai langsung',
            points: 10,
          },
          {
            id: 'q5',
            question: 'Target waktu ideal per transaksi adalah?',
            options: ['< 10 detik', '< 20 detik', '< 30 detik', '< 60 detik'],
            correctAnswer: 1,
            explanation: 'Target ideal adalah < 20 detik untuk efisiensi maksimal',
            points: 10,
          },
        ],
        createdAt: new Date(),
      },
      {
        id: 'produk-advanced',
        title: 'Kuis Manajemen Produk',
        description: 'Test pengetahuan tentang manajemen produk dan stok',
        category: 'produk',
        difficulty: 'sedang',
        questions: [
          {
            id: 'q1',
            question: 'Apa yang dimaksud dengan HPP?',
            options: [
              'Harga Pokok Penjualan',
              'Harga Produk Penjualan',
              'Harga Pasar Penjualan',
              'Harga Pokok Pembelian',
            ],
            correctAnswer: 0,
            explanation: 'HPP adalah Harga Pokok Penjualan, yaitu biaya untuk mendapatkan/membuat produk',
            points: 15,
          },
          {
            id: 'q2',
            question: 'Rumus menghitung profit margin adalah?',
            options: [
              '(Harga Jual - HPP) / Harga Jual × 100%',
              '(Harga Jual - HPP) / HPP × 100%',
              'Harga Jual / HPP × 100%',
              'HPP / Harga Jual × 100%',
            ],
            correctAnswer: 0,
            explanation: 'Profit Margin = (Harga Jual - HPP) / Harga Jual × 100%',
            points: 20,
          },
          {
            id: 'q3',
            question: 'Kapan sebaiknya restock produk?',
            options: [
              'Saat stok habis',
              'Saat stok < 10',
              'Saat stok mencapai minimum yang ditentukan',
              'Setiap hari',
            ],
            correctAnswer: 2,
            explanation: 'Restock saat mencapai minimum stock yang sudah ditentukan untuk menghindari kehabisan',
            points: 15,
          },
          {
            id: 'q4',
            question: 'Produk slow-moving sebaiknya?',
            options: [
              'Dihapus dari sistem',
              'Diberi diskon untuk mempercepat penjualan',
              'Dibiarkan saja',
              'Ditambah stoknya',
            ],
            correctAnswer: 1,
            explanation: 'Produk slow-moving sebaiknya diberi diskon atau promo untuk mempercepat perputaran',
            points: 15,
          },
        ],
        createdAt: new Date(),
      },
      {
        id: 'bisnis-strategy',
        title: 'Kuis Strategi Bisnis',
        description: 'Test pemahaman strategi bisnis dan analisis',
        category: 'bisnis',
        difficulty: 'sulit',
        questions: [
          {
            id: 'q1',
            question: 'Apa yang dimaksud dengan ROI (Return on Investment)?',
            options: [
              'Total pendapatan',
              'Persentase keuntungan dari investasi',
              'Total biaya operasional',
              'Jumlah pelanggan',
            ],
            correctAnswer: 1,
            explanation: 'ROI adalah persentase keuntungan yang didapat dari investasi yang dilakukan',
            points: 20,
          },
          {
            id: 'q2',
            question: 'Metrik paling penting untuk mengukur kesehatan bisnis adalah?',
            options: [
              'Total penjualan',
              'Jumlah transaksi',
              'Profit margin & cash flow',
              'Jumlah produk',
            ],
            correctAnswer: 2,
            explanation: 'Profit margin dan cash flow adalah indikator utama kesehatan bisnis',
            points: 25,
          },
          {
            id: 'q3',
            question: 'Strategi terbaik untuk meningkatkan average transaction value?',
            options: [
              'Menurunkan harga semua produk',
              'Upselling & cross-selling',
              'Menambah jumlah produk',
              'Mengurangi stok',
            ],
            correctAnswer: 1,
            explanation: 'Upselling (jual produk lebih mahal) dan cross-selling (jual produk komplementer) efektif tingkatkan nilai transaksi',
            points: 25,
          },
        ],
        createdAt: new Date(),
      },
    ];
  }

  // Calculate quiz result
  calculateResult(quiz: Quiz, userAnswers: number[]): QuizResult {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    const answers = quiz.questions.map((q, index) => {
      const isCorrect = q.correctAnswer === userAnswers[index];
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += q.points;
      }
      totalPoints += q.points;

      return {
        questionId: q.id,
        selectedAnswer: userAnswers[index],
        isCorrect,
        timeSpent: 0,
      };
    });

    return {
      quizId: quiz.id,
      score: Math.round((earnedPoints / totalPoints) * 100),
      totalPoints,
      correctAnswers,
      totalQuestions: quiz.questions.length,
      answers,
      completedAt: new Date(),
    };
  }

  // Get feedback based on score
  getFeedback(score: number): string {
    if (score >= 90) {
      return '🏆 Luar biasa! Anda master di bidang ini!';
    } else if (score >= 75) {
      return '🎉 Bagus sekali! Pengetahuan Anda sangat baik!';
    } else if (score >= 60) {
      return '👍 Cukup baik! Masih ada ruang untuk improvement.';
    } else if (score >= 40) {
      return '📚 Perlu belajar lebih banyak. Jangan menyerah!';
    } else {
      return '💪 Tetap semangat! Coba pelajari materinya lagi.';
    }
  }

  // Get all available quizzes
  getAllQuizzes(): Quiz[] {
    return this.getQuizTemplates();
  }

  // Get quiz by category
  getQuizzesByCategory(category: string): Quiz[] {
    return this.getQuizTemplates().filter(q => q.category === category);
  }
}

export const quizService = new QuizService();
