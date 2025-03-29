require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const firebaseAdmin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: true,
    credentials: true
  }));

const NOCODB_API_URL = process.env.NOCODB_API_URL;
const NOCODB_API_KEY = process.env.NOCODB_API_KEY;

if (!NOCODB_API_URL || !NOCODB_API_KEY) {
  console.error('Error: Missing NocoDB configuration in .env file');
  process.exit(1);
}
// Middleware untuk menambahkan header Authorization
const nocodbAxios = axios.create({
    baseURL: NOCODB_API_URL,
    headers: {
      'accept': 'application/json',
      'xc-token': NOCODB_API_KEY,
      'Content-Type': 'application/json'
    }
  });
// Initialize Firebase Admin
const serviceAccount = {
  type: process.env.FIREBASE_ADMIN_TYPE,
  project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
  private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
  auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
  token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL
};
app.get('/firebase-config', (req, res) => {
    res.json({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    });
  });
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: `https://nigokasei-project-default-rtdb.firebaseio.com`
});
// Tambahkan route ini di server.js


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false, // Nonaktifkan ETag
    lastModified: false, // Jangan gunakan last-modified
    setHeaders: (res, path) => {
      // Force no-cache untuk semua file
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
    }
  }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

// Session configuration
const SESSION_OPTIONS = {
    maxAge: 2 * 24 * 60 * 60 * 1000, // Diubah dari 14 hari menjadi 2 hari (dalam milidetik)
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? 'nigokasei-opensc.vercel.app' : undefined
};
// Middleware untuk cache control
app.use((req, res, next) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });
// Enhanced Auth Middleware
const authMiddleware = async (req, res, next) => {
    try {
      // Periksa header Authorization juga untuk API requests
      const sessionCookie = req.cookies.session || 
                          (req.headers.authorization && req.headers.authorization.split('Bearer ')[1]);
      
      if (!sessionCookie) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        return res.redirect('/signin?error=unauthorized');
      }
  
      // Verifikasi session cookie
      const decodedClaims = await firebaseAdmin.auth().verifySessionCookie(sessionCookie, true);
      
      // Dapatkan data user
      const [user, snapshot] = await Promise.all([
        firebaseAdmin.auth().getUser(decodedClaims.uid),
        firebaseAdmin.database().ref(`users/${decodedClaims.uid}`).once('value')
      ]);
  
      const userData = snapshot.val();
      
      // Periksa email verified dan role admin
      if (!user.emailVerified) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(403).json({ error: 'Email not verified' });
        }
        return res.redirect('/signin?error=email-not-verified');
      }
  
      if (!userData || userData.role !== 'admin') {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        return res.redirect('/403');
      }
  
      // Attach user data ke request
      req.user = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || userData.name,
        role: userData.role,
        photoURL: user.photoURL || userData.photoURL
      };
  
      // Perbarui waktu aktivitas terakhir
      await firebaseAdmin.database().ref(`users/${user.uid}/lastActive`).set(Date.now());
  
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      res.clearCookie('session', SESSION_OPTIONS);
      
      const errorMap = {
        'auth/session-cookie-expired': 'session-expired',
        'auth/session-cookie-revoked': 'session-revoked',
        'auth/argument-error': 'invalid-token'
      };
  
      const errorCode = errorMap[error.code] || 'authentication-failed';
      
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ error: errorCode });
      }
      return res.redirect(`/signin?error=${errorCode}`);
    }
  };
 

// Routes
app.get('/',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// SIGNIN
app.get('/signin', (req, res) => {
    res.redirect('/auth/signin');
  });
  app.get('/auth/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/auth', 'signin.html'));
  });
// POLICY
app.get('/policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'policy.html'));
  });

// SIGNUP
app.get('/signup', (req, res) => {
    res.redirect('/auth/signup');
  });
  app.get('/auth/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/auth', 'signup.html'));
  });


app.get('/403', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '403.html'));
});

// Dashboard Routes
app.post('/api/signout', authMiddleware, async (req, res) => {
    try {
      // 1. Revoke all refresh tokens for the user
      await firebaseAdmin.auth().revokeRefreshTokens(req.user.uid);
      
      // 2. Clear the session cookie with enhanced options
      res.clearCookie('session', {
        ...SESSION_OPTIONS,
        // Tambahkan headers tambahan untuk memastikan cookie dihapus
        expires: new Date(0) // Set expiry to Unix epoch
      });
      
      // 3. Set headers untuk memastikan tidak ada cache
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        // Header tambahan untuk berbagai browser
        'Clear-Site-Data': '"cookies", "storage"'
      });
      
      
      // 5. Kirim response dengan redirect URL
      res.json({ 
        success: true,
        redirectUrl: '/signin?logout=success'
      });
      
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ 
        error: 'Logout failed',
        details: error.message 
      });
    }
  });
  
  // Middleware untuk memastikan tidak ada cache setelah logout
  // Middleware untuk rute Dashboard/admin dengan pengaturan cache strict
app.use('/Dashboard/admin', (req, res, next) => {
    // Jika request ke dashboard admin, pastikan cache control strict
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });
  
  // Handle request ke /Dashboard/admin
  app.get('/Dashboard/admin', authMiddleware, (req, res) => {
    // Tambahkan header tambahan untuk memastikan tidak ada cache
    res.set({
      'Last-Modified': (new Date()).toUTCString(),
      'ETag': '' // Kosongkan ETag
    });
    
    res.sendFile(path.join(__dirname, 'public/Dashboard', 'admin.html'), {
      cacheControl: false, // Nonaktifkan cache
      lastModified: false // Nonaktifkan last-modified
    });
  });
  
  // Redirect dari /admin ke /Dashboard/admin untuk backward compatibility
  app.get('/admin', (req, res) => {
    res.redirect(301, '/Dashboard/admin');
  });
