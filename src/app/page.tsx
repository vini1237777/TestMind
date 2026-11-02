"use client";

import ProjectsPage from "./projects/page";
import Intro from "./components/Intro";

export default function HomePage() {
  return (
    <div>
      <Intro />
      <ProjectsPage />
    </div>
  );
}
