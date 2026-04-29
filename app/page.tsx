import Header from "./components/Header";
import HeroSection from "./components/HeroSection";

export default function HomePage() {
  return (
    <div className="app landing-page">
      <Header />
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
