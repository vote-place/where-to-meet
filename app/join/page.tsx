"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import { getGroupByCode } from "../lib/api/groupApi";

type ErrorState = {
  joinCode?: string;
  submit?: string;
};

function normalizeJoinInput(value: string) {
  return value.trim();
}

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [joinCode, setJoinCode] = useState("");
  const [errors, setErrors] = useState<ErrorState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const codeFromUrl = useMemo(() => {
    return searchParams.get("code") ?? "";
  }, [searchParams]);

  useEffect(() => {
    if (!codeFromUrl) {
      return;
    }

    const normalized = normalizeJoinInput(codeFromUrl);
    setJoinCode(normalized);

    async function checkGroupFromUrl() {
      setIsSubmitting(true);

      try {
        const group = await getGroupByCode(normalized);

        if (!group) {
          setErrors({
            submit: "유효하지 않은 참여 코드입니다. 코드를 다시 확인해주세요.",
          });
          return;
        }

        router.replace(`/meeting/${group.code}`);
      } catch {
        setErrors({
          submit: "모임 정보를 확인하는 중 문제가 발생했습니다.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }

    checkGroupFromUrl();
  }, [codeFromUrl, router]);

  function validateForm() {
    const nextErrors: ErrorState = {};
    const normalized = normalizeJoinInput(joinCode);

    if (!normalized) {
      nextErrors.joinCode = "참여 코드를 입력해주세요.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const normalized = normalizeJoinInput(joinCode);
    setIsSubmitting(true);

    try {
      const group = await getGroupByCode(normalized);

      if (!group) {
        setErrors({
          submit: "유효하지 않은 참여 코드입니다. 코드를 다시 확인해주세요.",
        });
        return;
      }

      router.push(`/meeting/${group.code}`);
    } catch {
      setErrors({
        submit:
          "모임 정보를 확인하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="app join-page">
      <Header />

      <main className="join-main">
        <section className="join-shell">
          <div className="join-page-heading">
            <p className="join-page-eyebrow">JOIN A MEET</p>
            <h1>
              참여 코드를 입력하고
              <br />
              바로 모임에 들어가세요
            </h1>
            <p className="join-page-description">
              호스트가 공유한 참여 코드를 입력하면 해당 모임 페이지로 바로
              이동합니다. 초대 링크를 받은 경우에는 자동으로 코드가 채워질 수
              있습니다.
            </p>
          </div>

          <form className="join-form-card" onSubmit={handleSubmit}>
            <div className="join-form-group">
              <label htmlFor="joinCode">참여 코드</label>
              <input
                id="joinCode"
                type="text"
                inputMode="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="공유받은 참여 코드를 입력하세요"
                value={joinCode}
                onChange={(event) => {
                  setJoinCode(event.target.value);

                  if (errors.joinCode || errors.submit) {
                    setErrors((prev) => ({
                      ...prev,
                      joinCode: "",
                      submit: "",
                    }));
                  }
                }}
              />

              <p className="join-help-text">
                참여 코드는 공유받은 그대로 입력해주세요.
              </p>

              {errors.joinCode && (
                <p className="join-error-text">{errors.joinCode}</p>
              )}
            </div>

            <button
              type="submit"
              className="join-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "확인 중..." : "모임 참여하기"}
            </button>

            <div className="join-inline-note">
              참여에 성공하면 해당 모임의 meeting 페이지로 이동합니다.
            </div>

            {errors.submit && (
              <p className="join-error-text">{errors.submit}</p>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}

function JoinPageFallback() {
  return (
    <div className="app join-page">
      <Header />

      <main className="join-main">
        <section className="join-shell">
          <div className="join-page-heading">
            <p className="join-page-eyebrow">JOIN A MEET</p>
            <h1>
              참여 코드를 입력하고
              <br />
              바로 모임에 들어가세요
            </h1>
            <p className="join-page-description">참여 화면을 불러오는 중입니다.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinPageFallback />}>
      <JoinPageContent />
    </Suspense>
  );
}