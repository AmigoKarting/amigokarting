"use client";

import dynamic from "next/dynamic";

const InstallPrompt = dynamic(
  () => import("./InstallPrompt").then((mod) => mod.InstallPrompt),
  { ssr: false }
);

export function InstallBanner() {
  return <InstallPrompt />;
}
