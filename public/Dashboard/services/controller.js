document.addEventListener('DOMContentLoaded', () => {
    const dataTableBody = document.getElementById('dataTableBody');
    const addDataBtn = document.getElementById('addDataBtn');
  
    // Fungsi untuk mengekstrak ID dari link Google Drive
    function extractGoogleDriveId(url) {
        if (!url) return null;
        // Support for both view and direct download links
        const regex = /(?:\/file\/d\/|id=)([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]{28,})/;
        const match = url.match(regex);
        return match ? (match[1] || match[2]) : null;
    }

    // Fungsi untuk generate thumbnail URL
    function getThumbnailUrl(url) {
        const id = extractGoogleDriveId(url);
        return id ? `/asset/${id}` : url;
    }

    // Fungsi untuk generate download URL
    function getDownloadUrl(url) {
        const id = extractGoogleDriveId(url);
        return id ? `https://drive.google.com/uc?export=download&id=${id}` : url;
    }

    const showModal = (title, data = {}) => {
        Swal.fire({
            title: title,
            html: `
            <div class="space-y-4">
  <!-- Title Input -->
  <div>
    <label for="titleInput" class="block text-lg font-semibold text-start text-gray-700 mb-1">Title</label>
    <input 
      id="titleInput" 
      type="text" 
      placeholder="Enter title" 
      value="${data.Title || ''}"
      class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
    >
  </div>

  <!-- Thumbnail Input -->
  <div>
    <label for="thumbnailInput" class="block text-lg font-semibold text-start text-gray-700 mb-1">Google Drive Thumbnail Link</label>
    <input 
      id="thumbnailInput" 
      type="url" 
      placeholder="Thumbnail Link" 
      value="${data['Link Thumbnail'] || ''}"
      class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
    >
  </div>

  <!-- Description Textarea -->
  <div>
    <label for="descriptionInput" class="block text-lg font-semibold text-start text-gray-700 mb-1">Description</label>
    <textarea 
      id="descriptionInput" 
      rows="4" 
      placeholder="Enter description"
      class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
    >${data.Description || ''}</textarea>
  </div>

  <!-- Download Link Input -->
  <div>
    <label for="downloadLinkInput" class="block text-lg font-semibold text-start text-gray-700 mb-1">Google Drive Download Link</label>
    <input 
      id="downloadLinkInput" 
      type="url" 
      placeholder="Link Download" 
      value="${data['Download Link'] || ''}"
      class="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
    >
  </div>
</div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Simpan',
            preConfirm: () => {
                return {
                    Title: document.getElementById('titleInput').value,
                    'Link Thumbnail': document.getElementById('thumbnailInput').value,
                    Description: document.getElementById('descriptionInput').value,
                    'Download Link': document.getElementById('downloadLinkInput').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                if (data.Id) {
                    updateRecord(data.Id, result.value);
                } else {
                    addRecord(result.value);
                }
            }
        });
    };

    const renderTable = (records) => {
        if (!Array.isArray(records)) {
            console.error('Invalid records data', records);
            return;
        }

        dataTableBody.innerHTML = records.map((record, index) => {
            const thumbnailUrl = getThumbnailUrl(record['Link Thumbnail']);
            const downloadUrl = getDownloadUrl(record['Download Link']);
            const hasDownloadLink = !!extractGoogleDriveId(record['Download Link']);

            return `
            <tr class="hover:bg-gray-50 transition-colors duration-150">
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${index + 1}
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900 truncate max-w-xs" title="${record.Title}">
            ${record.Title}
        </div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
            <img src="${thumbnailUrl || 'https://cdn3d.iconscout.com/3d/premium/thumb/book-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--books-notebook-note-interficon-set-1-light-pack-user-interface-illustrations-3105257.png?f=webp'}" 
                 class="h-10 w-10 object-cover rounded-md border border-gray-200"
                 onerror="this.src='https://cdn3d.iconscout.com/3d/premium/thumb/book-3d-illustration-download-in-png-blend-fbx-gltf-file-formats--books-notebook-note-interficon-set-1-light-pack-user-interface-illustrations-3105257.png?f=webp'">
        </div>
    </td>
    <td class="px-6 py-4">
        <div class="text-sm text-gray-500 line-clamp-2 max-w-md" title="${record.Description || ''}">
            ${record.Description || '-'}
        </div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap">
        <a href="${downloadUrl || '#'}" 
           target="_blank" 
           class="text-sm ${hasDownloadLink ? 'text-blue-600 hover:text-blue-800 hover:underline' : 'text-gray-400 cursor-not-allowed'}"
           ${!hasDownloadLink ? 'tabindex="-1" aria-disabled="true"' : ''}>
            ${hasDownloadLink ? 'Download' : 'N/A'}
        </a>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex items-center space-x-2">
            <button onclick="editRecord(${JSON.stringify(record).replace(/"/g, '&quot;')})" 
                    class="text-indigo-600 hover:text-indigo-900">
                Edit
            </button>
            <button onclick='deleteRecord(${record.Id})' 
                    class="text-red-600 hover:text-red-900">
                Hapus
            </button>
        </div>
    </td>
</tr>
            `;
        }).join('');
    };

    // Fungsi untuk mengambil data
    const fetchRecords = async () => {
        try {
            const response = await fetch('/api/records');
            const data = await response.json();
            renderTable(data.list || data);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Gagal mengambil data', 'error');
        }
    };

    // Tambah record baru
    const addRecord = async (recordData) => {
        try {
            const response = await fetch('/api/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData)
            });
            
            if (!response.ok) {
                throw new Error('Gagal menambahkan data');
            }
            
            const data = await response.json();
            Swal.fire('Berhasil', 'Data berhasil ditambahkan', 'success');
            fetchRecords();
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', error.message, 'error');
        }
    };

    window.editRecord = (record) => {
        const completeRecord = {
            Id: record.Id,
            Title: record.Title || '',
            'Link Thumbnail': record['Link Thumbnail'] || '',
            Description: record.Description || '',
            'Download Link': record['Download Link'] || '',
            created_at: record.created_at || ''
        };
        
        showModal('Edit Record', completeRecord);
    };

    // Update record
    const updateRecord = async (id, recordData) => {
        try {
            const response = await fetch(`/api/records/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recordData)
            });
            
            if (!response.ok) {
                throw new Error('Gagal mengupdate data');
            }
            
            const data = await response.json();
            Swal.fire('Berhasil', 'Data berhasil diupdate', 'success');
            fetchRecords();
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', error.message, 'error');
        }
    };

    // Hapus record
    window.deleteRecord = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'Apakah Anda yakin?',
                text: 'Data yang dihapus tidak dapat dikembalikan!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Ya, hapus!'
            });
        
            if (result.isConfirmed) {
                const response = await fetch(`/api/records/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Gagal menghapus data');
                }
                
                Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
                fetchRecords();
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', error.message, 'error');
        }
    };

    // Tambah data baru - event listener
    addDataBtn.addEventListener('click', () => showModal('Tambah Data Baru'));

    // Muat data saat halaman pertama kali dimuat
    fetchRecords();
});