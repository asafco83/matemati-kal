/**
 * הגדרות Firebase של האפליקציה.
 * הערכים האלה אינם סודיים: הם מזהים את הפרויקט בלבד, וההגנה על המידע נעשית בכללי Firestore.
 * מאיפה לוקחים אותם: Firebase Console > Project settings > Your apps > Web app > SDK setup.
 * כל עוד apiKey ריק, הלומדה עובדת במצב מקומי בלבד (בלי התחברות ובלי סנכרון).
 */
export const firebaseConfig = {
  apiKey: '',
  authDomain: 'matemati-kal.firebaseapp.com',
  projectId: 'matemati-kal',
  storageBucket: 'matemati-kal.firebasestorage.app',
  messagingSenderId: '',
  appId: '',
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== '' && firebaseConfig.appId !== '';
