import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Mission } from "@/components/mission";
import { Problem } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { Faq } from "@/components/faq";
import { Cta } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Mission />
        <Problem />
        <HowItWorks />
        <Features />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
