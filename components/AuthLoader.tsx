"use client";

import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";

export function AuthLoader({
  ready,
  onComplete,
}: {
  ready: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          if (ready) return 100;
          else return prev;
        }
        return prev + 5;
      });
    }, 1);

    return () => clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  }, [onComplete, progress]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-100">
      <div className="text-xl font-medium">Chat-Box</div>

      <Progress value={progress} className="w-55 h-1" />
    </div>
  );
}
