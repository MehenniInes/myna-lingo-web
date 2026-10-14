export function PodcastCover({
  coverUrl,
  title,
  className = "w-full h-48 object-cover",
}: {
  coverUrl?: string;
  title: string;
  className?: string;
}) {
  if (!coverUrl) {
    return (
      <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-myna-orange/20 to-myna-orange/5 text-6xl">
        🎙️
      </div>
    );
  }
  return <img src={coverUrl} alt={title} className={className} />;
}