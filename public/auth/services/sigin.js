import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Fungsi untuk mendapatkan konfigurasi Firebase dari server
async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Gagal memuat konfigurasi');
    const firebaseConfig = await response.json();
    return initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Inisialisasi Firebase
let auth;
initializeFirebase().then(app => {
  auth = getAuth(app);
}).catch(error => {
  Swal.fire('Error', 'Gagal memuat sistem autentikasi', 'error');
});

// Handle Form Signin
document.getElementById('signinForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    if (!auth) throw new Error('Sistem autentikasi belum siap');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Verifikasi email
    if (!user.emailVerified) {
      await sendEmailVerification(user);
      throw new Error('Email belum diverifikasi. Silakan cek email Anda');
    }
    
    // Dapatkan ID token
    const idToken = await user.getIdToken();
    
    // Buat session di server
    const response = await fetch('/api/sessionLogin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Gagal membuat sesi');
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Login Berhasil',
      showConfirmButton: false,
      timer: 1500
    }).then(() => {
      window.location.href = '/Dashboard/admin';
    });
    
  } catch (error) {
    console.error('Login error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Login Gagal',
      text: error.message
    });
  }
});