import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nameColorMap: Record<string, string> = {
  a: "text-red-500",
  b: "text-orange-500",
  c: "text-amber-500",
  d: "text-yellow-500",
  e: "text-lime-500",
  f: "text-green-500",
  g: "text-emerald-500",
  h: "text-teal-500",
  i: "text-cyan-500",
  j: "text-sky-500",
  k: "text-blue-500",
  l: "text-indigo-500",
  m: "text-violet-500",
  n: "text-purple-500",
  o: "text-fuchsia-500",
  p: "text-pink-500",
  q: "text-rose-500",
  r: "text-red-600",
  s: "text-orange-600",
  t: "text-amber-600",
  u: "text-green-600",
  v: "text-teal-600",
  w: "text-cyan-600",
  x: "text-blue-600",
  y: "text-indigo-600",
  z: "text-purple-600",
};

export function getNameColor(name?: string) {
  if (!name) return "text-emerald-600";
  const firstChar = name[0].toLowerCase();
  return nameColorMap[firstChar] ?? "text-emerald-600";
}
