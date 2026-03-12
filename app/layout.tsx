import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AskAServer.AI — AI Legal Assistant for Service of Process",
  description:
    "AskAServer.AI — Free AI-powered legal assistant for service of process law across all 50 U.S. states. Get instant answers about serving summons, subpoenas, evictions, and more.",
  keywords:
    "service of process, process server, serve summons, serve subpoena, legal document service, process serving laws, how to serve papers",
  openGraph: {
    title: "AskAServer.AI — AI Legal Assistant for Service of Process",
    description:
      "Get instant, accurate answers about service of process law across all 50 U.S. states. Free AI-powered legal research tool.",
    type: "website",
    url: "https://askaserver.ai",
    images: [{ url: "https://askaserver.ai/assets/shield-logo.svg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AskAServer.AI — AI Legal Assistant for Service of Process",
    description:
      "Free AI-powered answers about service of process law across all 50 U.S. states.",
  },
  alternates: {
    canonical: "https://askaserver.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
