import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useRequestOtpMutation, useVerifyOtpMutation } from "../hooks/useAuthMutation";

export default function MobileOtpLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const requestOtpMutation = useRequestOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();

  const handleSendOtp = () => {
    if (!phone.trim()) return;
    requestOtpMutation.mutate(
      { phone: phone.trim() },
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
      { phone: phone.trim(), code },
      {
        onSuccess: (data) => {
          if (data.isNewUser) {
            navigate(`/join?token=${encodeURIComponent(data.otpVerifiedToken)}`);
          }
        },
      }
    );
  };

  if (step === "phone") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Mobile Number</label>
          <Input
            type="tel"
            placeholder="Enter your mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoFocus
          />
        </div>
        <Button
          type="button"
          shape="pill"
          className="w-full"
          disabled={!phone.trim() || requestOtpMutation.isPending}
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
        <p className="text-sm text-muted-foreground mb-2">Sent to {phone}</p>
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
            setStep("phone");
            setCode("");
          }}
        >
          Change number
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
