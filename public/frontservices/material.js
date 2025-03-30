document.addEventListener('DOMContentLoaded', () => {
    const materiCardContainer = document.getElementById('materi-card');
    let currentPage = 1;
    const itemsPerPage = 6;
    let allData = [];
    let loadMoreButton = null;

    function showAlert(icon, title, text) {
        Swal.fire({
            icon: icon,
            title: title,
            text: text,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true
        });
    }
    
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

    // Fungsi untuk generate download URL yang kompatibel dengan mobile dan desktop
    function getDownloadUrl(url) {
        const id = extractGoogleDriveId(url);
        if (!id) return url;
        
        // Format URL download langsung dengan parameter tambahan untuk mobile
        return `https://drive.google.com/uc?export=download&id=${id}&confirm=t&uuid=${Math.random().toString(36).substring(2)}`;
    }

    // Fungsi untuk handle download (kompatibel mobile dan desktop)
    function handleDownload(event, downloadUrl, title) {
        event.preventDefault();
        const button = event.currentTarget;
        const originalText = button.innerHTML;
        
        // Add loading animation to button
        button.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading...</span>
        </div>
    `;
    
        button.disabled = true;
        // Deteksi perangkat mobile
        const isMobile = /Android|Chrome|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Untuk mobile, gunakan iframe sebagai fallback
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = downloadUrl;
            document.body.appendChild(iframe);
            setTimeout(() => {
                showAlert('success', 'Downloaded', 'Silahkan periksa fitur download anda');
                document.body.removeChild(iframe);
                button.innerHTML = originalText;
                button.disabled = false;
            }, 5000);
        } else {
            // Untuk desktop, gunakan window.open
            showAlert('success', 'Downloaded', 'Silahkan periksa fitur download anda');
            window.open(downloadUrl, '_blank');
        }
        
        // Tambahkan tracking download (opsional)
        console.log(`File downloaded: ${title}`);
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
                        <button class="bg-green-600 px-3 py-3 rounded-lg text-white font-semibold hover:bg-green-700 transition-colors download-btn"
                            ${hasValidDownload ? '' : 'disabled style="opacity:0.5; cursor:not-allowed"'}>
                            ${hasValidDownload ? 'Download' : 'Link Tidak Valid'}
                        </button>
                    </div>
                </div>
            `;
            
            // Tambahkan event listener untuk tombol download
            if (hasValidDownload) {
                const downloadBtn = card.querySelector('.download-btn');
                downloadBtn.addEventListener('click', (e) => {
                    handleDownload(e, downloadUrl, title);
                });
            }
            
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