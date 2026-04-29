export default function PreviewSection() {
  return (
    <section className="preview">
      <h2>이런 느낌으로 사용할 수 있어요</h2>

      <div className="preview-box">
        <div className="preview-left">
          <h3>후보 장소</h3>
          <ul>
            <li>강남역 카페 모임</li>
            <li>성수 브런치 카페</li>
            <li>잠실 스터디룸</li>
          </ul>
        </div>

        <div className="preview-right">
          <h3>투표 현황</h3>
          <p>강남역 카페 - 5표</p>
          <p>성수 브런치 카페 - 3표</p>
          <p>잠실 스터디룸 - 2표</p>
        </div>
      </div>
    </section>
  );
}
