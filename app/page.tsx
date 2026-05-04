import Link from 'next/link'
import {
  ArrowRight, Star, Shield, Zap, Globe, Users, CheckCircle,
  TrendingUp, ChevronRight, Search
} from 'lucide-react'
import { CATEGORIES } from '@/types/database'

const STATS = [
  { label: 'Active Taskers', value: '5,000+' },
  { label: 'Tasks Completed', value: '12,000+' },
  { label: 'Paid Out (KES)', value: '8M+' },
  { label: 'Countries', value: '10+' },
]

const FEATURES = [
  {
    icon: Shield,
    title: 'Escrow Protection',
    desc: 'Funds are locked in escrow when a task is posted. Released to tasker only after approval.',
  },
  {
    icon: Zap,
    title: 'Fast Payouts',
    desc: 'Get paid directly to M-Pesa or bank within hours of task approval.',
  },
  {
    icon: Globe,
    title: 'KES & USD Payments',
    desc: 'Pay or earn in Kenyan Shillings or US Dollars via Paystack.',
  },
  {
    icon: Users,
    title: 'Verified Community',
    desc: 'Ratings, reviews, and identity verification ensure trust on both sides.',
  },
  {
    icon: TrendingUp,
    title: 'Smart Bidding',
    desc: 'Taskers bid with custom proposals. Clients pick the best fit, not just the cheapest.',
  },
  {
    icon: CheckCircle,
    title: 'Dispute Resolution',
    desc: 'Our team mediates fairly if things go wrong, protecting both parties.',
  },
]

const HOW_IT_WORKS_CLIENT = [
  { step: '01', title: 'Post a Task', desc: 'Describe what you need, set your budget and deadline. Free to post.' },
  { step: '02', title: 'Review Bids', desc: 'Taskers apply with proposals. Chat, compare, and choose the best.' },
  { step: '03', title: 'Fund Escrow', desc: 'Pay securely via Paystack. Funds are held until the task is done.' },
  { step: '04', title: 'Approve & Release', desc: 'Review the submission and release payment with one click.' },
]

const HOW_IT_WORKS_TASKER = [
  { step: '01', title: 'Create Profile', desc: 'Sign up free, add your skills and experience.' },
  { step: '02', title: 'Browse & Bid', desc: 'Find tasks that match your skills and submit a compelling bid.' },
  { step: '03', title: 'Complete the Work', desc: 'Deliver quality work before the deadline and submit for review.' },
  { step: '04', title: 'Get Paid', desc: 'Earn directly to your wallet. Withdraw to M-Pesa or bank anytime.' },
]

