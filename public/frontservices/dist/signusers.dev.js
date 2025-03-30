"use strict";

// Firebase App (the core Firebase SDK)
var app;
var database;
var auth; // Initialize SweetAlert defaults

var Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: function didOpen(toast) {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
}); // Function to save user to Realtime Database

function saveUserToDatabase(user) {
  var userRef, userData;
  return regeneratorRuntime.async(function saveUserToDatabase$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          userRef = firebase.database().ref("mahasiswa-sign/".concat(user.uid));
          userData = {
            email: user.email,
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            lastLogin: firebase.database.ServerValue.TIMESTAMP,
            sessionExpires: new Date().getTime() + 2 * 24 * 60 * 60 * 1000 // 2 days

          };
          _context.next = 5;
          return regeneratorRuntime.awrap(userRef.set(userData));

        case 5:
          return _context.abrupt("return", userData);

        case 8:
          _context.prev = 8;
          _context.t0 = _context["catch"](0);
          console.error('Failed to save user data:', _context.t0);
          _context.next = 13;
          return regeneratorRuntime.awrap(Swal.fire({
            icon: 'error',
            title: 'Save Error',
            text: 'Failed to save user session',
            confirmButtonColor: '#3085d6'
          }));

        case 13:
          throw _context.t0;

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 8]]);
} // Function to check session from database


function checkDatabaseSession(uid) {
  var snapshot, userData;
  return regeneratorRuntime.async(function checkDatabaseSession$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(firebase.database().ref("mahasiswa-sign/".concat(uid)).once('value'));

        case 3:
          snapshot = _context2.sent;
          userData = snapshot.val();

          if (userData) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt("return", null);

        case 7:
          if (!(new Date().getTime() > userData.sessionExpires)) {
            _context2.next = 11;
            break;
          }

          _context2.next = 10;
          return regeneratorRuntime.awrap(firebase.database().ref("mahasiswa-sign/".concat(uid)).remove());

        case 10:
          return _context2.abrupt("return", null);

        case 11:
          return _context2.abrupt("return", userData);

        case 14:
          _context2.prev = 14;
          _context2.t0 = _context2["catch"](0);
          console.error('Error checking database session:', _context2.t0);
          return _context2.abrupt("return", null);

        case 18:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 14]]);
} // Function to create and return the signin overlay element


function createSigninOverlay() {
  var overlay = document.createElement('div');
  overlay.id = 'signin-overlay';
  overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 hidden';
  overlay.innerHTML = "\n      <div class=\"bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl overflow-hidden w-full max-w-md mx-4 border border-gray-200 transform transition-all duration-300 scale-95 hover:scale-100\">\n        <div class=\"p-8\">\n          <!-- Header with close button -->\n          <div class=\"flex justify-between items-start mb-6\">\n            <div>\n              <div class=\"flex items-center gap-3 mb-2\">\n                <img src=\"https://scontent.fdps16-1.fna.fbcdn.net/v/t39.30808-1/302052340_987523525419153_673368791557040476_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=100&ccb=1-7&_nc_sid=2d3e12&_nc_eui2=AeHWXTVk5hiDfjgQaLi-MtazkrpqZuuxFdySumpm67EV3IKrdU1Um7LmaKoogQeHIk3dEkO7i41_BQ5srvPlESBM&_nc_ohc=CmZRb1vCjJkQ7kNvgE_OPhH&_nc_oc=Adn6YcOApmBwZO4Fy9OMjfIg6MVAqAV-PtVrw-b65EVUutnglo8TiM-5JR_DJ-1M-6A&_nc_zt=24&_nc_ht=scontent.fdps16-1.fna&_nc_gid=vRkYzNaihFXHqRKVr9nEZA&oh=00_AYGDuxFoClYX-kw2T_YjKjh36dnKo3pdqEf5XQ1pI5RWNw&oe=67ED8871\" \n                     alt=\"Undiksha Logo\" \n                     class=\"w-10 h-10 object-contain\">\n                <h2 class=\"text-2xl font-bold text-gray-800\">Nigokasei Repository</h2>\n              </div>\n            </div>\n            <button id=\"close-signin\" class=\"text-gray-400 hover:text-gray-600 transition-colors\">\n              <svg xmlns=\"http://www.w3.org/2000/svg\" class=\"h-6 w-6\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\">\n                <path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\" />\n              </svg>\n            </button>\n          </div>\n    \n          <!-- Main content -->\n          <div class=\"space-y-6\">\n            <!-- Google sign-in button -->\n            <div>\n              <button id=\"google-signin-btn\" class=\"w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md\">\n               <img height=\"30\" width=\"30\" src=\"https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Logo_undiksha.png/960px-Logo_undiksha.png\" alt=\"\">\n                <span class=\"font-medium text-gray-700\">Continue with Undiksha Account</span>\n              </button>\n            </div>\n    \n            <!-- Divider -->\n            <div class=\"relative\">\n              <div class=\"absolute inset-0 flex items-center\">\n                <div class=\"w-full border-t border-gray-300\"></div>\n              </div>\n              <div class=\"relative flex justify-center text-sm\">\n                <span class=\"px-2 bg-white text-gray-500\">Academic access only</span>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    ";
  return overlay;
} // Main handler when DOM is loaded
// Modified DOMContentLoaded event listener


