"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

type ErrorState = {
  meetingName?: string;
  deadline?: string;
  submit?: string;
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
  const router = useRouter();

  const [meetingName, setMeetingName] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadlineValue());
  const [errors, setErrors] = useState<ErrorState>({});
  const [submitPreview, setSubmitPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "모임 생성에 실패했습니다."
        );
      }

      const data = await response.json();

      router.push(`/meeting/${data.roomId}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";

      setErrors((prev) => ({
        ...prev,
        submit: message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app create-page">
      <Header />

      <main className="create-main">
        <section className="create-shell">
          <div className="create-page-heading">
            <p className="create-page-eyebrow">CREATE A MEET</p>
            <h1>
              먼저 방을 만들고,
              <br />
              그 안에서 장소를 정하세요
            </h1>
            <p className="create-page-description">
              지금은 모임 이름과 마감 시간만 정하면 됩니다.
              생성된 방 안에서 참여자들과 함께 후보 장소를 모으고 투표를 시작할 수 있습니다.
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
                    if (errors.meetingName || errors.submit) {
                      setErrors((prev) => ({
                        ...prev,
                        meetingName: "",
                        submit: "",
                      }));
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
                    if (errors.deadline || errors.submit) {
                      setErrors((prev) => ({
                        ...prev,
                        deadline: "",
                        submit: "",
                      }));
                    }
                  }}
                />
                <p className="create-help-text">{deadlineGuideText}</p>
                {errors.deadline && (
                  <p className="create-error-text">{errors.deadline}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="create-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "생성 중..." : "모임 생성하기"}
            </button>

            <div className="create-inline-note">
              생성 후 서버가 방 ID와 참여 코드를 만들고, 바로 방 안에서 후보 장소를 추가할 수 있습니다.
            </div>

            {errors.submit && (
              <p className="create-error-text">{errors.submit}</p>
            )}

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