import SetAccountDetailComponent from "../components/SetAccountDetail";

export default function SetAccountDetail() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-variant">
      {/* <Sidebar /> */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <SetAccountDetailComponent />
        </main>
      </div>
    </div>
  );
}
