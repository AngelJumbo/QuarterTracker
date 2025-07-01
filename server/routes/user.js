import express from 'express';
import { getDb } from '../db/database.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

// Update profile visibility
router.put('/profile-visibility', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const { isPublic } = req.body;
    
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET profile_public = ? WHERE id = ?',
        [isPublic ? 1 : 0, req.user.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    res.json({ success: true, message: 'Profile visibility updated' });
  } catch (error) {
    console.error('Error updating profile visibility:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get public profile by user ID
router.get('/profile/:userId', async (req, res) => {
  try {
    const db = getDb();
    const userId = req.params.userId;
    
    // Get user info
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, avatar_url, profile_public FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.profile_public) {
      return res.status(403).json({ success: false, message: 'Profile is private' });
    }
    
    // Get user's collection with series information
    const collection = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          q.*,
          s.name as series_name,
          s.description as series_description,
          uc.condition,
          uc.notes,
          uc.mint_mark,
          uc.acquired_date
        FROM quarters_data q
        JOIN series s ON q.series_id = s.id
        JOIN user_collections uc ON q.id = uc.quarter_id
        WHERE uc.user_id = ?
        ORDER BY q.year, s.name, q.design
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get collection stats dynamically based on series table
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT q.id) as total_quarters_available,
          COUNT(DISTINCT uc.quarter_id) as owned_quarters,
          COUNT(DISTINCT s.id) as total_series_available,
          COUNT(DISTINCT CASE WHEN uc.quarter_id IS NOT NULL THEN s.id END) as series_with_coins
        FROM quarters_data q
        JOIN series s ON q.series_id = s.id
        LEFT JOIN user_collections uc ON q.id = uc.quarter_id AND uc.user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Get detailed stats per series
    const seriesStats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          s.id,
          s.name,
          s.total_coins,
          COUNT(DISTINCT q.id) as available_quarters,
          COUNT(DISTINCT uc.quarter_id) as owned_quarters,
          ROUND((COUNT(DISTINCT uc.quarter_id) * 100.0 / COUNT(DISTINCT q.id)), 2) as completion_percentage
        FROM series s
        LEFT JOIN quarters_data q ON s.id = q.series_id
        LEFT JOIN user_collections uc ON q.id = uc.quarter_id AND uc.user_id = ?
        GROUP BY s.id, s.name, s.total_coins
        ORDER BY s.name
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({
      success: true,
      profile: {
        user: {
          id: user.id,
          name: user.name,
          avatar_url: user.avatar_url
        },
        collection,
        stats: {
          ...stats,
          series_breakdown: seriesStats
        }
      }
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
})

export default router;