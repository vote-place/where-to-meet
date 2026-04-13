"use client";

import { useState } from "react";

type HowItem = {
  number: string;
  title: string;
  description: string;
};

type PreviewItem = {
  title: string;
  list: string[];
};

type HowSlide = {
  id: "how";
  eyebrow: string;
  title: string;
  layout: "three";
  items: HowItem[];
};

type PreviewSlide = {
  id: "preview";
  eyebrow: string;
  title: string;
  layout: "two";
  items: PreviewItem[];
};

type Slide = HowSlide | PreviewSlide;

const slides: Slide[] = [
  {
    id: "how",
    eyebrow: "HOW IT WORKS",
    title: "이용 방법",
    layout: "three",
    items: [
      {
        number: "01",
        title: "호스트가 후보 장소를 고릅니다",
        description:
          "만날 수 있는 장소를 후보로 먼저 등록하고 링크를 공유합니다.",
      },
      {
        number: "02",
        title: "참여자가 장소를 추가하거나 선택합니다",
        description:
          "링크를 받은 참여자가 원하는 장소를 고르거나 새 장소를 제안합니다.",
      },
      {
        number: "03",
        title: "가장 많이 선택된 장소로 결정합니다",
        description:
          "최종적으로 가장 많은 선택을 받은 장소를 기준으로 만납니다.",
      },
    ],
  },
  {
    id: "preview",
    eyebrow: "PREVIEW",
    title: "이런 느낌으로 사용할 수 있어요",
    layout: "two",
    items: [
      {
        title: "후보 장소",
        list: ["강남역 카페 모임", "성수 브런치 카페", "잠실 스터디룸"],
      },
      {
        title: "투표 현황",
        list: [
          "강남역 카페 - 5표",
          "성수 브런치 카페 - 3표",
          "잠실 스터디룸 - 2표",
        ],
      },
    ],
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="hero-carousel-section">
      <div className="carousel-wrapper">
        <button
          type="button"
          className="carousel-arrow left"
          onClick={prevSlide}
          aria-label="이전 슬라이드 보기"
        >
          <span>‹</span>
        </button>

        <div className="carousel-viewport">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {slides.map((slide) => (
              <div className="carousel-slide" key={slide.id}>
                <div className="carousel-panel">
                  <p className="carousel-eyebrow">{slide.eyebrow}</p>
                  <h2 className="carousel-title">{slide.title}</h2>

                  {slide.id === "how" ? (
                    <div className={`carousel-grid ${slide.layout}`}>
                      {slide.items.map((item) => (
                        <div className="glass-card" key={item.number}>
                          <span className="card-number">{item.number}</span>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`carousel-grid ${slide.layout}`}>
                      {slide.items.map((item) => (
                        <div className="glass-card" key={item.title}>
                          <h3>{item.title}</h3>
                          <ul className="preview-list">
                            {item.list.map((text) => (
                              <li key={text}>{text}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="carousel-dots">
          {slides.map((dot, index) => (
            <button
              key={dot.id}
              type="button"
              className={`carousel-dot ${index === current ? "active" : ""}`}
              onClick={() => setCurrent(index)}
              aria-label={`${index + 1}번 슬라이드로 이동`}
            />
          ))}
        </div>

        <button
          type="button"
          className="carousel-arrow right"
          onClick={nextSlide}
          aria-label="다음 슬라이드 보기"
        >
          <span>›</span>
        </button>
      </div>
    </section>
  );
}