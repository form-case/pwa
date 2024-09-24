import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyASEntqKqf_hL-LOm-7SJs-JWZ5304NbZs",
  authDomain: "form-case-f0609.firebaseapp.com",
  projectId: "form-case-f0609",
  storageBucket: "form-case-f0609.appspot.com",
  messagingSenderId: "725568571431",
  appId: "1:725568571431:web:c37526e78129aff628e602",
  measurementId: "G-28XLKVLLHW"
};

const app = initializeApp(firebaseConfig);

// Solo ejecuta Analytics en el cliente
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
  logEvent(analytics, 'notification_received'); // Ejemplo de uso de logEvent
}

export { app, analytics };
