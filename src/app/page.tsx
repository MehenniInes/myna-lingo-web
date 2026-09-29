export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="font-display text-5xl md:text-6xl font-bold text-myna-charcoal max-w-3xl leading-tight">
          Start Your Language Learning Journey Today
        </h1>
        <p className="mt-6 text-lg text-myna-charcoal/70 max-w-xl">
          Learn languages by actually speaking, with real teachers, real
          conversations, real progress.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a
            href="/register?role=student"
            className="px-8 py-4 rounded-full font-semibold bg-myna-orange text-white text-lg hover:bg-myna-orange/90 transition"
          >
            Register as a Student
          </a>
          <a
            href="/register?role=teacher"
            className="px-8 py-4 rounded-full font-semibold bg-myna-yellow text-myna-charcoal text-lg hover:bg-myna-yellow/90 transition"
          >
            Register as a Teacher
          </a>
        </div>
      </section>
    </main>
  );
}