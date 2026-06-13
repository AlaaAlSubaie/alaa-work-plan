import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { LangProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Department Organizer",
  description:
    "Log your day, generate polished weekly achievement reports, and track department projects.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LangProvider>
          <StoreProvider>{children}</StoreProvider>
        </LangProvider>
      </body>
    </html>
  );
}
