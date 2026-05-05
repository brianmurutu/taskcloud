export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      tasks: {
        Row: Task
        Insert: Partial<Task>
        Update: Partial<Task>
      }
      applications: {
        Row: Application
        Insert: Partial<Application>
        Update: Partial<Application>
      }
      submissions: {
        Row: Submission
        Insert: Partial<Submission>
        Update: Partial<Submission>
      }
      messages: {
        Row: Message
        Insert: Partial<Message>
        Update: Partial<Message>
      }
      reviews: {
        Row: Review
        Insert: Partial<Review>
        Update: Partial<Review>
      }
      transactions: {
        Row: Transaction
        Insert: Partial<Transaction>
        Update: Partial<Transaction>
      }
      notifications: {
        Row: Notification
        Insert: Partial<Notification>
        Update: Partial<Notification>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  country: string
  avatar_url?: string
  bio?: string
  skills?: string[]
  rating: number
  total_reviews: number
  tasks_completed: number
  tasks_posted: number
  wallet_balance: number
  wallet_currency: 'KES' | 'USD'
  is_verified: boolean
  role: 'tasker' | 'client' | 'both'
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  category: string
  budget: number
  currency: 'KES' | 'USD'
  deadline: string
  status: 'open' | 'assigned' | 'in_progress' | 'submitted' | 'completed' | 'cancelled' | 'disputed'
  poster_id: string
  assignee_id?: string
  required_skills?: string[]
  attachments?: string[]
  max_applications: number
  application_count: number
  is_featured: boolean
  views: number
  created_at: string
  updated_at: string
  // Joined fields
  poster?: Profile
  assignee?: Profile
  my_application?: Application
}

export interface Application {
  id: string
  task_id: string
  applicant_id: string
  cover_letter: string
  proposed_amount?: number
  proposed_deadline?: string
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
  updated_at: string
  // Joined
  task?: Task
  applicant?: Profile
}

export interface Submission {
  id: string
  task_id: string
  tasker_id: string
  content: string
  attachments?: string[]
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
  feedback?: string
  revision_count: number
  submitted_at: string
  reviewed_at?: string
}

export interface Message {
  id: string
  task_id?: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  // Joined
  sender?: Profile
  receiver?: Profile
  task?: Task
}

export interface Review {
  id: string
  task_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  comment?: string
  created_at: string
  reviewer?: Profile
}

export interface Transaction {
  id: string
  user_id: string
  type: 'deposit' | 'withdrawal' | 'payment_sent' | 'payment_received' | 'refund' | 'fee'
  amount: number
  currency: 'KES' | 'USD'
  status: 'pending' | 'completed' | 'failed'
  reference?: string
  task_id?: string
  description?: string
  paystack_data?: Record<string, unknown>
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export const CATEGORIES = [
  { name: 'Research', slug: 'research', icon: '🔬' },
  { name: 'Writing', slug: 'writing', icon: '✍️' },
  { name: 'Design', slug: 'design', icon: '🎨' },
  { name: 'Data Entry', slug: 'data-entry', icon: '📊' },
  { name: 'Surveys', slug: 'surveys', icon: '📋' },
  { name: 'Digital Marketing', slug: 'digital-marketing', icon: '📢' },
  { name: 'Business Support', slug: 'business-support', icon: '💼' },
  { name: 'Academic Assistance', slug: 'academic', icon: '🎓' },
  { name: 'Translation', slug: 'translation', icon: '🌍' },
  { name: 'Tech Support', slug: 'tech-support', icon: '💻' },
  { name: 'Video & Audio', slug: 'video-audio', icon: '🎥' },
  { name: 'General', slug: 'general', icon: '⚡' },
] as const
