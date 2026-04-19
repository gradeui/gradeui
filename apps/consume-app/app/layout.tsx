import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grade UI — consume app",
  description:
    "Integration test app validating that @gradeui/ui installs and renders correctly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
