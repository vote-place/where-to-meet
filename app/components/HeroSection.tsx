import Link from "next/link";
import HeroCarousel from "../components/HeroCarousel";

export default function HeroSection() {
  return (
    <section className="hero hero-background">
      <div className="hero-overlay">
        <div className="hero-content">
          <p className="hero-badge">Meet together, decide together</p>
          <h1>
            어디서 만날지,
            <br />
            함께 정하세요
          </h1>
          <p className="hero-description">
            팀플, 모임, 약속 장소를 빠르게 정리하는 서비스
          </p>

          <div className="hero-buttons">
            <Link
              href="/create"
              className="cta-button primary hero-button link-button"
            >
              모임 만들기
            </Link>
            <Link
              href="/join"
              className="cta-button secondary hero-button link-button"
            >
              링크로 참여하기
            </Link>
          </div>
        </div>

        <HeroCarousel />
      </div>
    </section>
  );
}
