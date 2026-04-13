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
    eyebrow: "WHY WHERE TO MEET",
    title: "장소 정하느라 길어지는 대화, 여기서 끝",
    layout: "three",
    items: [
      {
        number: "01",
        title: "후보를 한 번에 모으세요",
        description:
          "채팅방에 흩어진 장소 의견을 한 곳에 정리할 수 있습니다.",
      },
      {
        number: "02",
        title: "투표로 빠르게 좁히세요",
        description:
          "마음에 드는 장소에 바로 투표하고, 인기 있는 후보를 쉽게 확인하세요.",
      },
      {
        number: "03",
        title: "헷갈리지 않게 결정하세요",
        description:
          "가장 적합한 장소를 빠르게 정하고, 모두가 같은 결과를 확인할 수 있습니다.",
      },
    ],
  },
  {
    id: "preview",
    eyebrow: "REAL USE CASE",
    title: "팀플, 모임, 약속 장소를 이렇게 정하세요",
    layout: "two",
    items: [
      {
        title: "후보 장소",
        list: ["강남역 카페", "성수 브런치 카페", "잠실 스터디룸"],
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
        </button>
      </div>
    </section>
  );
}