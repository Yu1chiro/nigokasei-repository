document.addEventListener('DOMContentLoaded', () => {
    const materiCardContainer = document.getElementById('materi-card');
    let currentPage = 1;
    const itemsPerPage = 6;
    let allData = [];
    let loadMoreButton = null;

    // Fungsi untuk membuat/menghapus tombol load more
    function updateLoadMoreButton() {
        const remainingItems = allData.length - (currentPage * itemsPerPage);
        
        if (remainingItems > 0 && !loadMoreButton) {
            // Buat tombol jika masih ada data dan tombol belum ada
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'mt-10 text-center';
            
            loadMoreButton = document.createElement('button');
            loadMoreButton.type = 'button';
            loadMoreButton.className = 'inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700';
            loadMoreButton.innerHTML = `
                Lihat Semua Kategori
                <svg class="ml-3 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            `;
            
            loadMoreButton.addEventListener('click', loadMore);
            buttonContainer.appendChild(loadMoreButton);
            materiCardContainer.after(buttonContainer);
        } else if (remainingItems <= 0 && loadMoreButton) {
            // Hapus tombol jika tidak ada data lagi
            loadMoreButton.parentNode.remove();
            loadMoreButton = null;
        }
    }

    // Fungsi untuk memuat data dari API
    async function fetchData() {
        try {
            const response = await fetch('/api/records');
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    // Fungsi untuk menampilkan data dalam card
    // Fungsi untuk mengekstrak ID dari link Google Drive
function extractGoogleDriveId(url) {
    if (!url) return null;
    // Support untuk berbagai format link Google Drive
    const regex = /(?:https:\/\/drive\.google\.com\/file\/d\/|id=)([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]{28,})/;
    const match = url.match(regex);
    return match ? (match[1] || match[2]) : null;
}

// Fungsi untuk generate thumbnail URL
function getThumbnailUrl(url) {
    const id = extractGoogleDriveId(url);
    return id ? `/asset/${id}` : url;
}
function getDownloadUrl(url) {
    const id = extractGoogleDriveId(url);
    if (!id) return url;
    
    // Format URL download langsung Google Drive
    return `https://drive.google.com/uc?export=download&id=${id}`;
}

// Fungsi untuk menampilkan data dalam card
function displayData(data) {
    if (!Array.isArray(data)) return;
    
    data.forEach(item => {
        // Handle berbagai kemungkinan nama properti
        const thumbnail = item['Link Thumbnail'] || item.thumbnail || item.imageUrl;
        const title = item.Title || item.title || 'Judul tidak tersedia';
        const description = item.Description || item.description || 'Deskripsi tidak tersedia';
        const downloadLink = item['Download Link'] || item.downloadUrl || item.linkdownload || '#';
        
        // Generate URL
        const thumbnailUrl = getThumbnailUrl(thumbnail);
        const downloadUrl = getDownloadUrl(downloadLink);
        const hasValidDownload = extractGoogleDriveId(downloadLink) !== null;
        
        const card = document.createElement('div');
        card.className = 'flex flex-col rounded-lg shadow-lg overflow-hidden bg-white transform transition hover:-translate-y-1 hover:shadow-xl';
        
        card.innerHTML = `
            <div class="flex-shrink-0">
                <img class="h-48 w-full object-cover" 
                     src="${thumbnailUrl || ''}" 
                     alt="${title}"
                     onerror="this.onerror=null;this.src='https://cdn3d.iconscout.com/3d/premium/thumb/book-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--books-notebook-note-interficon-set-1-light-pack-user-interface-illustrations-3105257.png?f=webp'">
            </div>
            <div class="flex-1 bg-white p-6 flex flex-col justify-between">
                <div class="flex-1">
                    <h3 class="mt-2 text-xl font-semibold text-gray-900">
                        ${title}
                    </h3>
                    <p class="mt-3 text-base text-gray-500">
                        ${description}
                    </p>
                </div>
                <div class="mt-6 flex items-center">
                  <a href="${downloadUrl || '#'}" 
                       class="bg-green-600 px-3 py-3 rounded-lg text-white font-semibold hover:bg-green-700 transition-colors"
                       ${hasValidDownload ? 'download target="_blank"' : 'onclick="return false;" style="opacity:0.5; cursor:not-allowed"'}>
                        ${hasValidDownload ? 'Download' : 'Link Tidak Valid'}
                    </a>
                </div>
            </div>
        `;
        
        materiCardContainer.appendChild(card);
    });
}

    // Fungsi untuk memuat lebih banyak data
    function loadMore() {
        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const dataToDisplay = allData.slice(startIndex, endIndex);
        
        displayData(dataToDisplay);
        currentPage++;
        updateLoadMoreButton();
    }

    // Inisialisasi
    async function init() {
        // Kosongkan container card
        materiCardContainer.innerHTML = '';
        
        // Tampilkan loading state
        materiCardContainer.innerHTML = '<p class="text-center py-10">Memuat data...</p>';
        
        try {
            const responseData = await fetchData();
            
            // Handle berbagai format response
            if (Array.isArray(responseData)) {
                allData = responseData;
            } else if (responseData?.list && Array.isArray(responseData.list)) {
                allData = responseData.list;
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                allData = responseData.data;
            } else {
                allData = [];
            }
            
            if (allData.length === 0) {
                materiCardContainer.innerHTML = '<p class="text-center text-gray-500 py-10">Tidak ada data yang tersedia</p>';
                return;
            }
            
            // Tampilkan data awal
            materiCardContainer.innerHTML = '';
            const initialData = allData.slice(0, itemsPerPage);
            displayData(initialData);
            
            // Update tombol load more
            updateLoadMoreButton();
            
        } catch (error) {
            materiCardContainer.innerHTML = `<p class="text-center text-red-500 py-10">Gagal memuat data: ${error.message}</p>`;
            console.error('Initialization error:', error);
        }
    }

    // Mulai aplikasi
    init();
});