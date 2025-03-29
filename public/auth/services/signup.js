import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Inisialisasi Firebase
let auth;
initializeFirebase().then(app => {
  auth = getAuth(app);
}).catch(error => {
  Swal.fire('Error', 'Gagal memuat sistem pendaftaran', 'error');
});

// Handle Form Signup
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (password !== confirmPassword) {
    Swal.fire('Error', 'Password tidak sama', 'error');
    return;
  }
  
  try {
    if (!auth) throw new Error('Sistem pendaftaran belum siap');
    
    // Buat user baru
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update nama user
    await updateProfile(user, { displayName: name });
    
    // Kirim email verifikasi
    await sendEmailVerification(user);
    
    // Dapatkan ID token untuk backend
    const idToken = await user.getIdToken();
    
    // Simpan data tambahan ke database Anda
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ name, email })
    });
    
    if (!response.ok) {
      throw new Error('Gagal menyimpan data tambahan');
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Pendaftaran Berhasil',
      html: `Silakan verifikasi email Anda. <br/>Email verifikasi telah dikirim ke ${email}`,
      confirmButtonText: 'OK'
    }).then(() => {
      window.location.href = '/signin';
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    let errorMessage = error.message;
    
    // Terjemahkan error message yang umum
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email sudah terdaftar';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password terlalu lemah (minimal 6 karakter)';
    }
    
    Swal.fire({
      icon: 'error',
      title: 'Pendaftaran Gagal',
      text: errorMessage
    });
  }
});

// Fungsi yang sama dengan signin.js untuk inisialisasi
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