const TESTIMONIALS = [
  {
    name: 'Amina K.',
    role: 'University Student, Nairobi',
    text: 'I earned KES 45,000 last month completing research tasks. TaskCloud has been life-changing for my finances.',
    rating: 5,
    avatar: 'AK',
  },
  {
    name: 'David M.',
    role: 'Startup Founder',
    text: 'We use TaskCloud to outsource market research. The quality is amazing at a fraction of agency costs.',
    rating: 5,
    avatar: 'DM',
  },
  {
    name: 'Grace W.',
    role: 'Freelance Writer',
    text: 'The bidding system is fair and transparent. I love that I can negotiate my rate directly with clients.',
    rating: 5,
    avatar: 'GW',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#1e2b1e] bg-[#0a0f0d]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Zap size={16} className="text-black" />
            </div>
            <span className="font-bold text-lg text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              TaskCloud
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/tasks" className="text-gray-400 hover:text-green-400 text-sm transition-colors">Browse Tasks</Link>
            <Link href="#how-it-works" className="text-gray-400 hover:text-green-400 text-sm transition-colors">How It Works</Link>
            <Link href="#categories" className="text-gray-400 hover:text-green-400 text-sm transition-colors">Categories</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/auth/signup" className="btn-primary py-2 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 mesh-bg">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-green-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-green-400/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 text-sm mb-8 animate-fade-in">
            <Star size={12} className="fill-current" />
            <span>Trusted by 5,000+ taskers & clients across Africa</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up"
              style={{ fontFamily: 'Sora, sans-serif' }}>
            Earn Online.
            <br />
            <span className="text-green-400">Get Things Done.</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            TaskCloud connects skilled individuals with people who need work done.
            Post tasks, earn money, and pay securely in <strong className="text-white">KES or USD</strong>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/auth/signup" className="btn-primary flex items-center gap-2 text-base">
              Start Earning Free <ArrowRight size={16} />
            </Link>
            <Link href="/tasks" className="btn-secondary flex items-center gap-2 text-base">
              <Search size={16} /> Browse Tasks
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-green-400" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {s.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-24 border-t border-[#1e2b1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
              Every Type of Task
            </h2>
            <p className="text-gray-400">Find work that matches your skills or outsource any type of project</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/tasks?category=${cat.slug}`}
                className="card-hover flex flex-col items-center gap-2 py-4 text-center group cursor-pointer"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm text-gray-300 group-hover:text-green-400 transition-colors font-medium">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-[#1e2b1e] bg-[#0d140d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
              Built for Trust & Speed
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Everything you need to work and earn safely in one platform
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card group">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4 group-hover:bg-green-500/20 transition-colors">
                  <f.icon size={20} className="text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 border-t border-[#1e2b1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
              How It Works
            </h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-16">
            {/* For Clients */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-400 text-sm font-medium">
                  For Clients
                </div>
                <div className="h-px flex-1 bg-[#1e2b1e]" />
              </div>
              <div className="space-y-6">
                {HOW_IT_WORKS_CLIENT.map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#111916] border border-[#1e2b1e] flex items-center justify-center shrink-0 font-mono text-xs text-green-400/60">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {item.title}
                      </div>
                      <div className="text-gray-400 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/auth/signup?role=client" className="btn-secondary mt-8 inline-flex items-center gap-2 text-sm">
                Post Your First Task <ChevronRight size={14} />
              </Link>
            </div>

            {/* For Taskers */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="px-3 py-1 rounded-full bg-green-500/15 border border-green-500/20 text-green-400 text-sm font-medium">
                  For Taskers
                </div>
                <div className="h-px flex-1 bg-[#1e2b1e]" />
              </div>
              <div className="space-y-6">
                {HOW_IT_WORKS_TASKER.map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#111916] border border-[#1e2b1e] flex items-center justify-center shrink-0 font-mono text-xs text-green-400/60">
                      {item.step}
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {item.title}
                      </div>
                      <div className="text-gray-400 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/auth/signup?role=tasker" className="btn-primary mt-8 inline-flex items-center gap-2 text-sm">
                Start Earning <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-[#1e2b1e] bg-[#0d140d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
              Real Stories
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-[#1e2b1e]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Sora, sans-serif' }}>
              Common Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { q: 'Is TaskCloud free to join?', a: 'Yes, creating an account is completely free. A 5% platform fee is charged on successfully completed tasks to cover payment processing and platform maintenance.' },
              { q: 'What currencies are supported?', a: 'TaskCloud supports Kenyan Shillings (KES) and US Dollars (USD) via Paystack. You can deposit, pay, and withdraw in either currency.' },
              { q: 'How does the escrow system work?', a: "When a task is funded, the client's payment is held securely. Once the task is completed and approved, funds are released to the tasker. This protects both parties." },
              { q: 'How long do withdrawals take?', a: 'M-Pesa withdrawals are typically processed within minutes. Bank transfers may take 1-2 business days.' },
              { q: 'What types of tasks can I post?', a: 'Anything legal and digital — research, writing, design, data entry, surveys, digital marketing, academic assistance, translation, and more.' },
              { q: 'What if there is a dispute?', a: 'Our dispute resolution team mediates between client and tasker fairly. We review submissions and communications to determine fair outcomes.' },
            ].map((faq) => (
              <details key={faq.q} className="card group cursor-pointer">
                <summary className="flex items-center justify-between font-medium text-white list-none">
                  <span style={{ fontFamily: 'Sora, sans-serif' }}>{faq.q}</span>
                  <ChevronRight size={16} className="text-gray-500 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-400 text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#1e2b1e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="card border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
              Ready to Start?
            </h2>
            <p className="text-gray-400 mb-8 text-lg">
              Join thousands earning and getting work done on TaskCloud.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="btn-primary flex items-center justify-center gap-2">
                Create Free Account <ArrowRight size={16} />
              </Link>
              <Link href="/tasks" className="btn-secondary flex items-center justify-center gap-2">
                <Search size={16} /> Browse Tasks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e2b1e] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
                  <Zap size={14} className="text-black" />
                </div>
                <span className="font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>TaskCloud</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                A modern digital task marketplace connecting talent with opportunity across Africa.
              </p>
            </div>
            <div>
              <div className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Platform</div>
              <div className="space-y-2">
                {['Browse Tasks', 'Post a Task', 'How It Works'].map(l => (
                  <Link key={l} href="#" className="block text-gray-500 hover:text-green-400 text-sm transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Company</div>
              <div className="space-y-2">
                {['About Us', 'Contact', 'Blog'].map(l => (
                  <Link key={l} href="#" className="block text-gray-500 hover:text-green-400 text-sm transition-colors">{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <div className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Legal</div>
              <div className="space-y-2">
                {['Privacy Policy', 'Terms & Conditions', 'Refund Policy'].map(l => (
                  <Link key={l} href="#" className="block text-gray-500 hover:text-green-400 text-sm transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[#1e2b1e] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-600 text-sm">© 2026 TaskCloud. All rights reserved.</div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Payments by</span>
              <span className="text-green-500 font-semibold">Paystack</span>
              <span>·</span>
              <span>🇰🇪 KES</span>
              <span>·</span>
              <span>🇺🇸 USD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
