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
  const [isFocused, setIsFocused] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && !showPassword ? "password" : "text";

  return (
    <div className="space-y-2">
      <label className="text-white text-sm font-medium flex items-center gap-2 font-Inter">
        {label}
        {required ? (
          <span className="text-red-400">*</span>
        ) : (
          <span className="text-zinc-500 text-xs font-normal">(Optional)</span>
        )}
      </label>

      <div className="relative">
        <input
          type={inputType}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 rounded-xl font-Inter
            bg-zinc-800/40 backdrop-blur-sm text-white
            border transition-all
            focus:outline-none pr-12
            placeholder-zinc-500
            ${isFocused 
              ? 'border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.2)]' 
              : 'border-zinc-700/50'
            }
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white hover:cursor-pointer transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {(helpText || helpLink) && (
        <p className="text-zinc-500 text-xs font-Inter">
          {helpText}{" "}
          {helpLink && (
            <a
              href={helpLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              {helpLink.text}
            </a>
          )}
        </p>
      )}
    </div>
  );
}