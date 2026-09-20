export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="text-2xl font-display font-bold text-myna-charcoal">Myna Lingo</div>
        <div className="flex gap-4">
          <a href="/login" className="px-5 py-2 rounded-full font-medium text-myna-charcoal hover:bg-myna-yellow/20 transition">Log In</a>
          <a href="/register" className="px-5 py-2 rounded-full font-medium bg-myna-orange text-white hover:bg-myna-orange/90 transition">Sign Up</a>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="font-display text-5xl md:text-6xl font-bold text-myna-charcoal max-w-3xl leading-tight">Start Your Language Learning Journey Today</h1>
        <p className="mt-6 text-lg text-myna-charcoal/70 max-w-xl">Learn languages by actually speaking, with real teachers, real conversations, real progress.</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a href="/register?role=student" className="px-8 py-4 rounded-full font-semibold bg-myna-orange text-white text-lg hover:bg-myna-orange/90 transition">Register as a Student</a>
          <a href="/register?role=teacher" className="px-8 py-4 rounded-full font-semibold bg-myna-yellow text-myna-charcoal text-lg hover:bg-myna-yellow/90 transition">Register as a Teacher</a>
        </div>
      </section>
    </main>
  );
}