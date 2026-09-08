"use client";
import { OptionSwitch } from "@/components/option-switch";
import A from "./_option-a/page";
import Simplified from "./simplified/page";
import Gauge from "./gauge/page";
import HubAndSpoke from "./hub-and-spoke/page";

export default function ReviewBuilderPage() {
  return (
    <OptionSwitch
      base="reviews/builder"
      options={{
        "reviews/builder": A,
        "reviews/builder/simplified": Simplified,
        "reviews/builder/gauge": Gauge,
        "reviews/builder/hub-and-spoke": HubAndSpoke,
      }}
    />
  );
}
