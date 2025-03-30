import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { 
  getDatabase, 
  ref, 
  push, 
  set 
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Inisialisasi Firebase
let app;
let database;
let auth;

async function initializeFirebase() {
  try {
    const response = await fetch('/firebase-config');
    if (!response.ok) throw new Error('Gagal memuat konfigurasi');
    const firebaseConfig = await response.json();
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    auth = getAuth(app);
    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Fungsi untuk menangani pengiriman form
async function handleFormSubmit(event) {
  event.preventDefault();
   
  const submitButton = document.getElementById('submit-button'); // Pastikan button submit memiliki id ini
  const originalButtonText = submitButton.innerHTML;
  
  // Set button ke state loading
  submitButton.innerHTML = `
    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    Mengirim...
  `;
  submitButton.disabled = true;
  // Ambil nilai dari form
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const titleMateri = document.getElementById('title-materi').value;
  const jenisMateri = document.getElementById('jenis-materi').value;
  const deskripsiMateri = document.getElementById('deskripsi-materi').value;
  const linkMateri = document.getElementById('link-materi').value;
  
  // Validasi form
  if (!name || !email || !titleMateri || !jenisMateri || !deskripsiMateri || !linkMateri) {
    Swal.fire('Error', 'Semua field harus diisi!', 'error');
    submitButton.innerHTML = originalButtonText;
    submitButton.disabled = false;
    return;
  }
  
  // Validasi email undiksha
  if (!email.endsWith('@student.undiksha.ac.id')) {
    Swal.fire('Error', 'Harap gunakan email Undiksha (@undiksha.ac.id)', 'error');
    submitButton.innerHTML = originalButtonText;
    submitButton.disabled = false;
    return;
  }
  
  try {
    // Buat objek data
    const contributeData = {
      name,
      email,
      titleMateri,
      jenisMateri,
      deskripsiMateri,
      linkMateri,
      timestamp: new Date().toISOString(),
      status: 'pending' // Status default
    };
    
    // Kirim data ke Firebase Realtime Database
    const newContributeRef = push(ref(database, 'contribute-users'));
    await set(newContributeRef, contributeData);
    
    // Kirim notifikasi ke server Express
    await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contributeData)
    });
    
    // Tampilkan pesan sukses
    Swal.fire('Success', 'Materi berhasil dikirim!', 'success');
    
    // Reset form
    document.getElementById('contribute-form').reset();
    
  } catch (error) {
    console.error('Error submitting data:', error);
    Swal.fire('Error', 'Gagal mengirim materi: ' + error.message, 'error');
  } finally {
    submitButton.innerHTML = originalButtonText;
    submitButton.disabled = false;
  }

}

// Inisialisasi ketika DOM siap
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeFirebase();
    
    // Tambahkan event listener untuk form
    const form = document.getElementById('contribute-form');
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    }
    
  } catch (error) {
    console.error('Initialization error:', error);
    Swal.fire('Error', 'Gagal memuat sistem. Silakan refresh halaman.', 'error');
  }
});
