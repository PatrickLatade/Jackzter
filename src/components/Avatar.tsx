"use client";

interface AvatarProps {
  src?: string | null;
  username: string;
  size?: string; // tailwind size classes (default: w-10 h-10)
}

export default function Avatar({ src, username, size = "w-10 h-10" }: AvatarProps) {
  const initial = username?.[0]?.toUpperCase() || "U";

  return (
    <div
      className={`rounded-full overflow-hidden bg-brand-red text-white flex items-center justify-center font-bold ${size}`}
    >
      {src ? (
        <img src={src} alt={username} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
