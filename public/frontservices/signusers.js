// Firebase App (the core Firebase SDK)
let app;
let database;
let auth;

// Initialize SweetAlert defaults
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 1500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

// Function to save user to Realtime Database
async function saveUserToDatabase(user) {
  try {
    const userRef = firebase.database().ref(`mahasiswa-sign/${user.uid}`);
    
    const userData = {
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      lastLogin: firebase.database.ServerValue.TIMESTAMP,
      sessionExpires: new Date().getTime() + (2 * 24 * 60 * 60 * 1000) // 2 days
    };
    
    await userRef.set(userData);
    

    
    return userData;
  } catch (error) {
    console.error('Failed to save user data:', error);
    await Swal.fire({
      icon: 'error',
      title: 'Save Error',
      text: 'Failed to save user session',
      confirmButtonColor: '#3085d6'
    });
    throw error;
  }
}

// Function to check session from database
async function checkDatabaseSession(uid) {
  try {
    const snapshot = await firebase.database().ref(`mahasiswa-sign/${uid}`).once('value');
    const userData = snapshot.val();
    
    if (!userData) return null;
    if (new Date().getTime() > userData.sessionExpires) {
      await firebase.database().ref(`mahasiswa-sign/${uid}`).remove();
      return null;
    }
    return userData;
  } catch (error) {
    console.error('Error checking database session:', error);
    return null;
  }
}
// Function to create and return the signin overlay element
function createSigninOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'signin-overlay';
    overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 hidden';
    
    overlay.innerHTML = `
      <div class="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl overflow-hidden w-full max-w-md mx-4 border border-gray-200 transform transition-all duration-300 scale-95 hover:scale-100">
        <div class="p-8">
          <!-- Header with close button -->
          <div class="flex justify-between items-start mb-6">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <img src="https://scontent.fdps16-1.fna.fbcdn.net/v/t39.30808-1/302052340_987523525419153_673368791557040476_n.jpg?stp=dst-jpg_s200x200_tt6&_nc_cat=100&ccb=1-7&_nc_sid=2d3e12&_nc_eui2=AeHWXTVk5hiDfjgQaLi-MtazkrpqZuuxFdySumpm67EV3IKrdU1Um7LmaKoogQeHIk3dEkO7i41_BQ5srvPlESBM&_nc_ohc=CmZRb1vCjJkQ7kNvgE_OPhH&_nc_oc=Adn6YcOApmBwZO4Fy9OMjfIg6MVAqAV-PtVrw-b65EVUutnglo8TiM-5JR_DJ-1M-6A&_nc_zt=24&_nc_ht=scontent.fdps16-1.fna&_nc_gid=vRkYzNaihFXHqRKVr9nEZA&oh=00_AYGDuxFoClYX-kw2T_YjKjh36dnKo3pdqEf5XQ1pI5RWNw&oe=67ED8871" 
                     alt="Undiksha Logo" 
                     class="w-10 h-10 object-contain">
                <h2 class="text-2xl font-bold text-gray-800">Nigokasei Repository</h2>
              </div>
            </div>
            <button id="close-signin" class="text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
    
          <!-- Main content -->
          <div class="space-y-6">
            <!-- Google sign-in button -->
            <div>
              <button id="google-signin-btn" class="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md">
               <img height="30" width="30" src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Logo_undiksha.png/960px-Logo_undiksha.png" alt="">
                <span class="font-medium text-gray-700">Continue with Undiksha Account</span>
              </button>
            </div>
    
            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white text-gray-500">Academic access only</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return overlay;
  }
// Main handler when DOM is loaded

// Modified DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    try {
      // 1. Initialize Firebase
      const firebaseConfig = {
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
      
      console.log('Firebase initialized successfully');
      
      // Create elements but don't append yet
      const signinOverlay = createSigninOverlay();
      const userHandlerBtn = document.getElementById('user-handler');
      
      // 2. Check active session
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          // Validate email domain
          if (!user.email.endsWith('@student.undiksha.ac.id')) {
            await auth.signOut();
            await Swal.fire({
              icon: 'error',
              title: 'Access Denied',
              text: 'Only @student.undiksha.ac.id emails are allowed',
              confirmButtonColor: '#d33'
            });
            return;
          }
          
          // Check database session
          const dbSession = await checkDatabaseSession(user.uid);
          if (dbSession) {
            // Valid session - show user handler
            userHandlerBtn.classList.remove('hidden');
            userHandlerBtn.classList.add('block');
          } else {
            // Session expired - show overlay
            await auth.signOut();
            document.body.appendChild(signinOverlay);
            signinOverlay.classList.remove('hidden');
            userHandlerBtn.classList.add('hidden');
          }
        } else {
          // No user logged in - show overlay
          document.body.appendChild(signinOverlay);
          signinOverlay.classList.remove('hidden');
          userHandlerBtn.classList.add('hidden');
        }
        
        // Now that we know the state, set up event listeners
        const closeSignin = document.getElementById('close-signin');
        const googleSignInBtn = document.getElementById('google-signin-btn');
        
        // 3. Close button handler
        closeSignin.addEventListener('click', () => {
          signinOverlay.classList.add('hidden');
        });
  
        // 4. Google Sign-In handler
        googleSignInBtn.addEventListener('click', async (e) => {
            e.preventDefault();
      
            // Set loading state
            const originalBtnContent = googleSignInBtn.innerHTML;
            googleSignInBtn.disabled = true;
            googleSignInBtn.innerHTML = `
              <span class="flex items-center justify-center">
                <svg class="animate-spin h-4 w-4 mr-2 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            `;
            
            try {
              // Configure Google provider
              const provider = new firebase.auth.GoogleAuthProvider();
              provider.addScope('email');
              provider.addScope('profile');
              provider.setCustomParameters({ prompt: 'select_account' });
              
              // Trigger login popup
              const result = await auth.signInWithPopup(provider);
              const user = result.user;
              
              if (!user) throw new Error('No user data received');
              
              // Validate email domain
              if (!user.email.endsWith('@student.undiksha.ac.id')) {
                await auth.signOut();
                throw new Error('Only @student.undiksha.ac.id emails are allowed');
              }
              
              // Save to database
              await saveUserToDatabase(user);
              
              // Update UI
              signinOverlay.classList.add('hidden');
              userHandlerBtn.classList.remove('hidden');
              userHandlerBtn.classList.add('block');
              
              // Show success message
              await Swal.fire({
                icon: 'success',
                title: 'Welcome',
                text: `${user.displayName || user.email}`,
                confirmButtonColor: '#3085d6'
              });
              
            } catch (error) {
              console.error('Login error:', error);
              
              let errorMessage = error.message;
              if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Login popup was closed before completion';
              } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Popup blocked. Please allow popups for this site';
              }
              
              await Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: errorMessage,
                confirmButtonColor: '#d33'
              });
            } finally {
              // Reset button state
              googleSignInBtn.disabled = false;
              googleSignInBtn.innerHTML = originalBtnContent;
            }
        });
      });
  
      // 5. Logout handler
      userHandlerBtn.addEventListener('click', async () => {
        const { isConfirmed } = await Swal.fire({
            icon: 'question',
            title: 'Confirm Logout',
            text: 'Are you sure you want to logout?',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout'
          });
          
          if (!isConfirmed) return;
          
          try {
            if (auth.currentUser) {
              await firebase.database().ref(`mahasiswa-sign/${auth.currentUser.uid}`).remove();
            }
            
            await auth.signOut();
            userHandlerBtn.classList.add('hidden');
            signinOverlay.classList.remove('hidden');
            
            await Toast.fire({
              icon: 'success',
              title: 'Logged out successfully'
            });
          } catch (error) {
            console.error('Logout error:', error);
            await Swal.fire({
              icon: 'error',
              title: 'Logout Failed',
              text: 'An error occurred during logout',
              confirmButtonColor: '#d33'
            });
          }    
      });
  
    } catch (error) {
      console.error('Initialization error:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Initialization Error',
        text: 'Failed to initialize application. Please refresh the page.',
        confirmButtonColor: '#d33'
      });
    }
  });