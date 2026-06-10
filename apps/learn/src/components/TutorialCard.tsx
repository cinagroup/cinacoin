import Link from "next/link";

interface TutorialCardProps {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  href: string;
}

const difficultyColors = {
  Beginner: "text-accent-green",
  Intermediate: "text-accent-yellow",
  Advanced: "text-accent-red",
};

export default function TutorialCard({
  title,
  description,
  difficulty,
  duration,
  href,
}: TutorialCardProps) {
  return (
    <Link href={href} className="block group">
      <div className="bg-bg-card border border-border-color rounded-xl p-6 hover:border-accent-blue/50 hover:bg-bg-hover transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-[18px] font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
            {title}
          </h3>
          <span className={`text-[12px] font-medium ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>
        <p className="text-[14px] text-text-secondary mb-4 line-clamp-2">
          {description}
        </p>
        <div className="flex items-center text-[12px] text-text-muted">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {duration}
        </div>
      </div>
    </Link>
  );
}
