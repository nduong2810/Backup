export default function SaveIconButton({
  saved = false,
  onClick,
  disabled = false,
  size = 20,
  className = '',
  title,
  showLabel = true,
}) {
  const buttonText = saved ? 'Đã lưu' : 'Lưu';
  const buttonTitle = title || buttonText;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={buttonTitle}
      aria-label={buttonTitle}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 justify-center rounded-DEFAULT border border-outline-variant px-2 py-1 hover:bg-surface-container-low transition-colors ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={saved ? 'text-primary' : 'text-slate-500'}
      >
        <path d="M6 4.5h12a1 1 0 0 1 1 1V20l-7-4-7 4V5.5a1 1 0 0 1 1-1z" />
      </svg>
      {showLabel && (
        <span className="text-xs font-semibold text-on-surface">
          {buttonText}
        </span>
      )}
    </button>
  );
}
