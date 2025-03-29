import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Fungsi untuk inisialisasi Firebase
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

// Inisialisasi Firebase dan Auth
let auth;
initializeFirebase()
  .then(app => {
    auth = getAuth(app);
    console.log('Firebase initialized successfully');
  })
  .catch(error => {
    Swal.fire('Error', 'Gagal memuat sistem autentikasi', 'error');
  });

// Sign out functionality
document.getElementById('signoutBtn')?.addEventListener('click', async () => {
    try {
      const result = await Swal.fire({
        title: 'Apakah Anda yakin?',
        text: "Anda akan keluar dari dashboard admin.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, keluar',
        cancelButtonText: 'Batal'
      });
  
      if (result.isConfirmed) {
        // 1. Hapus session di server
        const response = await fetch('/api/signout', {
            method: 'POST',
            credentials: 'include'
          });
          
          const data = await response.json(); // Add this line
          if (!response.ok || !data.success) { // Modified check
            throw new Error('Gagal menghapus sesi di server');
          }
  
  
        // 2. Hapus data client-side
        if (auth) await signInWithEmailAndPassword(auth);
        localStorage.clear();
        sessionStorage.clear();
  
        // 3. Redirect ke halaman login DENGAN cache busting
        window.location.href = '/signin?t=' + Date.now();
      }
    } catch (error) {
      console.error('Error logout:', error);
      // Force redirect meskipun error
      window.location.href = '/signin?error=logout_failed';
    }
  });

// Optional: Cek status login saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verifikasi session dengan server
    const response = await fetch('/api/check-session', {
      credentials: 'same-origin'
    });

    if (!response.ok) {
      window.location.href = '/signin';
    }
  } catch (error) {
    console.error('Session check failed:', error);
    window.location.href = '/signin';
  }
});