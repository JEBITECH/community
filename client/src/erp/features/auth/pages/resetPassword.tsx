import ResetPasswordComponent from "../components/ResetPassword";

export default function ResetPassword() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-variant">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <ResetPasswordComponent />
        </main>
      </div>
    </div>
  );
}
