import RegisterComponent from "../components/Register";

export default function Register() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-variant">
      {/* <Sidebar /> */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* <Header onNewImport={() => {}} /> */}
        <main className="flex-1 overflow-y-auto p-6">
          <RegisterComponent />
        </main>
      </div>
    </div>
  );
}
