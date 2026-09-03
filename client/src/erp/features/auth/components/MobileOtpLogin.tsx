import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRequestOtpMutation, useVerifyOtpMutation } from "../hooks/useAuthMutation";

/**
 * Member OTP login.
 *
 * NOTE: switched from phone/SMS OTP to email OTP. Legacy phone lines are kept
 * inline as comments; the component/file name is unchanged to limit churn.
 */
export default function MobileOtpLogin() {
  const navigate = useNavigate();
  // LEGACY (SMS): const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  // LEGACY (SMS): const [step, setStep] = useState<"phone" | "otp">("phone");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const requestOtpMutation = useRequestOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();

  const handleSendOtp = () => {
    if (!email.trim()) return;
    requestOtpMutation.mutate(
      // LEGACY (SMS): { phone: phone.trim() },
      { email: email.trim() },
      {
        onSuccess: (data) => {
          setStep("otp");
          setDevOtp(data.debug_otp ?? null);
        },
      }
    );
  };

  const handleVerify = () => {
    if (code.length !== 6) return;
    verifyOtpMutation.mutate(
      // LEGACY (SMS): { phone: phone.trim(), code },
      { email: email.trim(), code },
      {
        onSuccess: (data) => {
          if (data.isNewUser) {
            navigate(`/join?token=${encodeURIComponent(data.otpVerifiedToken)}`);
          }
        },
      }
    );
  };

  if (step === "email") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Email Address</label>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>
        <Button
          type="button"
          shape="pill"
          className="w-full"
          disabled={!email.trim() || requestOtpMutation.isPending}
          onClick={handleSendOtp}
        >
          {requestOtpMutation.isPending ? "Sending..." : "Send OTP"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground">Enter the 6-digit code</label>
        <p className="text-sm text-muted-foreground mb-2">Sent to {email}</p>
        {devOtp && (
          <p className="text-xs text-amber-600 mb-2">Dev mode — code: {devOtp}</p>
        )}
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        type="button"
        shape="pill"
        className="w-full"
        disabled={code.length !== 6 || verifyOtpMutation.isPending}
        onClick={handleVerify}
      >
        {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Continue"}
      </Button>
      <div className="flex justify-between text-sm">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            setStep("email");
            setCode("");
          }}
        >
          Change email
        </button>
        <button
          type="button"
          className="text-primary hover:underline"
          disabled={requestOtpMutation.isPending}
          onClick={handleSendOtp}
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
}
