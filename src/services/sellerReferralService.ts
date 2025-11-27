import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SalesPerson {
  id: string;
  name: string;
  phone?: string;
  referralCode: string;
  totalReferrals: number;
  createdAt: string;
}

/**
 * Apply referral code untuk seller
 * Menghubungkan seller dengan sales person
 */
export const applyReferralCode = async (
  sellerUid: string,
  referralCode: string
): Promise<{ success: boolean; message: string; salesPerson?: SalesPerson }> => {
  try {
    console.log('🎁 Applying referral code:', referralCode, 'for seller:', sellerUid);

    // 1. Cek apakah seller sudah punya referral code
    const sellerDoc = await getDoc(doc(db, 'users', sellerUid));
    if (!sellerDoc.exists()) {
      return { success: false, message: 'Seller tidak ditemukan' };
    }

    const sellerData = sellerDoc.data();
    if (sellerData.referralCode) {
      return { 
        success: false, 
        message: 'Anda sudah menggunakan kode referral sebelumnya' 
      };
    }

    // 2. Cari sales person dengan kode referral ini
    const salesQuery = query(
      collection(db, 'salesPeople'),
      where('referralCode', '==', referralCode.toUpperCase())
    );
    const salesSnapshot = await getDocs(salesQuery);

    if (salesSnapshot.empty) {
      return { 
        success: false, 
        message: 'Kode referral tidak valid' 
      };
    }

    const salesDoc = salesSnapshot.docs[0];
    const salesData = salesDoc.data() as SalesPerson;
    const salesId = salesDoc.id;

    // 3. Update seller document dengan referral info
    await updateDoc(doc(db, 'users', sellerUid), {
      referralCode: referralCode.toUpperCase(),
      referredBy: salesId,
      referredAt: new Date().toISOString(),
    });

    // 4. Increment totalReferrals di sales person
    await updateDoc(doc(db, 'salesPeople', salesId), {
      totalReferrals: increment(1),
    });

    console.log('✅ Referral code applied successfully');

    return {
      success: true,
      message: 'Kode referral berhasil diterapkan!',
      salesPerson: {
        ...salesData,
        id: salesId,
        totalReferrals: (salesData.totalReferrals || 0) + 1,
      },
    };
  } catch (error: any) {
    console.error('❌ Error applying referral code:', error);
    return {
      success: false,
      message: error.message || 'Gagal menerapkan kode referral',
    };
  }
};

/**
 * Get referral info untuk seller
 */
export const getSellerReferralInfo = async (
  sellerUid: string
): Promise<{
  hasReferral: boolean;
  referralCode?: string;
  salesPerson?: SalesPerson;
}> => {
  try {
    const sellerDoc = await getDoc(doc(db, 'users', sellerUid));
    if (!sellerDoc.exists()) {
      return { hasReferral: false };
    }

    const sellerData = sellerDoc.data();
    if (!sellerData.referralCode || !sellerData.referredBy) {
      return { hasReferral: false };
    }

    // Get sales person info
    const salesDoc = await getDoc(doc(db, 'salesPeople', sellerData.referredBy));
    if (!salesDoc.exists()) {
      return {
        hasReferral: true,
        referralCode: sellerData.referralCode,
      };
    }

    const salesData = salesDoc.data() as SalesPerson;

    return {
      hasReferral: true,
      referralCode: sellerData.referralCode,
      salesPerson: {
        ...salesData,
        id: salesDoc.id,
      },
    };
  } catch (error) {
    console.error('Error getting referral info:', error);
    return { hasReferral: false };
  }
};

/**
 * Remove referral code dari seller (jika diperlukan)
 */
export const removeReferralCode = async (
  sellerUid: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const sellerDoc = await getDoc(doc(db, 'users', sellerUid));
    if (!sellerDoc.exists()) {
      return { success: false, message: 'Seller tidak ditemukan' };
    }

    const sellerData = sellerDoc.data();
    if (!sellerData.referredBy) {
      return { success: false, message: 'Tidak ada kode referral yang aktif' };
    }

    // Decrement totalReferrals di sales person
    await updateDoc(doc(db, 'salesPeople', sellerData.referredBy), {
      totalReferrals: increment(-1),
    });

    // Remove referral info dari seller
    await updateDoc(doc(db, 'users', sellerUid), {
      referralCode: null,
      referredBy: null,
      referredAt: null,
    });

    return {
      success: true,
      message: 'Kode referral berhasil dihapus',
    };
  } catch (error: any) {
    console.error('Error removing referral code:', error);
    return {
      success: false,
      message: error.message || 'Gagal menghapus kode referral',
    };
  }
};
