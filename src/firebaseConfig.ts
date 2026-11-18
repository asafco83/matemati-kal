/**
 * הגדרות Firebase של האפליקציה.
 * הערכים האלה אינם סודיים: הם מזהים את הפרויקט בלבד, וההגנה על המידע נעשית בכללי Firestore.
 * מאיפה לוקחים אותם: Firebase Console > Project settings > Your apps > Web app > SDK setup.
 * כל עוד apiKey ריק, הלומדה עובדת במצב מקומי בלבד (בלי התחברות ובלי סנכרון).
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyAwhoq6MqE0q-AFo_87H8t5ZBi33VM5LcY',
  authDomain: 'matemati-kal.firebaseapp.com',
  projectId: 'matemati-kal',
  storageBucket: 'matemati-kal.firebasestorage.app',
  messagingSenderId: '603805464211',
  appId: '1:603805464211:web:0ff6cda97883dd3e0aff66',
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== '' && firebaseConfig.appId !== '';
