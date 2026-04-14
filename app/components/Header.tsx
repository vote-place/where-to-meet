"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <header className={`header ${isScrolled ? "scrolled" : ""}`}>
      <div className="header-left">
        <Link
          href="/"
          className="brand link-button"
          aria-label="Where To Meet 홈으로 이동"
        >
          <div className="brand-text-group">
            <span className="logo">Where To Meet</span>
            <span className="brand-subtitle">함께 정하는 만남 장소</span>
          </div>
        </Link>
      </div>

      <nav className="nav">
        <Link
          href="/create"
          className="cta-button primary header-button link-button"
        >
          모임 만들기
        </Link>
        <Link
          href="/join"
          className="cta-button secondary header-button link-button"
        >
          참여하기
        </Link>
      </nav>
    </header>
  );
}
