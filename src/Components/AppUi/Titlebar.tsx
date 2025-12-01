import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Square, Copy } from "lucide-react";

export default function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();

    const checkMaximized = async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();

    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleToggleMaximize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-10 flex items-center justify-end select-none z-200">
      <div data-tauri-drag-region className="absolute inset-0" />

      <div className="flex items-center gap-0.5 shrink-0 relative z-10 pr-2">
        <button
          onClick={handleMinimize}
          type="button"
          className="w-11 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 active:bg-white/10 transition-all duration-150 group cursor-pointer"
          style={{ pointerEvents: "auto" }}
        >
          <Minus
            size={14}
            className="text-zinc-400 group-hover:text-zinc-200 transition-colors"
          />
        </button>

        <button
          onClick={handleToggleMaximize}
          type="button"
          className="w-11 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 active:bg-white/10 transition-all duration-150 group cursor-pointer"
          style={{ pointerEvents: "auto" }}
        >
          {isMaximized ? (
            <Copy
              size={11}
              className="text-zinc-400 group-hover:text-zinc-200 transition-colors"
            />
          ) : (
            <Square
              size={11}
              className="text-zinc-400 group-hover:text-zinc-200 transition-colors"
            />
          )}
        </button>

        <button
          onClick={handleClose}
          type="button"
          className="w-11 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/15 active:bg-red-500/25 transition-all duration-150 group cursor-pointer"
          style={{ pointerEvents: "auto" }}
        >
          <X
            size={14}
            className="text-zinc-400 group-hover:text-red-400 transition-colors"
          />
        </button>
      </div>
    </div>
  );
}
