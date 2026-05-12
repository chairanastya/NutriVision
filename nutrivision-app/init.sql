#!/bin/bash

# NutriVision Database Initialization Script
# This script will be automatically run by Docker when the database first starts

-- Create tables for NutriVision application

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User health profiles
CREATE TABLE IF NOT EXISTS user_health_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    gender VARCHAR(50),
    birth_date DATE,
    height DOUBLE PRECISION,
    weight DOUBLE PRECISION,
    activity_level VARCHAR(50),
    daily_calories_target DOUBLE PRECISION,
    daily_sugar_limit DOUBLE PRECISION,
    daily_sodium_limit DOUBLE PRECISION,
    daily_fat_limit DOUBLE PRECISION,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medical conditions
CREATE TABLE IF NOT EXISTS medical_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    restricted_nutrient_id INTEGER,
    description TEXT
);

-- User medical history
CREATE TABLE IF NOT EXISTS user_medical_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    condition_id INTEGER REFERENCES medical_conditions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    serving_size DOUBLE PRECISION,
    serving_unit VARCHAR(50),
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nutrients
CREATE TABLE IF NOT EXISTS nutrients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL
);

-- Product nutrients (many-to-many)
CREATE TABLE IF NOT EXISTS product_nutrients (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    nutrient_id INTEGER REFERENCES nutrients(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL
);

-- Scans
CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    image_path TEXT,
    ocr_raw_text TEXT,
    nutrition_score DOUBLE PRECISION,
    category VARCHAR(50),
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily water logs
CREATE TABLE IF NOT EXISTS daily_water_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL,
    amount_ml DOUBLE PRECISION NOT NULL,
    glasses_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily mood logs
CREATE TABLE IF NOT EXISTS daily_mood_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL,
    mood_level VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily activities
CREATE TABLE IF NOT EXISTS daily_activities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL,
    activity_type VARCHAR(100),
    duration_minutes INTEGER,
    calories_burned DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id ON user_health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medical_history_user_id ON user_medical_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_product_id ON scans(product_id);
CREATE INDEX IF NOT EXISTS idx_daily_water_logs_user_id ON daily_water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_mood_logs_user_id ON daily_mood_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);

-- Insert sample data (optional)
INSERT INTO nutrients (name, unit) VALUES
    ('Calories', 'kcal'),
    ('Protein', 'g'),
    ('Carbohydrates', 'g'),
    ('Fat', 'g'),
    ('Fiber', 'g'),
    ('Sugar', 'g'),
    ('Sodium', 'mg'),
    ('Cholesterol', 'mg')
ON CONFLICT DO NOTHING;

INSERT INTO medical_conditions (name, description) VALUES
    ('Diabetes', 'Condition affecting blood sugar levels'),
    ('Hypertension', 'High blood pressure condition'),
    ('Celiac Disease', 'Gluten intolerance'),
    ('Lactose Intolerance', 'Inability to digest lactose'),
    ('Allergies', 'Various food allergies')
ON CONFLICT DO NOTHING;
