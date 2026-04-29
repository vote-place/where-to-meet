export default function HowItWorksSection() {
  return (
    <section className="how-it-works">
      <h2>이용 방법</h2>

      <div className="steps">
        <div className="step-card">
          <span className="step-number">01</span>
          <h3>호스트가 후보 장소를 고릅니다</h3>
          <p>만날 수 있는 장소를 후보로 먼저 등록하고 링크를 공유합니다.</p>
        </div>

        <div className="step-card">
          <span className="step-number">02</span>
          <h3>참여자가 장소를 추가하거나 선택합니다</h3>
          <p>
            링크를 받은 참여자가 원하는 장소를 고르거나 새 장소를 제안합니다.
          </p>
        </div>

        <div className="step-card">
          <span className="step-number">03</span>
          <h3>가장 많이 선택된 장소로 결정합니다</h3>
          <p>최종적으로 가장 많은 선택을 받은 장소를 기준으로 만납니다.</p>
        </div>
      </div>
    </section>
  );
}
