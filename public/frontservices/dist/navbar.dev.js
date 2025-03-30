"use strict";

document.addEventListener('DOMContentLoaded', function () {
  var sidebarToggle = document.getElementById('sidebar-toggle');
  var sidebarClose = document.getElementById('sidebar-close');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  var userHandler = document.getElementById('user-handler'); // Toggle sidebar

  sidebarToggle.addEventListener('click', function () {
    sidebar.classList.remove('translate-x-full');
    sidebar.classList.add('translate-x-0');
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Mencegah scroll saat sidebar terbuka
  }); // Close sidebar

  function closeSidebar() {
    sidebar.classList.remove('translate-x-0');
    sidebar.classList.add('translate-x-full');
    overlay.classList.add('hidden');
    document.body.style.overflow = ''; // Mengembalikan scroll
  }

  sidebarClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar); // Tutup sidebar saat mengklik link (opsional)

  var sidebarLinks = sidebar.querySelectorAll('a');
  sidebarLinks.forEach(function (link) {
    link.addEventListener('click', closeSidebar);
  }); // Sync user handler antara desktop dan mobile

  function updateUserHandler() {
    // Ganti dengan logika autentikasi Anda
    var isLoggedIn = false;

    if (isLoggedIn) {
      userHandler.classList.remove('hidden');
      document.querySelector('a[href="/signin"]').classList.add('hidden');
      sidebar.querySelector('a[href="/signin"]').classList.add('hidden');
    } else {
      userHandler.classList.add('hidden');
      document.querySelector('a[href="/signin"]').classList.remove('hidden');
      sidebar.querySelector('a[href="/signin"]').classList.remove('hidden');
    }
  } // Contoh fungsi logout


  if (userHandler) {
    userHandler.addEventListener('click', function () {
      console.log('Logged out from desktop');
      updateUserHandler();
    });
  } // Inisialisasi status user handler


  updateUserHandler();
});