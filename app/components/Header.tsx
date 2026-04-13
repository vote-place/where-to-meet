import Link from "next/link";

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <Link href="/" className="brand link-button" aria-label="Where To Meet 홈으로 이동">
          <div className="brand-text-group">
            <span className="logo">Where To Meet</span>
            <span className="brand-subtitle">함께 정하는 만남 장소</span>
          </div>
        </Link>
      </div>

      <nav className="nav">
        <Link href="/create" className="cta-button primary header-button link-button">
          모임 만들기
        </Link>
        <Link href="/join" className="cta-button secondary header-button link-button">
          참여하기
        </Link>
      </nav>
    </header>
  );
}