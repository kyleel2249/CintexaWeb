import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CustomerRole } from "@cintexa/db/schema";
import { ROLE_INTEREST_OPTIONS, ROLE_META, ROLE_ORDER, USAGE_FREQUENCY_OPTIONS } from "@/lib/roles";
import { useUpdateProfile } from "@/hooks/useApi";
import { ApiError } from "@/lib/api";
import { useMotion } from "@/components/motion/MotionProvider";

const STEP_LABELS = ["Role", "Interests", "Frequency"];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<CustomerRole | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<(typeof USAGE_FREQUENCY_OPTIONS)[number] | null>(null);
  const updateProfile = useUpdateProfile();
  const { allowMotion } = useMotion();

  function toggleInterest(interest: string) {
    setInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]));
  }

  function handleRoleSelect(nextRole: CustomerRole) {
    setRole(nextRole);
    setInterests([]);
    setStep(1);
  }

  function handleSubmit() {
    if (!role || !frequency) return;
    updateProfile.mutate({ role, interests, usageFrequency: frequency });
  }

  return (
    <div className="cx-section !pt-10">
      <div className="cx-container flex justify-center">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center justify-center gap-2">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
                  style={{
                    background: i <= step ? "hsl(var(--accent))" : "hsl(var(--bg-inset))",
                    color: i <= step ? "hsl(var(--accent-ink))" : "hsl(var(--fg-muted))",
                  }}
                >
                  {i + 1}
                </span>
                <span className="hidden text-xs text-[hsl(var(--fg-muted))] sm:inline">{label}</span>
                {i < STEP_LABELS.length - 1 && <span className="h-px w-6 bg-[hsl(var(--border))]" />}
              </div>
            ))}
          </div>

          <AnimatePresence>
            {step === 0 && (
              <motion.div
                key="role"
                initial={allowMotion ? { opacity: 0, x: 16 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={allowMotion ? { opacity: 0, x: -16 } : undefined}
                transition={{ duration: 0.25 }}
              >
                <p className="cx-eyebrow text-center">Let's tailor your dashboard</p>
                <h1 className="cx-display mt-2 text-center text-2xl">What best describes you?</h1>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {ROLE_ORDER.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className="cx-card cx-card-interactive border-t-2 text-left"
                      style={{ borderTopColor: `hsl(var(--${ROLE_META[r].color}))` }}
                    >
                      <h3 className="cx-display text-lg">{ROLE_META[r].label}</h3>
                      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">{ROLE_META[r].blurb}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 1 && role && (
              <motion.div
                key="interests"
                initial={allowMotion ? { opacity: 0, x: 16 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={allowMotion ? { opacity: 0, x: -16 } : undefined}
                transition={{ duration: 0.25 }}
              >
                <p className="cx-eyebrow text-center">As a {ROLE_META[role].label.toLowerCase()}</p>
                <h1 className="cx-display mt-2 text-center text-2xl">What are you most interested in?</h1>
                <p className="mt-2 text-center text-sm text-[hsl(var(--fg-muted))]">Pick as many as apply.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {ROLE_INTEREST_OPTIONS[role].map((interest) => {
                    const selected = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className="cx-badge cx-btn-sm"
                        style={
                          selected
                            ? { background: "hsl(var(--accent) / 0.15)", color: "hsl(var(--accent))", borderColor: "hsl(var(--accent) / .4)" }
                            : undefined
                        }
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 flex justify-between">
                  <button className="cx-btn cx-btn-ghost" onClick={() => setStep(0)}>
                    Back
                  </button>
                  <button className="cx-btn cx-btn-primary" onClick={() => setStep(2)} disabled={interests.length === 0}>
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="frequency"
                initial={allowMotion ? { opacity: 0, x: 16 } : false}
                animate={{ opacity: 1, x: 0 }}
                exit={allowMotion ? { opacity: 0, x: -16 } : undefined}
                transition={{ duration: 0.25 }}
              >
                <p className="cx-eyebrow text-center">Last thing</p>
                <h1 className="cx-display mt-2 text-center text-2xl">How often do you plan to use CINTEXA?</h1>
                <div className="mt-6 flex flex-col gap-2">
                  {USAGE_FREQUENCY_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFrequency(f)}
                      className="cx-card cx-card-interactive text-left"
                      style={frequency === f ? { borderColor: "hsl(var(--accent) / .6)" } : undefined}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="mt-8 flex justify-between">
                  <button className="cx-btn cx-btn-ghost" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button
                    className="cx-btn cx-btn-primary"
                    onClick={handleSubmit}
                    disabled={!frequency || updateProfile.isPending}
                  >
                    {updateProfile.isPending ? "Setting up…" : "Go to my dashboard"}
                  </button>
                </div>
                {updateProfile.isError && (
                  <p className="mt-3 text-center text-sm" style={{ color: "hsl(var(--danger))" }}>
                    {updateProfile.error instanceof ApiError ? updateProfile.error.message : "Couldn't save — try again."}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
