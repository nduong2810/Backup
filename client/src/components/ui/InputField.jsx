import { useState } from 'react';

export default function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  maxLength,
  required = false,
  disabled = false,
  allowPasswordToggle = false,
  inputClassName = '',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const canTogglePassword = allowPasswordToggle && isPasswordField;
  const inputType = canTogglePassword && showPassword ? 'text' : type;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          type={inputType}
          maxLength={maxLength}
          required={required}
          disabled={disabled}
          className={`h-12 w-full rounded-xl border bg-white px-4 text-sm font-medium text-slate-900 shadow-sm shadow-slate-200/30 placeholder:text-slate-400 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${canTogglePassword ? 'pr-16' : ''} ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-300 focus:border-primary focus:ring-primary/10'} ${inputClassName}`}
        />
        {canTogglePassword && (
          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            className="absolute inset-y-0 right-3 text-xs font-medium text-slate-500 hover:text-slate-700 focus:outline-none"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? 'Ẩn' : 'Hiện'}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}