document.addEventListener('DOMContentLoaded', function _callee4() {
  var firebaseConfig, signinOverlay, userHandlerBtn;
  return regeneratorRuntime.async(function _callee4$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          // 1. Initialize Firebase
          firebaseConfig = {
            apiKey: "AIzaSyDy7y2i-eDpmRyLF7wlBGgKQAuNt7OUKVA",
            authDomain: "nigokasei-project.firebaseapp.com",
            databaseURL: "https://nigokasei-project-default-rtdb.firebaseio.com",
            projectId: "nigokasei-project",
            storageBucket: "nigokasei-project.firebasestorage.app",
            messagingSenderId: "989157909879",
            appId: "1:989157909879:web:8d4e9d45b167fd5c0d2d72",
            measurementId: "G-4FP13XY4ZV"
          };
          app = firebase.initializeApp(firebaseConfig);
          database = firebase.database();
          auth = firebase.auth();
          console.log('Firebase initialized successfully'); // Create elements but don't append yet

          signinOverlay = createSigninOverlay();
          userHandlerBtn = document.getElementById('user-handler'); // 2. Check active session

          auth.onAuthStateChanged(function _callee2(user) {
            var dbSession, closeSignin, googleSignInBtn;
            return regeneratorRuntime.async(function _callee2$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    if (!user) {
                      _context4.next = 22;
                      break;
                    }

                    if (user.email.endsWith('@student.undiksha.ac.id')) {
                      _context4.next = 7;
                      break;
                    }

                    _context4.next = 4;
                    return regeneratorRuntime.awrap(auth.signOut());

                  case 4:
                    _context4.next = 6;
                    return regeneratorRuntime.awrap(Swal.fire({
                      icon: 'info',
                      title: 'Access Denied',
                      text: 'Gunakan email student undiksha untuk mengakses',
                      confirmButtonColor: '#d33'
                    }));

                  case 6:
                    return _context4.abrupt("return");

                  case 7:
                    _context4.next = 9;
                    return regeneratorRuntime.awrap(checkDatabaseSession(user.uid));

                  case 9:
                    dbSession = _context4.sent;

                    if (!dbSession) {
                      _context4.next = 15;
                      break;
                    }

                    // Valid session - show user handler
                    userHandlerBtn.classList.remove('hidden');
                    userHandlerBtn.classList.add('block');
                    _context4.next = 20;
                    break;

                  case 15:
                    _context4.next = 17;
                    return regeneratorRuntime.awrap(auth.signOut());

                  case 17:
                    document.body.appendChild(signinOverlay);
                    signinOverlay.classList.remove('hidden');
                    userHandlerBtn.classList.add('hidden');

                  case 20:
                    _context4.next = 25;
                    break;

                  case 22:
                    // No user logged in - show overlay
                    document.body.appendChild(signinOverlay);
                    signinOverlay.classList.remove('hidden');
                    userHandlerBtn.classList.add('hidden');

                  case 25:
                    // Now that we know the state, set up event listeners
                    closeSignin = document.getElementById('close-signin');
                    googleSignInBtn = document.getElementById('google-signin-btn'); // 3. Close button handler

                    closeSignin.addEventListener('click', function () {
                      signinOverlay.classList.add('hidden');
                    }); // 4. Google Sign-In handler

                    googleSignInBtn.addEventListener('click', function _callee(e) {
                      var originalBtnContent, provider, result, _user, errorMessage;

                      return regeneratorRuntime.async(function _callee$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              e.preventDefault(); // Set loading state

                              originalBtnContent = googleSignInBtn.innerHTML;
                              googleSignInBtn.disabled = true;
                              googleSignInBtn.innerHTML = "\n              <span class=\"flex items-center justify-center\">\n                <svg class=\"animate-spin h-4 w-4 mr-2 text-gray-700\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">\n                  <circle class=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"4\"></circle>\n                  <path class=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>\n                </svg>\n                Processing...\n              </span>\n            ";
                              _context3.prev = 4;
                              // Configure Google provider
                              provider = new firebase.auth.GoogleAuthProvider();
                              provider.addScope('email');
                              provider.addScope('profile');
                              provider.setCustomParameters({
                                prompt: 'select_account'
                              }); // Trigger login popup

                              _context3.next = 11;
                              return regeneratorRuntime.awrap(auth.signInWithPopup(provider));

                            case 11:
                              result = _context3.sent;
                              _user = result.user;

                              if (_user) {
                                _context3.next = 15;
                                break;
                              }

                              throw new Error('No user data received');

                            case 15:
                              if (_user.email.endsWith('@student.undiksha.ac.id')) {
                                _context3.next = 19;
                                break;
                              }

                              _context3.next = 18;
                              return regeneratorRuntime.awrap(auth.signOut());

                            case 18:
                              throw new Error('Hanya email student undiksha yg di izinkan untuk mengakses halaman');

                            case 19:
                              _context3.next = 21;
                              return regeneratorRuntime.awrap(saveUserToDatabase(_user));

                            case 21:
                              // Update UI
                              signinOverlay.classList.add('hidden');
                              userHandlerBtn.classList.remove('hidden');
                              userHandlerBtn.classList.add('block'); // Show success message

                              _context3.next = 26;
                              return regeneratorRuntime.awrap(Swal.fire({
                                icon: 'success',
                                title: 'Welcome',
                                text: "".concat(_user.displayName || _user.email),
                                confirmButtonColor: '#3085d6'
                              }));

                            case 26:
                              _context3.next = 35;
                              break;

                            case 28:
                              _context3.prev = 28;
                              _context3.t0 = _context3["catch"](4);
                              console.error('Login error:', _context3.t0);
                              errorMessage = _context3.t0.message;

                              if (_context3.t0.code === 'auth/popup-closed-by-user') {
                                errorMessage = 'Login popup was closed before completion';
                              } else if (_context3.t0.code === 'auth/popup-blocked') {
                                errorMessage = 'Popup blocked. Please allow popups for this site';
                              }

                              _context3.next = 35;
                              return regeneratorRuntime.awrap(Swal.fire({
                                icon: 'error',
                                title: 'Access Denied',
                                text: 'Gunakan email student undiksha untuk login',
                                confirmButtonColor: '#d33'
                              }));

                            case 35:
                              _context3.prev = 35;
                              // Reset button state
                              googleSignInBtn.disabled = false;
                              googleSignInBtn.innerHTML = originalBtnContent;
                              return _context3.finish(35);

                            case 39:
                            case "end":
                              return _context3.stop();
                          }
                        }
                      }, null, null, [[4, 28, 35, 39]]);
                    });

                  case 29:
                  case "end":
                    return _context4.stop();
                }
              }
            });
          }); // 5. Logout handler

          userHandlerBtn.addEventListener('click', function _callee3() {
            var _ref, isConfirmed;

            return regeneratorRuntime.async(function _callee3$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    _context5.next = 2;
                    return regeneratorRuntime.awrap(Swal.fire({
                      icon: 'question',
                      title: 'Confirm Logout',
                      text: 'Are you sure you want to logout?',
                      showCancelButton: true,
                      confirmButtonColor: '#3085d6',
                      cancelButtonColor: '#d33',
                      confirmButtonText: 'Yes, logout'
                    }));

                  case 2:
                    _ref = _context5.sent;
                    isConfirmed = _ref.isConfirmed;

                    if (isConfirmed) {
                      _context5.next = 6;
                      break;
                    }

                    return _context5.abrupt("return");

                  case 6:
                    _context5.prev = 6;

                    if (!auth.currentUser) {
                      _context5.next = 10;
                      break;
                    }

                    _context5.next = 10;
                    return regeneratorRuntime.awrap(firebase.database().ref("mahasiswa-sign/".concat(auth.currentUser.uid)).remove());

                  case 10:
                    _context5.next = 12;
                    return regeneratorRuntime.awrap(auth.signOut());

                  case 12:
                    userHandlerBtn.classList.add('hidden');
                    signinOverlay.classList.remove('hidden');
                    _context5.next = 16;
                    return regeneratorRuntime.awrap(Toast.fire({
                      icon: 'success',
                      title: 'Logged out successfully'
                    }));

                  case 16:
                    _context5.next = 23;
                    break;

                  case 18:
                    _context5.prev = 18;
                    _context5.t0 = _context5["catch"](6);
                    console.error('Logout error:', _context5.t0);
                    _context5.next = 23;
                    return regeneratorRuntime.awrap(Swal.fire({
                      icon: 'error',
                      title: 'Logout Failed',
                      text: 'An error occurred during logout',
                      confirmButtonColor: '#d33'
                    }));

                  case 23:
                  case "end":
                    return _context5.stop();
                }
              }
            }, null, null, [[6, 18]]);
          });
          _context6.next = 17;
          break;

        case 12:
          _context6.prev = 12;
          _context6.t0 = _context6["catch"](0);
          console.error('Initialization error:', _context6.t0);
          _context6.next = 17;
          return regeneratorRuntime.awrap(Swal.fire({
            icon: 'error',
            title: 'Initialization Error',
            text: 'Failed to initialize application. Please refresh the page.',
            confirmButtonColor: '#d33'
          }));

        case 17:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 12]]);
});