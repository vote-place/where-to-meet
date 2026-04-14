"use client";

import { useState } from "react";
import Header from "../components/Header";

type ErrorState = {
  meetingName?: string;
  deadline?: string;
};

function getDefaultDeadlineValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 30);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDeadlineDiff(deadlineValue: string) {
  if (!deadlineValue) {
    return "";
  }

  const now = new Date();
  const deadlineDate = new Date(deadlineValue);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (Number.isNaN(deadlineDate.getTime()) || diffMs <= 0) {
    return "현재 시각보다 이후의 시간을 선택해주세요.";
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalMonths = Math.floor(totalDays / 30);

  if (totalMonths >= 1) {
    const remainDays = totalDays % 30;
    const remainHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (remainDays > 0) {
      if (remainHours > 0) {
        return `약 ${totalMonths}개월 ${remainDays}일 ${remainHours}시간 뒤에 투표가 종료됩니다.`;
      }
      return `약 ${totalMonths}개월 ${remainDays}일 뒤에 투표가 종료됩니다.`;
    }

    return `약 ${totalMonths}개월 뒤에 투표가 종료됩니다.`;
  }

  if (totalDays >= 1) {
    const remainHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (remainHours > 0) {
      return `약 ${totalDays}일 ${remainHours}시간 뒤에 투표가 종료됩니다.`;
    }

    return `약 ${totalDays}일 뒤에 투표가 종료됩니다.`;
  }

  if (totalHours >= 1) {
    const remainMinutes = totalMinutes % 60;

    if (remainMinutes > 0) {
      return `약 ${totalHours}시간 ${remainMinutes}분 뒤에 투표가 종료됩니다.`;
    }

    return `약 ${totalHours}시간 뒤에 투표가 종료됩니다.`;
  }

  return `약 ${totalMinutes}분 뒤에 투표가 종료됩니다.`;
}

export default function CreatePage() {
  const [meetingName, setMeetingName] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadlineValue());
  const [errors, setErrors] = useState<ErrorState>({});
  const [submitPreview, setSubmitPreview] = useState("");

  const deadlineGuideText = formatDeadlineDiff(deadline);

  function validateForm() {
    const nextErrors: ErrorState = {};

    if (meetingName.trim() === "") {
      nextErrors.meetingName = "모임 이름은 반드시 입력해야 합니다.";
    }

    if (deadline.trim() === "") {
      nextErrors.deadline = "마감 일시를 설정해주세요.";
    } else {
      const deadlineDate = new Date(deadline);

      if (Number.isNaN(deadlineDate.getTime())) {
        nextErrors.deadline = "올바른 마감 일시를 입력해주세요.";
      } else if (deadlineDate.getTime() <= Date.now()) {
        nextErrors.deadline = "마감 일시는 현재 시각보다 이후여야 합니다.";
      }
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitPreview("");
      return;
    }

    const payload = {
      title: meetingName.trim(),
      deadlineAt: new Date(deadline).toISOString(),
    };

    setSubmitPreview(JSON.stringify(payload, null, 2));

    // 실제 서버 연결 예시
    // const response = await fetch("/api/meetings", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    //
    // if (!response.ok) {
    //   throw new Error("모임 생성에 실패했습니다.");
    // }
    //
    // const data = await response.json();
    // router.push(`/meeting/${data.id}`);
  }

  return (
    <div className="app create-page">
      <Header />

      <main className="create-main">
        <section className="create-shell">
          <div className="create-page-heading">
            <p className="create-page-eyebrow">CREATE A MEET</p>
            <h1>
              모임을 만들고,
              <br />
              방 안에서 함께 장소를 모으세요
            </h1>
            <p className="create-page-description">
              지금은 모임 이름과 투표 마감 시간만 설정하면 됩니다.
              <br />
              후보 장소는 방이 생성된 뒤 참여자들과 함께 자유롭게 추가할 수 있습니다.
            </p>
          </div>

          <form className="create-form-card create-form-simple" onSubmit={handleSubmit}>
            <div className="create-form-row">
              <div className="create-form-group">
                <label htmlFor="meetingName">모임 이름</label>
                <input
                  id="meetingName"
                  type="text"
                  placeholder="예: 3학년 팀플 회의"
                  value={meetingName}
                  onChange={(event) => {
                    setMeetingName(event.target.value);
                    if (errors.meetingName) {
                      setErrors((prev) => ({ ...prev, meetingName: "" }));
                    }
                  }}
                />
                {errors.meetingName && (
                  <p className="create-error-text">{errors.meetingName}</p>
                )}
              </div>

              <div className="create-form-group">
                <label htmlFor="deadline">투표 마감 일시</label>
                <input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) => {
                    setDeadline(event.target.value);
                    if (errors.deadline) {
                      setErrors((prev) => ({ ...prev, deadline: "" }));
                    }
                  }}
                />
                <p className="create-help-text">{deadlineGuideText}</p>
                {errors.deadline && (
                  <p className="create-error-text">{errors.deadline}</p>
                )}
              </div>
            </div>

            <button type="submit" className="create-submit-button">
              모임 생성하기
            </button>

            <div className="create-notice-box">
              <p className="create-notice-title">생성 후에는 이렇게 진행됩니다</p>
              <ul className="create-notice-list">
                <li>방이 만들어지면 서버가 방 ID와 참여 코드를 생성합니다.</li>
                <li>참여자는 생성된 방 안에서 후보 장소를 추가하거나 투표할 수 있습니다.</li>
                <li>호스트와 팀원 모두 같은 방에서 최종 장소를 함께 정하게 됩니다.</li>
              </ul>
            </div>

            {submitPreview && (
              <div className="create-submit-preview">
                <p className="create-submit-preview-title">서버로 보낼 payload 예시</p>
                <pre>{submitPreview}</pre>
              </div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}