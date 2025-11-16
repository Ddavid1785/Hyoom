export default function AppLogo() {
  return (
    <>
      <div className="fixed top-4 left-8 z-50 flex items-center gap-3">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-blue-500 animate-ping opacity-75" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight font-BricolageGrotesque">
          Hyoom
        </h1>
      </div>
    </>
  );
}
