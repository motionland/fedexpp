import Database from "better-sqlite3"

const db = new Database("receivingtracklog.db")

// Enable foreign key constraints
db.pragma("foreign_keys = ON")

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    department TEXT,
    status TEXT NOT NULL
  )
`)

// Create teams table
db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  )
`)

// Create user_teams table for many-to-many relationship
db.exec(`
  CREATE TABLE IF NOT EXISTS user_teams (
    user_id INTEGER,
    team_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (team_id) REFERENCES teams (id),
    PRIMARY KEY (user_id, team_id)
  )
`)

// Create otp table
db.exec(`
  CREATE TABLE IF NOT EXISTS otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`)

// Create historical_reports table
db.exec(`
  CREATE TABLE IF NOT EXISTS historical_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date TEXT NOT NULL,
    total_packages INTEGER NOT NULL,
    on_time_delivery_rate REAL NOT NULL,
    average_transit_time REAL NOT NULL
  )
`)

// Create status_data table
db.exec(`
  CREATE TABLE IF NOT EXISTS status_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1
  )
`)

export { db }

// User CRUD operations
export const createUser = db.prepare(`
  INSERT INTO users (email, password, role, name, department, status)
  VALUES (?, ?, ?, ?, ?, ?)
`)

export const getUserByEmail = db.prepare(`
  SELECT * FROM users WHERE email = ?
`)

export const updateUser = db.prepare(`
  UPDATE users
  SET email = ?, role = ?, name = ?, department = ?, status = ?
  WHERE id = ?
`)

export const deleteUser = db.prepare(`
  DELETE FROM users WHERE id = ?
`)

// Team CRUD operations
export const createTeam = db.prepare(`
  INSERT INTO teams (name, description)
  VALUES (?, ?)
`)

export const getTeamById = db.prepare(`
  SELECT * FROM teams WHERE id = ?
`)

export const updateTeam = db.prepare(`
  UPDATE teams
  SET name = ?, description = ?
  WHERE id = ?
`)

export const deleteTeam = db.prepare(`
  DELETE FROM teams WHERE id = ?
`)

// OTP operations
export const createOTP = db.prepare(`
  INSERT INTO otp (user_id, code, expires_at)
  VALUES (?, ?, ?)
`)

export const getOTPByUserIdAndCode = db.prepare(`
  SELECT * FROM otp
  WHERE user_id = ? AND code = ? AND expires_at > ?
`)

export const deleteOTP = db.prepare(`
  DELETE FROM otp WHERE id = ?
`)

// Historical report operations
export const addHistoricalReport = db.prepare(`
  INSERT INTO historical_reports (report_date, total_packages, on_time_delivery_rate, average_transit_time)
  VALUES (?, ?, ?, ?)
`)

export const getHistoricalReports = db.prepare(`
  SELECT * FROM historical_reports
  ORDER BY report_date DESC
  LIMIT ?
`)

// Status data operations
export const addStatusData = db.prepare(`
  INSERT INTO status_data (name, description, is_active)
  VALUES (?, ?, ?)
`)

export const getActiveStatusData = db.prepare(`
  SELECT * FROM status_data
  WHERE is_active = 1
`)

export const updateStatusData = db.prepare(`
  UPDATE status_data
  SET name = ?, description = ?, is_active = ?
  WHERE id = ?
`)