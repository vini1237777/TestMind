"use client";

import ProjectsPage from "./projects/page";
import Intro from "./components/Intro";

export default function HomePage() {
  return (
    <div>
      <Intro />
      <section id="workspace" className="scroll-mt-4 border-t dark:border-gray-800">
        <ProjectsPage />
      </section>
    </div>
  );
}
