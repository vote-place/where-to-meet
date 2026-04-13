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
            호스트가 후보 장소를 만들고, 참여자들이 장소를 추가하거나 선택해
            최종 만남 장소를 결정하는 서비스입니다.
          </p>

          <div className="hero-buttons">
            <Link href="/create" className="primary-button link-button">
              모임 만들기
            </Link>
            <Link href="/join" className="secondary-button link-button">
              링크로 참여하기
            </Link>
          </div>
        </div>

        <HeroCarousel />
      </div>
    </section>
  );
}