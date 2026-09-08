"use client";
import { OptionSwitch } from "@/components/option-switch";
import A from "./_option-a/page";
import Trends from "./trends/page";
import TrendsB from "./trends-b/page";
import TrendsC from "./trends-c/page";

/** The Reviews hub, with its layout options. Option A is the promoted
 *  hub; the trends treatments are the explorations. */
export default function ReviewsPage() {
  return (
    <OptionSwitch
      base="reviews"
      options={{ "reviews": A, "reviews/trends": Trends, "reviews/trends-b": TrendsB, "reviews/trends-c": TrendsC }}
    />
  );
}
