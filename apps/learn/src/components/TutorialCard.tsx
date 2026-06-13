"use client";

import Link from "next/link";

interface TutorialCardProps {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  href: string;
}

const difficultyColors = {
  Beginner: "var(--cc-success)",
  Intermediate: "var(--cc-warning)",
  Advanced: "var(--cc-error)",
};

export default function TutorialCard({
  title,
  description,
  difficulty,
  duration,
  href,
}: TutorialCardProps) {
  return (
    <Link 
      href={href} 
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-link)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cc-canvas)] rounded-lg"
      aria-label={`${title} - ${difficulty} level, ${duration}`}
    >
      <div className="cc-card cc-card-interactive">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-body-lg font-semibold group-hover:text-[var(--cc-link)] transition-colors">
            {title}
          </h3>
          <span className="cc-badge" style={{ color: difficultyColors[difficulty] }}>
            {difficulty}
          </span>
        </div>
        <p className="text-body-sm mb-4 line-clamp-2" style={{ color: 'var(--cc-body)' }}>
          {description}
        </p>
        <div className="flex items-center text-caption" style={{ color: 'var(--cc-mute)' }}>
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
