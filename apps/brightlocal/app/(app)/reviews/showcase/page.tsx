"use client";
import { OptionSwitch } from "@/components/option-switch";
import A from "./_option-a/page";
import Rail from "./rail/page";

export default function ReviewShowcasePage() {
  return <OptionSwitch base="/reviews/showcase" options={{ "/reviews/showcase": A, "/reviews/showcase/rail": Rail }} />;
}
