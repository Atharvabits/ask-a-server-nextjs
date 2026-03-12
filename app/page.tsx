"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import FAQ from "@/components/home/FAQ";

export default function HomePage() {
  return (
    <div>
      <Header activeNav="/" />
      <Hero />
      <Features />
      <FAQ />
      <Footer />
    </div>
  );
}
