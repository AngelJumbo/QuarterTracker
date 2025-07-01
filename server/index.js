import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import coinsRoutes from './routes/coins.js';
import userRoutes from './routes/user.js';
import { createRequire } from 'module';
import { initDatabase, getDb } from './db/database.js';
//import SQLiteStore from 'connect-sqlite3';
const require = createRequire(import.meta.url);
const SQLiteStore = require('connect-sqlite3')(session);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 3001;
const SESSIONS_DB_PATH = process.env.SESSIONS_DB_PATH;
const isProduction = process.env.NODE_ENV === 'production';
console.log("passport options",process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET,process.env.GOOGLE_CALLBACK_URL)

// Initialize database
await initDatabase();

// Middleware
app.use(express.json());
app.use(cors({
  origin: isProduction ? false : 'http://localhost:5173',
  credentials: true
}));
/*
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));*/

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite', // puedes cambiar el nombre si quieres
    dir: SESSIONS_DB_PATH??path.join(__dirname, '.') // o usa ~/data, como prefieras
  }),
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Passport configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const db = getDb();
    
    // Check if user exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (existingUser) {
      return done(null, existingUser);
    }
    
    // Create new user
    const newUser = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)',
        [profile.id, profile.emails[0].value, profile.displayName, profile.photos[0].value],
        function(err) {
          if (err) reject(err);
          else {
            db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          }
        }
      );
    });
    
    return done(null, newUser);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = getDb();
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/coins', coinsRoutes);
app.use('/api/user', userRoutes);

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mode: ${isProduction ? 'production' : 'development'}`);
});
