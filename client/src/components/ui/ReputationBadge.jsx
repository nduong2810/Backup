/**
 * ReputationBadge — hiển thị điểm reputation + rank icon SVG
 * Props:
 *   reputation: number
 *   size: 'sm' | 'md' | 'lg'
 *   showLabel: boolean — hiện tên rank
 */

// SVG icons cho từng rank — shield + lightning style
const RankIcons = {
  Newbie: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L10.5 5.5H14L11 8.5L12.5 13L8 10.5L3.5 13L5 8.5L2 5.5H5.5L8 1Z"
        fill="#9ca3af" stroke="#6b7280" strokeWidth="0.8" strokeLinejoin="round"/>
    </svg>
  ),
  Member: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L10.5 5.5H14L11 8.5L12.5 13L8 10.5L3.5 13L5 8.5L2 5.5H5.5L8 1Z"
        fill="#93c5fd" stroke="#3b82f6" strokeWidth="0.8" strokeLinejoin="round"/>
      <path d="M8 4L9.2 6.8H12L9.8 8.4L10.6 11L8 9.4L5.4 11L6.2 8.4L4 6.8H6.8L8 4Z"
        fill="#3b82f6"/>
    </svg>
  ),
  Contributor: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1L10.5 5.5H14L11 8.5L12.5 13L8 10.5L3.5 13L5 8.5L2 5.5H5.5L8 1Z"
        fill="#86efac" stroke="#16a34a" strokeWidth="0.8" strokeLinejoin="round"/>
      <path d="M6 8L7.5 9.5L10.5 6.5" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Trusted: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5L2 4V8.5C2 11.5 4.5 14 8 15C11.5 14 14 11.5 14 8.5V4L8 1.5Z"
        fill="#fde68a" stroke="#ca8a04" strokeWidth="0.8" strokeLinejoin="round"/>
      <path d="M5.5 8.5L7.2 10.2L10.5 6.5" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Expert: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5L2 4V8.5C2 11.5 4.5 14 8 15C11.5 14 14 11.5 14 8.5V4L8 1.5Z"
        fill="#fdba74" stroke="#ea580c" strokeWidth="0.8" strokeLinejoin="round"/>
      <path d="M8.5 4.5L6 8.5H8L7.5 11.5L10 7.5H8L8.5 4.5Z"
        fill="#c2410c" stroke="#c2410c" strokeWidth="0.3" strokeLinejoin="round"/>
    </svg>
  ),
  Elite: ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5L2 4V8.5C2 11.5 4.5 14 8 15C11.5 14 14 11.5 14 8.5V4L8 1.5Z"
        fill="#fca5a5" stroke="#dc2626" strokeWidth="0.8" strokeLinejoin="round"/>
      {/* Crown */}
      <path d="M4.5 10H11.5L10.5 6L8 8L8 5.5L5.5 6L4.5 10Z"
        fill="#991b1b" stroke="#991b1b" strokeWidth="0.2" strokeLinejoin="round"/>
      <circle cx="4.5" cy="6" r="0.8" fill="#ef4444"/>
      <circle cx="8" cy="5" r="0.8" fill="#ef4444"/>
      <circle cx="11.5" cy="6" r="0.8" fill="#ef4444"/>
    </svg>
  ),
};

const RANKS = [
  { name: 'Newbie',      minRep: 1,    color: '#4b5563', bg: '#f9fafb', border: '#d1d5db', textColor: '#374151' },
  { name: 'Member',      minRep: 50,   color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', textColor: '#1d4ed8' },
  { name: 'Contributor', minRep: 200,  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', textColor: '#15803d' },
  { name: 'Trusted',     minRep: 500,  color: '#ca8a04', bg: '#fefce8', border: '#fde68a', textColor: '#92400e' },
  { name: 'Expert',      minRep: 1000, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', textColor: '#c2410c' },
  { name: 'Elite',       minRep: 2000, color: '#dc2626', bg: '#fff1f2', border: '#fecaca', textColor: '#991b1b' },
];

export const getRankInfo = (reputation = 1) => {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (reputation >= rank.minRep) current = rank;
    else break;
  }
  const idx = RANKS.indexOf(current);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  return { ...current, next };
};

const SIZE_MAP = {
  sm: { icon: 13, px: 'px-1.5 py-0.5', text: 'text-[10px]', gap: 'gap-1' },
  md: { icon: 15, px: 'px-2 py-0.5',   text: 'text-xs',     gap: 'gap-1' },
  lg: { icon: 18, px: 'px-2.5 py-1',   text: 'text-sm',     gap: 'gap-1.5' },
};

export default function ReputationBadge({ reputation = 1, size = 'sm', showLabel = false }) {
  const rank = getRankInfo(reputation);
  const { icon: iconSize, px, text, gap } = SIZE_MAP[size] || SIZE_MAP.sm;
  const Icon = RankIcons[rank.name] || RankIcons.Newbie;

  return (
    <span
      className={`inline-flex items-center ${gap} rounded-full border font-semibold leading-none ${px}`}
      style={{ backgroundColor: rank.bg, borderColor: rank.border, color: rank.textColor }}
      title={`${rank.name} · ${reputation} điểm reputation`}
    >
      <Icon size={iconSize} />
      <span className={text}>{reputation}</span>
      {showLabel && <span className={`${text} font-medium`}>{rank.name}</span>}
    </span>
  );
}
