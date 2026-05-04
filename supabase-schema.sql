-- ============================================================
-- TaskCloud Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT DEFAULT 'Kenya',
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[], -- array of skill tags
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_posted INTEGER DEFAULT 0,
  wallet_balance DECIMAL(12,2) DEFAULT 0.00,
  wallet_currency TEXT DEFAULT 'KES',
  is_verified BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'both', -- 'tasker', 'client', 'both'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  deadline DATE NOT NULL,
  status TEXT DEFAULT 'open', -- 'open', 'assigned', 'in_progress', 'submitted', 'completed', 'cancelled', 'disputed'
  poster_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assignee_id UUID REFERENCES profiles(id),
  required_skills TEXT[],
  attachments TEXT[], -- array of file URLs
  max_applications INTEGER DEFAULT 10,
  application_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TASK APPLICATIONS (Bids)
-- ============================================================
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cover_letter TEXT NOT NULL,
  proposed_amount DECIMAL(12,2),
  proposed_deadline DATE,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'withdrawn'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, applicant_id)
);

-- ============================================================
-- SUBMISSIONS
-- ============================================================
CREATE TABLE submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  tasker_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT[],
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'revision_requested'
  feedback TEXT,
  revision_count INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, reviewer_id)
);

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'payment_sent', 'payment_received', 'refund', 'fee'
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  reference TEXT UNIQUE, -- Paystack reference
  task_id UUID REFERENCES tasks(id),
  description TEXT,
  paystack_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'new_application', 'application_accepted', 'task_assigned', 'submission_received', 'payment_received', 'message', 'review'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES (for reference)
-- ============================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  task_count INTEGER DEFAULT 0
);

INSERT INTO categories (name, slug, icon, description) VALUES
  ('Research', 'research', '🔬', 'Academic and market research tasks'),
  ('Writing', 'writing', '✍️', 'Content writing, copywriting, and editing'),
  ('Design', 'design', '🎨', 'Graphic design, UI/UX, and creative work'),
  ('Data Entry', 'data-entry', '📊', 'Data collection, cleaning, and entry tasks'),
  ('Surveys', 'surveys', '📋', 'Survey creation and participation'),
  ('Digital Marketing', 'digital-marketing', '📢', 'Social media, SEO, and marketing tasks'),
  ('Business Support', 'business-support', '💼', 'Administrative and business tasks'),
  ('Academic Assistance', 'academic', '🎓', 'Tutoring and academic task support'),
  ('Translation', 'translation', '🌍', 'Language translation and interpretation'),
  ('Tech Support', 'tech-support', '💻', 'Technical assistance and IT tasks'),
  ('Video & Audio', 'video-audio', '🎥', 'Video editing, voiceovers, and audio tasks'),
  ('General', 'general', '⚡', 'Miscellaneous tasks');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks: public read, authenticated write
CREATE POLICY "Tasks are viewable by everyone" ON tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = poster_id);
CREATE POLICY "Poster can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = poster_id);

-- Applications: own read, authenticated write
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = applicant_id OR auth.uid() IN (SELECT poster_id FROM tasks WHERE id = task_id));
CREATE POLICY "Authenticated users can apply" ON applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = applicant_id OR auth.uid() IN (SELECT poster_id FROM tasks WHERE id = task_id));

-- Messages: participants can read
CREATE POLICY "Message participants can view" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark as read" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Reviews: public read, authenticated write
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Task participants can review" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Transactions: own only
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Notifications: own only
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update task application count
CREATE OR REPLACE FUNCTION update_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tasks SET application_count = (
    SELECT COUNT(*) FROM applications WHERE task_id = NEW.task_id AND status != 'withdrawn'
  ) WHERE id = NEW.task_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_application_change
  AFTER INSERT OR UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_application_count();

-- Update profile rating after review
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- Updated at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
