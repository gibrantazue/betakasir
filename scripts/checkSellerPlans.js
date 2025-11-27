const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSellerPlans() {
  try {
    console.log('🔍 Mengecek plan sellers di database...\n');

    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`📊 Total users: ${usersSnapshot.size}\n`);
    
    const planStats = {
      free: 0,
      standard: 0,
      pro: 0,
      business: 0,
      unknown: 0
    };

    const sellersWithReferral = [];

    usersSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Get plan from multiple sources
      let plan = 'unknown';
      if (data.subscription && data.subscription.plan) {
        plan = data.subscription.plan;
      } else if (data.subscriptionPlan) {
        plan = data.subscriptionPlan;
      } else if (data.plan) {
        plan = data.plan;
      }

      // Count plan stats
      if (planStats[plan.toLowerCase()] !== undefined) {
        planStats[plan.toLowerCase()]++;
      } else {
        planStats.unknown++;
      }

      // Check if has referral code
      if (data.referralCode) {
        sellersWithReferral.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          referralCode: data.referralCode,
          plan: plan,
          subscriptionData: {
            'subscription.plan': data.subscription?.plan,
            'subscriptionPlan': data.subscriptionPlan,
            'plan': data.plan,
          }
        });
      }
    });

    console.log('📈 Statistik Plan:');
    console.log(`   Free: ${planStats.free}`);
    console.log(`   Standard: ${planStats.standard}`);
    console.log(`   Pro: ${planStats.pro}`);
    console.log(`   Business: ${planStats.business}`);
    console.log(`   Unknown: ${planStats.unknown}\n`);

    if (sellersWithReferral.length > 0) {
      console.log(`👥 Sellers dengan Referral Code (${sellersWithReferral.length}):\n`);
      
      sellersWithReferral.forEach((seller, index) => {
        console.log(`${index + 1}. ${seller.displayName || seller.email}`);
        console.log(`   Email: ${seller.email}`);
        console.log(`   Referral Code: ${seller.referralCode}`);
        console.log(`   Plan: ${seller.plan}`);
        console.log(`   Data Sources:`);
        console.log(`     - subscription.plan: ${seller.subscriptionData['subscription.plan'] || 'null'}`);
        console.log(`     - subscriptionPlan: ${seller.subscriptionData.subscriptionPlan || 'null'}`);
        console.log(`     - plan: ${seller.subscriptionData.plan || 'null'}`);
        console.log('');
      });
    } else {
      console.log('❌ Tidak ada sellers dengan referral code\n');
    }

    // Check for sellers with wrong plan detection
    const wrongPlanDetection = sellersWithReferral.filter(seller => {
      const hasProOrStandard = 
        seller.subscriptionData['subscription.plan'] === 'pro' ||
        seller.subscriptionData['subscription.plan'] === 'standard' ||
        seller.subscriptionData.subscriptionPlan === 'pro' ||
        seller.subscriptionData.subscriptionPlan === 'standard' ||
        seller.subscriptionData.plan === 'pro' ||
        seller.subscriptionData.plan === 'standard';
      
      return hasProOrStandard && seller.plan === 'free';
    });

    if (wrongPlanDetection.length > 0) {
      console.log('⚠️  MASALAH DITEMUKAN - Sellers dengan plan salah terdeteksi:\n');
      wrongPlanDetection.forEach((seller, index) => {
        console.log(`${index + 1}. ${seller.displayName || seller.email}`);
        console.log(`   Terdeteksi sebagai: ${seller.plan}`);
        console.log(`   Seharusnya: ${seller.subscriptionData['subscription.plan'] || seller.subscriptionData.subscriptionPlan || seller.subscriptionData.plan}`);
        console.log('');
      });
    } else {
      console.log('✅ Semua plan terdeteksi dengan benar!\n');
    }

    console.log('✅ Pengecekan selesai!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSellerPlans();
