import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SettingsInputFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "password";
  required?: boolean;
  helpText?: string;
  helpLink?: {
    text: string;
    url: string;
  };
}

export default function SettingsInputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  helpText,
  helpLink,
}: SettingsInputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && !showPassword ? "password" : "text";

  return (
    <div className="space-y-2">
      <label className="text-white text-sm font-medium flex items-center gap-2">
        {label}
        {required ? (
          <span className="text-red-400">*</span>
        ) : (
          <span className="text-zinc-500 text-xs">(Optional)</span>
        )}
      </label>

      <div className="relative">
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all pr-12"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white hover:cursor-pointer transition-colors"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {(helpText || helpLink) && (
        <p className="text-zinc-500 text-xs">
          {helpText}{" "}
          {helpLink && (
            <a
              href={helpLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {helpLink.text}
            </a>
          )}
        </p>
      )}
    </div>
  );
}
