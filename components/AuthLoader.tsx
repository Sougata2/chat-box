"use client";

import { Progress } from "@/components/ui/progress";
import React, { useEffect, useState } from "react";

export function AuthLoader({ ready }: { ready: boolean }) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (ready) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // stop near the end
        return prev + 5;
      });
    }, 1);

    return () => clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (ready) {
      setTimeout(() => {
        setProgress(100);
      }, 0);
    }
  }, [ready]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-100">
      <div className="text-xl font-medium">Chat-Box</div>

      <Progress value={progress} className="w-55" />
    </div>
  );
}
