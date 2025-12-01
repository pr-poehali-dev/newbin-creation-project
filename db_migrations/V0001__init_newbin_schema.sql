-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pins table
CREATE TABLE IF NOT EXISTS pins (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    pin_id INTEGER REFERENCES pins(id),
    author_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    pin_id INTEGER REFERENCES pins(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, pin_id)
);

-- Create reports table for moderation
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    reporter_ip VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(target_type, target_id, reporter_ip)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pins_author ON pins(author_id);
CREATE INDEX IF NOT EXISTS idx_pins_created ON pins(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_pin ON comments(pin_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);