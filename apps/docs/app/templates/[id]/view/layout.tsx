import { Toaster } from "@/components/ui/sonner";

export default function TemplateViewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
