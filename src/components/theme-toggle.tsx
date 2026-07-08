"use client";

import { useEffect, useState } from "react";
import { Icon } from "./icons";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("univos-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-text ${className}`}
    >
      {dark === null ? <span className="size-5" /> : <Icon name={dark ? "sun" : "moon"} className="size-[18px]" />}
    </button>
  );
}
