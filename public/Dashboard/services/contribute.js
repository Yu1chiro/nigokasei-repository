import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { 
  getDatabase, 
  ref, get,
  onValue, 
  update,
  remove
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

// Fungsi untuk memformat tanggal
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Fungsi untuk memuat data ke tabel
function loadContributeData() {
  const contributeRef = ref(database, 'contribute-users');
  
  onValue(contributeRef, (snapshot) => {
    const data = snapshot.val();
    const tableBody = document.getElementById('contribute-users');
    tableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi ulang
    
    if (!data) {
      tableBody.innerHTML = '<tr><td colspan="10" class="px-6 py-4 text-center text-gray-500">Tidak ada data</td></tr>';
      return;
    }
    
    Object.entries(data).forEach(([key, value]) => {
      const row = document.createElement('tr');
      
      // Format data untuk setiap kolom
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatTimestamp(value.timestamp)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${value.name || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${value.email || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${value.titleMateri || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${value.jenisMateri || '-'}</td>
        <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${value.deskripsiMateri || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <a href="${value.linkMateri}" target="_blank" class="text-indigo-600 hover:text-indigo-900">Lihat</a>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${value.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
            ${value.status || 'pending'}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button data-id="${key}" data-action="detail" class="text-blue-600 hover:text-blue-900 mr-2">Detail</button>
          <button data-id="${key}" data-action="approve" class="text-indigo-600 hover:text-indigo-900 mr-2">Approve</button>
          <button data-id="${key}" data-action="remove" class="text-red-600 hover:text-red-900">Remove</button>
        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Tambahkan event listener untuk tombol aksi
    document.querySelectorAll('[data-action="detail"]').forEach(button => {
      button.addEventListener('click', handleDetail);
    });
    
    document.querySelectorAll('[data-action="approve"]').forEach(button => {
      button.addEventListener('click', handleApprove);
    });
    
    document.querySelectorAll('[data-action="remove"]').forEach(button => {
      button.addEventListener('click', handleRemove);
    });
  });
}

// Fungsi untuk menangani detail
async function handleDetail(event) {
  const id = event.target.getAttribute('data-id');
  const contributeRef = ref(database, `contribute-users/${id}`);
  
  try {
    const snapshot = await get(contributeRef);
    const data = snapshot.val();
    
    if (!data) {
      Swal.fire('Error', 'Data tidak ditemukan', 'error');
      return;
    }
    
    // Format HTML untuk modal detail
    const detailHtml = `
      <div class="text-left space-y-4">
        <div class="border-b pb-2">
          <h3 class="text-lg font-medium text-gray-900">Detail Kontribusi</h3>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Nama Pendek</p>
            <p class="text-sm text-gray-900 mt-1">${data.name || '-'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Email</p>
            <p class="text-sm text-gray-900 mt-1">${data.email || '-'}</p>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Judul Materi</p>
            <p class="text-sm text-gray-900 mt-1">${data.titleMateri || '-'}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Jenis Materi</p>
            <p class="text-sm text-gray-900 mt-1">${data.jenisMateri || '-'}</p>
          </div>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Deskripsi Lengkap</p>
          <p class="text-sm text-gray-900 mt-1 whitespace-pre-line">${data.deskripsiMateri || '-'}</p>
        </div>
        
        <div>
          <p class="text-sm font-medium text-gray-500">Link Materi</p>
          <a href="${data.linkMateri}" target="_blank" class="text-sm text-indigo-600 hover:text-indigo-900 break-all">${data.linkMateri || '-'}</a>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm font-medium text-gray-500">Status</p>
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
              ${data.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
              ${data.status || 'pending'}
            </span>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Waktu Submit</p>
            <p class="text-sm text-gray-900 mt-1">${formatTimestamp(data.timestamp)}</p>
          </div>
        </div>
      </div>
    `;
    
    Swal.fire({
      title: 'Detail Kontribusi',
      html: detailHtml,
      width: '800px',
      padding: '2rem',
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        container: 'detail-modal-container',
        popup: 'detail-modal-popup',
        header: 'detail-modal-header',
        closeButton: 'detail-modal-close-button'
      }
    });
    
  } catch (error) {
    console.error('Error showing detail:', error);
    Swal.fire('Error', 'Gagal memuat detail: ' + error.message, 'error');
  }
}

// Fungsi untuk menangani approve
async function handleApprove(event) {
  const id = event.target.getAttribute('data-id');
  
  try {
    const updates = {};
    updates[`contribute-users/${id}/status`] = 'approved';
    
    await update(ref(database), updates);
    Swal.fire('Success', 'Status berhasil diupdate!', 'success');
  } catch (error) {
    console.error('Error approving:', error);
    Swal.fire('Error', 'Gagal mengupdate status: ' + error.message, 'error');
  }
}

// Fungsi untuk menangani remove
async function handleRemove(event) {
  const id = event.target.getAttribute('data-id');
  
  const result = await Swal.fire({
    title: 'Apakah Anda yakin?',
    text: "Data yang dihapus tidak dapat dikembalikan!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, hapus!',
    cancelButtonText: 'Batal'
  });
  
  if (result.isConfirmed) {
    try {
      await remove(ref(database, `contribute-users/${id}`));
      Swal.fire('Deleted!', 'Data berhasil dihapus.', 'success');
    } catch (error) {
      console.error('Error removing:', error);
      Swal.fire('Error', 'Gagal menghapus data: ' + error.message, 'error');
    }
  }
}

// Inisialisasi ketika DOM siap
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initializeFirebase();
    loadContributeData();
  } catch (error) {
    console.error('Initialization error:', error);
    Swal.fire('Error', 'Gagal memuat sistem. Silakan refresh halaman.', 'error');
  }
});