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


router.get('/quarters', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const { search, year, series, owned, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let baseQuery = `
      FROM quarters_data q
      LEFT JOIN series s ON q.series_id = s.id
      LEFT JOIN user_collections uc ON q.id = uc.quarter_id AND uc.user_id = ?
      WHERE 1=1
    `;
    
    const params = [req.user.id];
    
    if (search) {
      baseQuery += ' AND (q.design LIKE ? OR s.name LIKE ? OR q.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (year) {
      baseQuery += ' AND q.year = ?';
      params.push(year);
    }
    
    if (series) {
      baseQuery += ' AND s.name LIKE ?';
      params.push(`%${series}%`);
    }
    
    if (owned !== undefined) {
      if (owned === 'true') baseQuery += ' AND uc.id IS NOT NULL';
      else if (owned === 'false') baseQuery += ' AND uc.id IS NULL';
    }
    
    // Total count
    const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
    const total = await new Promise((resolve, reject) => {
      db.get(countQuery, params, (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });
    
    // Paged results with series information
    const quartersQuery = `
      SELECT 
        q.*,
        s.name as series,
        CASE WHEN uc.id IS NOT NULL THEN 1 ELSE 0 END as owned,
        uc.condition,
        uc.notes,
        uc.acquired_date,
        uc.mint_mark as mint_mark
      ${baseQuery}
      ORDER BY q.year, s.name, q.design
      LIMIT ? OFFSET ?
    `;
    
    const quarters = await new Promise((resolve, reject) => {
      db.all(quartersQuery, [...params, parseInt(limit), offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({ success: true, quarters, total });
  } catch (error) {
    console.error('Error fetching quarters:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Add coin to collection
router.post('/quarters/:id/collect', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const quarterId = req.params.id;
    const { condition = 'Good', notes = '' } = req.body;
    
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR REPLACE INTO user_collections (user_id, quarter_id, condition, notes) VALUES (?, ?, ?, ?)',
        [req.user.id, quarterId, condition, notes],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    res.json({ success: true, message: 'Coin added to collection' });
  } catch (error) {
    console.error('Error adding coin to collection:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove coin from collection
router.delete('/quarters/:id/collect', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const quarterId = req.params.id;
    
    await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM user_collections WHERE user_id = ? AND quarter_id = ?',
        [req.user.id, quarterId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    res.json({ success: true, message: 'Coin removed from collection' });
  } catch (error) {
    console.error('Error removing coin from collection:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get collection statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    
    // Get overall stats
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT q.id) as total_quarters_available,
          COUNT(DISTINCT uc.quarter_id) as owned_quarters,
          COUNT(DISTINCT s.id) as total_series_available,
          COUNT(DISTINCT CASE WHEN uc.quarter_id IS NOT NULL THEN s.id END) as series_with_coins,
          ROUND((COUNT(DISTINCT uc.quarter_id) * 100.0 / COUNT(DISTINCT q.id)), 2) as overall_completion_percentage
        FROM quarters_data q
        JOIN series s ON q.series_id = s.id
        LEFT JOIN user_collections uc ON q.id = uc.quarter_id AND uc.user_id = ?
      `, [req.user.id], (err, row) => {
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
          s.description,
          s.start_year,
          s.end_year,
          s.total_coins,
          COUNT(DISTINCT q.id) as available_quarters,
          COUNT(DISTINCT uc.quarter_id) as owned_quarters,
          ROUND((COUNT(DISTINCT uc.quarter_id) * 100.0 / COUNT(DISTINCT q.id)), 2) as completion_percentage
        FROM series s
        LEFT JOIN quarters_data q ON s.id = q.series_id
        LEFT JOIN user_collections uc ON q.id = uc.quarter_id AND uc.user_id = ?
        GROUP BY s.id, s.name, s.description, s.start_year, s.end_year, s.total_coins
        ORDER BY s.start_year, s.name
      `, [req.user.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get recent acquisitions
    const recentAcquisitions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          q.*,
          s.name as series_name,
          uc.condition,
          uc.mint_mark,
          uc.acquired_date
        FROM user_collections uc
        JOIN quarters_data q ON uc.quarter_id = q.id
        JOIN series s ON q.series_id = s.id
        WHERE uc.user_id = ?
        ORDER BY uc.acquired_date DESC
        LIMIT 10
      `, [req.user.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json({ 
      success: true, 
      stats: {
        ...stats,
        series_breakdown: seriesStats,
        recent_acquisitions: recentAcquisitions
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/quarters/series', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    
    const series = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM series ORDER BY start_year, name',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    res.json({ success: true, series });
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;