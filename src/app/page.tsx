"use client";

import ProjectsPage from "./projects/page";
import SentryTestButton from "./SentryTestButton";

export default function HomePage() {
  return (
    <div>
      <ProjectsPage />
      <SentryTestButton />
    </div>
  );
}
