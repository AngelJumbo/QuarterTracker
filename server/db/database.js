import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import quarters from './quarters/quarters.json' assert { type: 'json' };
import seriesData from './quarters/series.json' assert { type: 'json' };
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbdir = process.env.DB_DIR;

console.log("dbdir: ",dbdir);

//const dbPath = path.join(__dirname, dbdir??'coins.db');
const dbPath = dbdir ?? path.join(__dirname, dbdir ?? 'coins.db');
let db;

export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    console.log("dbpath: ",dbPath);
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      }
    });
  });
};

const createTables = async () => {
  return new Promise((resolve, reject) => {
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        google_id TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        profile_public BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Series table (normalized series data)
      `CREATE TABLE IF NOT EXISTS series (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        start_year INTEGER,
        end_year INTEGER,
        total_coins INTEGER,
        release_pattern TEXT,
        obverse TEXT,
        reverse TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Quarters data table (pre-populated coin information)
      `CREATE TABLE IF NOT EXISTS quarters_data (
        id INTEGER PRIMARY KEY,
        year INTEGER NOT NULL,
        series_id INTEGER NOT NULL,
        design TEXT,
        mintage INTEGER,
        description TEXT,
        image_url TEXT,
        release_date TEXT,
        FOREIGN KEY (series_id) REFERENCES series (id)
      )`,
      
      // User collections table (which coins users own)
      `CREATE TABLE IF NOT EXISTS user_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quarter_id INTEGER NOT NULL,
        mint_mark TEXT,
        condition TEXT,
        notes TEXT,
        acquired_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (quarter_id) REFERENCES quarters_data (id),
        UNIQUE(user_id, quarter_id)
      )`
    ];
    
    let completed = 0;
    const total = queries.length;
    
    queries.forEach((query) => {
      db.run(query, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
        } else {
          completed++;
          if (completed === total) {
            console.log('All tables created successfully');
            populateSeriesAndQuartersData().then(resolve).catch(reject);
          }
        }
      });
    });
  });
};

const populateSeriesAndQuartersData = async () => {
  return new Promise((resolve, reject) => {
    // Check if data already exists
    insertSeriesDataFromFile()
      .then(() => insertQuartersData())
      .then(resolve)
      .catch(reject);
    /*db.get('SELECT COUNT(*) as count FROM quarters_data', (err, row) => {
      if (err) {
        reject(err);
      } else if (row.count > 0) {
        console.log('Quarters data already exists');
        resolve();
      } else {
        // Insert series data from series.json first
      }
    });*/
  });
};

const insertSeriesDataFromFile = () => {
  return new Promise((resolve, reject) => {
    if (seriesData.length === 0) {
      resolve();
      return;
    }
    
    let inserted = 0;
    const total = seriesData.length;

    seriesData.forEach((series) => {
      db.get('SELECT COUNT(*) as count FROM series WHERE id = ?',[series.id], (err, row) => {

        if (err) {
          reject(err);
        } else if (row.count > 0) {
          db.run(
            `UPDATE series SET name = ?, description = ?, start_year = ?, end_year = ?, total_coins = ?, release_pattern = ?, obverse = ?, reverse = ? WHERE id = ? `,
            [
              series.name,
              series.description,
              series.start_year,
              series.end_year,
              series.total_coins,
              series.release_pattern,
              series.obverse,
              series.reverse,
              series.id
            ],
            (err) => {
              if (err) {
                console.error('Error updating series data:', err);
                reject(err);
              } else {
                inserted++;
                if (inserted === total) {
                  console.log('Series data inserted successfully');
                  resolve();
                }
              }
            }
          );
        } else {
          db.run(
            `INSERT INTO series (id, name, description, start_year, end_year, total_coins, release_pattern, obverse, reverse) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              series.id,
              series.name,
              series.description,
              series.start_year,
              series.end_year,
              series.total_coins,
              series.release_pattern,
              series.obverse,
              series.reverse
            ],
            (err) => {
              if (err) {
                console.error('Error inserting series data:', err);
                reject(err);
              } else {
                inserted++;
                if (inserted === total) {
                  console.log('Series data inserted successfully');
                  resolve();
                }
              }
            }
          );
        }
      })
    });
  });
};

const insertQuartersData = () => {
  return new Promise((resolve, reject) => {
    // Get all series with their IDs
    db.all('SELECT id, name FROM series', (err, seriesRows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Create a mapping of series names to IDs
      const seriesMap = {};
      seriesRows.forEach(row => {
        seriesMap[row.name] = row.id;
      });
      
      let inserted = 0;
      const total = quarters.length;
      
      quarters.forEach((quarter) => {
        const seriesId = seriesMap[quarter.series] || null;
        db.get('SELECT COUNT(*) as count FROM quarters_data WHERE id = ?',[quarter.id], (err, row) => {

          if (err) {
            reject(err);
          } else if (row.count > 0) {
            db.run(
              `UPDATE quarters_data SET year = ?, series_id = ?, design = ?, mintage = ?, description = ?, image_url = ?, release_date = ? WHERE id = ?`,
              [ quarter.year, seriesId, quarter.design, quarter.mintage, quarter.description, quarter.image_url ?? null, quarter.release_date ?? null,quarter.id],
              (err) => {
                if (err) {
                  
                  console.error('Error updating quarters data:', err);
                  reject(err);
                } else {
                  inserted++;
                  if (inserted === total) {
                    console.log('Series data inserted successfully');
                    resolve();
                  }
                }
              }
            );

          }else{
            db.run(
              'INSERT INTO quarters_data (id, year, series_id, design, mintage, description, image_url, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [quarter.id, quarter.year, seriesId, quarter.design, quarter.mintage, quarter.description, quarter.image_url ?? null, quarter.release_date ?? null],
              (err) => {
                if (err) {
                  console.error('Error inserting quarter data: ',quarter.year,quarter.design, quarter.series);
                  reject(err);
                } else {
                  inserted++;
                  if (inserted === total) {
                    console.log('Quarters data inserted successfully');
                    resolve();
                  }
                }
              }
            );
          }
        })
      });
    });
  });
};

// Helper function to get quarters with series information
export const getQuartersWithSeries = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        qd.*,
        s.name as series_name,
        s.description as series_description,
        s.start_year,
        s.end_year,
        s.total_coins,
        s.release_pattern,
        s.obverse,
        s.reverse
      FROM quarters_data qd
      LEFT JOIN series s ON qd.series_id = s.id
      ORDER BY qd.year, s.name
    `;
    
    db.all(query, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to get all series
export const getAllSeries = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM series ORDER BY start_year', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to get quarters by series
export const getQuartersBySeries = (seriesId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        qd.*,
        s.name as series_name
      FROM quarters_data qd
      JOIN series s ON qd.series_id = s.id
      WHERE s.id = ?
      ORDER BY qd.year
    `;
    
    db.all(query, [seriesId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};