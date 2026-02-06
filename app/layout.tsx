import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Point clouds viewer",
  description: "View and analyze point clouds in 3D.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