//  fix script
//   Contribute route di get rubah
app.use('/Dashboard/contribute', (req, res, next) => {
    // Jika request ke dashboard admin, pastikan cache control strict
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });

  app.get('/contribute', authMiddleware, (req, res) => {
    // Tambahkan header tambahan untuk memastikan tidak ada cache
    res.set({
      'Last-Modified': (new Date()).toUTCString(),
      'ETag': '' // Kosongkan ETag
    });
    
    res.sendFile(path.join(__dirname, 'public/Dashboard', 'contribute-users.html'), {
      cacheControl: false, // Nonaktifkan cache
      lastModified: false // Nonaktifkan last-modified
    });
  });
//   work-panel route di get rubah
app.use('/Dashboard/work-panel', (req, res, next) => {
    // Jika request ke dashboard admin, pastikan cache control strict
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    next();
  });

  app.get('/work-panel', authMiddleware, (req, res) => {
    // Tambahkan header tambahan untuk memastikan tidak ada cache
    res.set({
      'Last-Modified': (new Date()).toUTCString(),
      'ETag': '' // Kosongkan ETag
    });
    
    res.sendFile(path.join(__dirname, 'public/Dashboard', 'work-page.html'), {
      cacheControl: false, // Nonaktifkan cache
      lastModified: false // Nonaktifkan last-modified
    });
  });
// NOCODB
// GET - Ambil semua data
app.get('/api/records', async (req, res) => {
    try {
      const response = await nocodbAxios.get('');
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching records:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
  // DELETE - Hapus data
app.delete('/api/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const response = await axios.delete(
        `${NOCODB_API_URL}`, // Note: No /${id} here
        {
          data: { Id: id }, // ID goes in the request body
          headers: {
            'accept': '*/*',
            'xc-token': NOCODB_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Error deleting record:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: error.message });
    }
  });
  
// PATCH - Update data (fixed to prevent creating new records)
app.patch('/api/records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { Title, 'Link Thumbnail': LinkThumbnail, Description, 'Download Link': DownloadLink } = req.body;
      
      const payload = { 
        Id: parseInt(id),
        updated_at: new Date().toISOString() // Add update timestamp
      };
      
      // Only include fields that are being updated
      if (Title !== undefined) payload.Title = Title;
      if (LinkThumbnail !== undefined) payload['Link Thumbnail'] = LinkThumbnail;
      if (Description !== undefined) payload.Description = Description;
      if (DownloadLink !== undefined) payload['Download Link'] = DownloadLink;
      
      const response = await axios.patch(
        `${NOCODB_API_URL}`,
        payload,
        {
          headers: {
            'accept': 'application/json',
            'xc-token': NOCODB_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json(response.data);
    } catch (error) {
      console.error('Update error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      res.status(500).json({ 
        error: 'Failed to update record',
        details: error.response?.data || error.message 
      });
    }
  });;
  
// POST - Create new record with proper ID handling and timestamp
app.post('/api/records', async (req, res) => {
    try {
        const { Title, 'Link Thumbnail': LinkThumbnail, Description, 'Download Link': DownloadLink } = req.body;
        
        const payload = {
          Title,
          'Link Thumbnail': LinkThumbnail,
          'Description': Description || '',
          'Download Link': DownloadLink || '', // Add download link
          'created_at': new Date().toISOString()
        };
    
      // Create record in NocoDB
      const response = await axios.post(
        `${NOCODB_API_URL}`,
        payload,
        {
          headers: {
            'accept': 'application/json',
            'xc-token': NOCODB_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
  
      // Get the complete record including sequential ID
      const createdRecord = await axios.get(
        `${NOCODB_API_URL}/${response.data.Id}`,
        {
          headers: {
            'accept': 'application/json',
            'xc-token': NOCODB_API_KEY
          }
        }
      );
  
      res.json(createdRecord.data);
  
    } catch (error) {
      console.error('Error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      res.status(500).json({ 
        error: 'Failed to add record',
        details: error.response?.data || error.message 
      });
    }
  });
  app.get("/asset/:id", async (req, res) => {
    const fileId = req.params.id;
    const imageUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  
    try {
        const response = await axios.get(imageUrl, { responseType: "stream" });
        res.setHeader("Content-Type", response.headers["content-type"]);
        response.data.pipe(res);
    } catch (error) {
        res.status(500).send("Gambar tidak dapat di-load.");
    }
  });
  
// API Routes
// Update endpoint signup di server
app.post('/api/signup', authLimiter, async (req, res) => {
    try {
      // Verifikasi token dari Firebase
      const idToken = req.headers.authorization?.split('Bearer ')[1];
      if (!idToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      const { name, email } = req.body;
  
      // Simpan data tambahan ke database
      await firebaseAdmin.database().ref(`users/${decodedToken.uid}`).set({
        name,
        email,
        role: 'admin',
        createdAt: firebaseAdmin.database.ServerValue.TIMESTAMP
      });
  
      res.json({ success: true });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(400).json({ error: error.message });
    }
  });
  
  // Endpoint sessionLogin tetap sama
  app.post('/api/sessionLogin', authLimiter, async (req, res) => {
    try {
      const { idToken } = req.body;
      const expiresIn = 60 * 60 * 24 * 14 * 1000; // 2 minggu
      const sessionCookie = await firebaseAdmin.auth().createSessionCookie(idToken, { expiresIn });
      
      res.cookie('session', sessionCookie, SESSION_OPTIONS);
      res.json({ success: true });
    } catch (error) {
      console.error('Session login error:', error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

// Endpoint untuk cek session
app.get('/api/check-session', authMiddleware, (req, res) => {
    res.json({ success: true, user: req.user });
  });
  app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  });
  
// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});