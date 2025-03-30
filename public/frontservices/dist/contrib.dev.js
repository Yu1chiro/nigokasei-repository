"use strict";

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";

import { getDatabase, push, ref, set } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// Inisialisasi Firebase
var app;
var database;
var auth;

function initializeFirebase() {
  var response, firebaseConfig;
  return regeneratorRuntime.async(function initializeFirebase$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(fetch('/firebase-config'));

        case 3:
          response = _context.sent;

          if (response.ok) {
            _context.next = 6;
            break;
          }

          throw new Error('Gagal memuat konfigurasi');

        case 6:
          _context.next = 8;
          return regeneratorRuntime.awrap(response.json());

        case 8:
          firebaseConfig = _context.sent;
          app = (0, initializeApp)(firebaseConfig);
          database = (0, getDatabase)(app);
          auth = (0, getAuth)(app);
          return _context.abrupt("return", app);

        case 15:
          _context.prev = 15;
          _context.t0 = _context["catch"](0);
          console.error('Error initializing Firebase:', _context.t0);
          throw _context.t0;

        case 19:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 15]]);
} // Fungsi untuk menangani pengiriman form


function handleFormSubmit(event) {
  var submitButton, originalButtonText, name, email, titleMateri, jenisMateri, deskripsiMateri, linkMateri, contributeData, newContributeRef;
  return regeneratorRuntime.async(function handleFormSubmit$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          event.preventDefault();
          submitButton = document.getElementById('submit-button'); // Pastikan button submit memiliki id ini

          originalButtonText = submitButton.innerHTML; // Set button ke state loading

          submitButton.innerHTML = "\n    <span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span>\n    Mengirim...\n  ";
          submitButton.disabled = true; // Ambil nilai dari form

          name = document.getElementById('name').value;
          email = document.getElementById('email').value;
          titleMateri = document.getElementById('title-materi').value;
          jenisMateri = document.getElementById('jenis-materi').value;
          deskripsiMateri = document.getElementById('deskripsi-materi').value;
          linkMateri = document.getElementById('link-materi').value; // Validasi form

          if (!(!name || !email || !titleMateri || !jenisMateri || !deskripsiMateri || !linkMateri)) {
            _context2.next = 16;
            break;
          }

          Swal.fire('Error', 'Semua field harus diisi!', 'error');
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;
          return _context2.abrupt("return");

        case 16:
          if (email.endsWith('@student.undiksha.ac.id')) {
            _context2.next = 21;
            break;
          }

          Swal.fire('Error', 'Harap gunakan email Undiksha (@undiksha.ac.id)', 'error');
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;
          return _context2.abrupt("return");

        case 21:
          _context2.prev = 21;
          // Buat objek data
          contributeData = {
            name: name,
            email: email,
            titleMateri: titleMateri,
            jenisMateri: jenisMateri,
            deskripsiMateri: deskripsiMateri,
            linkMateri: linkMateri,
            timestamp: new Date().toISOString(),
            status: 'pending' // Status default

          }; // Kirim data ke Firebase Realtime Database

          newContributeRef = (0, push)((0, ref)(database, 'contribute-users'));
          _context2.next = 26;
          return regeneratorRuntime.awrap((0, set)(newContributeRef, contributeData));

        case 26:
          _context2.next = 28;
          return regeneratorRuntime.awrap(fetch('/api/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(contributeData)
          }));

        case 28:
          // Tampilkan pesan sukses
          Swal.fire('Success', 'Materi berhasil dikirim!', 'success'); // Reset form

          document.getElementById('contribute-form').reset();
          _context2.next = 36;
          break;

        case 32:
          _context2.prev = 32;
          _context2.t0 = _context2["catch"](21);
          console.error('Error submitting data:', _context2.t0);
          Swal.fire('Error', 'Gagal mengirim materi: ' + _context2.t0.message, 'error');

        case 36:
          _context2.prev = 36;
          submitButton.innerHTML = originalButtonText;
          submitButton.disabled = false;
          return _context2.finish(36);

        case 40:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[21, 32, 36, 40]]);
} // Inisialisasi ketika DOM siap


document.addEventListener('DOMContentLoaded', function _callee() {
  var form;
  return regeneratorRuntime.async(function _callee$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(initializeFirebase());

        case 3:
          // Tambahkan event listener untuk form
          form = document.getElementById('contribute-form');

          if (form) {
            form.addEventListener('submit', handleFormSubmit);
          }

          _context3.next = 11;
          break;

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          console.error('Initialization error:', _context3.t0);
          Swal.fire('Error', 'Gagal memuat sistem. Silakan refresh halaman.', 'error');

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
});