import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  color?: string;
  glow?: boolean;
}

// 1. Target & Savings Goal Icon
export const IconTargetGoal: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', glow = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'filter drop-shadow-[0_0_6px_rgba(124,92,255,0.6)]' : ''}`}
    {...props}
  >
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeDasharray="3 3" />
    <circle cx="12" cy="12" r="5.5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2" fill={color} />
    <path d="M12 2V4M12 20V22M2 12H4M20 12H22" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

// 2. Bank Safe & Deposit Account Icon
export const IconBankDeposit: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', glow = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'filter drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]' : ''}`}
    {...props}
  >
    <rect x="3" y="4" width="18" height="16" rx="3" stroke={color} strokeWidth="1.75" />
    <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.75" />
    <path d="M12 8.5V9.5M12 14.5V15.5M8.5 12H9.5M14.5 12H15.5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="17.5" cy="7.5" r="1" fill={color} />
    <path d="M3 18H21" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
  </svg>
);

// 3. Percent & Yield Growth Icon
export const IconYieldPercent: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="7" cy="7" r="2.5" stroke={color} strokeWidth="1.75" />
    <circle cx="17" cy="17" r="2.5" stroke={color} strokeWidth="1.75" />
    <path d="M19 5L5 19" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M13 5H19V11" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
  </svg>
);

// 4. Wallet & Capital Balance Icon
export const IconWalletCapital: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.75" />
    <path d="M3 9H21" stroke={color} strokeWidth="1.5" opacity="0.4" />
    <rect x="14" y="10.5" width="7" height="5" rx="1.5" fill="#14151c" stroke={color} strokeWidth="1.5" />
    <circle cx="17.5" cy="13" r="1" fill={color} />
  </svg>
);

// 5. Day Work Shift Icon (Refined Sun Rays)
export const IconDayShift: React.FC<IconProps> = ({ size = 16, className = '', color = '#f59e0b', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.75" fill={`${color}20`} />
    <path d="M12 2V4.5M12 19.5V22M2 12H4.5M19.5 12H22M4.9 4.9L6.7 6.7M17.3 17.3L19.1 19.1M4.9 19.1L6.7 17.3M17.3 6.7L19.1 4.9" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

// 6. Night Work Shift Icon (Geometric Crescent)
export const IconNightShift: React.FC<IconProps> = ({ size = 16, className = '', color = '#38bdf8', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path
      d="M20.5 14.5C19.2 18.5 15.2 21.2 10.9 20.7C6.6 20.2 3.2 16.7 2.8 12.4C2.3 8.1 5 4.1 9 2.8C8 4.6 7.8 6.8 8.4 8.9C9.2 11.5 11.4 13.5 14 14.1C16.1 14.6 18.4 14.2 20.5 14.5Z"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={`${color}20`}
    />
    <circle cx="17.5" cy="5.5" r="1" fill={color} />
    <circle cx="19.5" cy="9.5" r="0.75" fill={color} />
  </svg>
);

// 7. Full 24h Shift Icon (Clock Mechanism)
export const IconFullShift: React.FC<IconProps> = ({ size = 16, className = '', color = '#8b5cf6', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.75" />
    <path d="M12 6.5V12L15.5 14" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2.5L4 5.5M16 2.5L20 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// 8. Overtime / Side Hustle Bolt Icon
export const IconOvertimeShift: React.FC<IconProps> = ({ size = 16, className = '', color = '#ec4899', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M13 2L4 13.5H11.5L10 22L19.5 10H12.5L13 2Z" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill={`${color}20`} />
  </svg>
);

// 9. Day Off / Relax Coffee Cup Icon
export const IconDayOff: React.FC<IconProps> = ({ size = 16, className = '', color = '#94a3b8', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M18 8H4V14C4 16.8 6.2 19 9 19H13C15.8 19 18 16.8 18 14V8Z" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M18 9H19.5C20.9 9 22 10.1 22 11.5C22 12.9 20.9 14 19.5 14H18" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M3 21H19" stroke={color} strokeWidth="1.75" strokeLinecap="round" opacity="0.5" />
    <path d="M8 3V5M12 3V5M16 3V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 10. Vacation & Travel Icon
export const IconVacation: React.FC<IconProps> = ({ size = 16, className = '', color = '#10b981', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 3L15 10H21L16.5 14L18.5 21L12 17L5.5 21L7.5 14L3 10H9L12 3Z" stroke={color} strokeWidth="1.75" strokeLinejoin="round" fill={`${color}20`} />
  </svg>
);

// 11. Grooming & Barber Shears Icon
export const IconGrooming: React.FC<IconProps> = ({ size = 16, className = '', color = '#ec4899', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="6" cy="6" r="3" stroke={color} strokeWidth="1.75" />
    <circle cx="6" cy="18" r="3" stroke={color} strokeWidth="1.75" />
    <path d="M8.5 8.5L19 19M8.5 15.5L19 5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1" fill={color} />
  </svg>
);

// 12. 3D Neural Cortex Cube Icon
export const IconNeural3D: React.FC<IconProps> = ({ size = 16, className = '', color = '#7c5cff', glow = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'filter drop-shadow-[0_0_6px_rgba(124,92,255,0.6)]' : ''}`}
    {...props}
  >
    <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M12 22V12M12 12L20.5 7M12 12L3.5 7" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2" fill={color} />
    <circle cx="12" cy="2" r="1.5" fill={color} />
    <circle cx="20.5" cy="7" r="1.5" fill={color} />
    <circle cx="20.5" cy="17" r="1.5" fill={color} />
    <circle cx="12" cy="22" r="1.5" fill={color} />
    <circle cx="3.5" cy="17" r="1.5" fill={color} />
    <circle cx="3.5" cy="7" r="1.5" fill={color} />
  </svg>
);

// 13. Interactive 2D Graph Icon
export const IconGraph2D: React.FC<IconProps> = ({ size = 16, className = '', color = '#7c5cff', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="6" cy="18" r="3" stroke={color} strokeWidth="1.75" fill={`${color}20`} />
    <circle cx="18" cy="6" r="3" stroke={color} strokeWidth="1.75" fill={`${color}20`} />
    <circle cx="18" cy="18" r="3" stroke={color} strokeWidth="1.75" fill={`${color}20`} />
    <path d="M8.5 16.5L15.5 8.5M8.8 18H15.2" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

// 14. Excel-Like Clean Spreadsheet Table Icon
export const IconExcelTable: React.FC<IconProps> = ({ size = 16, className = '', color = '#38bdf8', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.75" />
    <path d="M3 9H21M3 15H21M9 4V20M15 4V20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <circle cx="6" cy="6.5" r="1" fill={color} />
  </svg>
);

// 15. Smart Math Sigma Icon
export const IconMathSigma: React.FC<IconProps> = ({ size = 16, className = '', color = '#10b981', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M18 5H6L12 12L6 19H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 16. Sticky Note Sticker Icon
export const IconStickyNote: React.FC<IconProps> = ({ size = 16, className = '', color = '#f59e0b', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M15 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9L15 3Z" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 3V9H21" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 13H13M7 17H17" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// 17. Clear Canvas Icon (Bulk Broom / Clean)
export const IconClearCanvas: React.FC<IconProps> = ({ size = 16, className = '', color = '#f43f5e', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
  </svg>
);

// 18. IDE Left Panel Toggle Icon (Photo 4)
export const IconPanelLeft: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.75" />
    <path d="M9 4V20" stroke={color} strokeWidth="1.75" />
    <rect x="4.5" y="5.5" width="3" height="13" rx="1" fill={color} opacity="0.3" />
  </svg>
);

// 19. IDE Right Panel Toggle Icon (Photo 4)
export const IconPanelRight: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.75" />
    <path d="M15 4V20" stroke={color} strokeWidth="1.75" />
    <rect x="16.5" y="5.5" width="3" height="13" rx="1" fill={color} opacity="0.3" />
  </svg>
);

// 20. IDE Bottom Panel Toggle Icon (Photo 4)
export const IconPanelBottom: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.75" />
    <path d="M3 15H21" stroke={color} strokeWidth="1.75" />
    <rect x="4.5" y="16.5" width="15" height="2" rx="0.5" fill={color} opacity="0.3" />
  </svg>
);

// 21. User Manual / Guide Book Icon
export const IconBookGuide: React.FC<IconProps> = ({ size = 16, className = '', color = '#7c5cff', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M4 19.5V4.5C4 3.7 4.7 3 5.5 3H18.5C19.3 3 20 3.7 20 4.5V19.5C20 20.3 19.3 21 18.5 21H5.5C4.7 21 4 20.3 4 19.5Z" stroke={color} strokeWidth="1.75" />
    <path d="M4 17.5C4 16.7 4.7 16 5.5 16H20" stroke={color} strokeWidth="1.75" />
    <path d="M8 7H16M8 11H13" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
  </svg>
);

// 22. Theme Palette Icon
export const IconThemePalette: React.FC<IconProps> = ({ size = 16, className = '', color = '#f59e0b', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C13.1 22 14 21.1 14 20C14 19.5 13.8 19 13.4 18.6C13 18.2 12.8 17.7 12.8 17.2C12.8 16.1 13.7 15.2 14.8 15.2H16C19.3 15.2 22 12.5 22 9.2C22 5.2 17.5 2 12 2Z" stroke={color} strokeWidth="1.75" />
    <circle cx="7.5" cy="11.5" r="1.5" fill="#f43f5e" />
    <circle cx="10.5" cy="7.5" r="1.5" fill="#f59e0b" />
    <circle cx="15.5" cy="7.5" r="1.5" fill="#10b981" />
    <circle cx="18.5" cy="11.5" r="1.5" fill="#38bdf8" />
  </svg>
);

// 23. File Explorer Folder Icon
export const IconExplorerFolder: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7H12L10 4H5C3.9 4 3 4.9 3 6V7Z" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
  </svg>
);

// 24. Search Spotlight Lens Icon
export const IconSearchSpotlight: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.75" />
    <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
  </svg>
);

// 25. Bookmark Ribbon Icon
export const IconBookmarkRibbon: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M5 4C5 3.4 5.4 3 6 3H18C18.6 3 19 3.4 19 4V21L12 17L5 21V4Z" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
  </svg>
);

// 26. AI Neural Copilot Icon
export const IconAICopilot: React.FC<IconProps> = ({ size = 16, className = '', color = '#7c5cff', glow = false, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${glow ? 'filter drop-shadow-[0_0_6px_rgba(124,92,255,0.6)]' : ''}`} {...props}>
    <rect x="4" y="5" width="16" height="14" rx="4" stroke={color} strokeWidth="1.75" />
    <circle cx="9" cy="11" r="1.5" fill={color} />
    <circle cx="15" cy="11" r="1.5" fill={color} />
    <path d="M9 15H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 2V5M2 12H4M20 12H22" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

// 27. Spaced Repetition Graduation Quiz Icon
export const IconSpacedQuiz: React.FC<IconProps> = ({ size = 16, className = '', color = '#f59e0b', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M22 10L12 5L2 10L12 15L22 10Z" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M6 12.5V17C6 18.5 8.7 20 12 20C15.3 20 18 18.5 18 17V12.5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M22 10V16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 28. P2P Direct Wireless Sync Icon
export const IconP2PWireless: React.FC<IconProps> = ({ size = 16, className = '', color = '#10b981', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <path d="M5 12.5C7 10.5 9.5 9.5 12 9.5C14.5 9.5 17 10.5 19 12.5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <path d="M2 9.5C5 6.5 8.5 5 12 5C15.5 5 19 6.5 22 9.5" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="2" fill={color} />
  </svg>
);

// 29. Settings Precision Gear Icon
export const IconSettingsGear: React.FC<IconProps> = ({ size = 16, className = '', color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.75" />
    <path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.9 4.9L6.3 6.3M17.7 17.7L19.1 19.1M4.9 19.1L6.3 17.7M17.7 6.3L19.1 4.9" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

// 30. CheckSquare List Icon
export const IconCheckListSquare: React.FC<IconProps> = ({ size = 16, className = '', color = '#10b981', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="1.75" />
    <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 31. Sparkles Insight Callout Icon
export const IconInsightSpark: React.FC<IconProps> = ({ size = 16, className = '', color = '#7c5cff', glow = false, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} ${glow ? 'filter drop-shadow-[0_0_6px_rgba(124,92,255,0.6)]' : ''}`} {...props}>
    <path d="M12 2L14.2 9.8L22 12L14.2 14.2L12 22L9.8 14.2L2 12L9.8 9.8L12 2Z" stroke={color} strokeWidth="1.75" strokeLinejoin="round" fill={`${color}20`} />
  </svg>
);

// 32. NotebookLM Atomic Orbital Research Hub Icon
export const IconNotebookLM: React.FC<IconProps> = ({ size = 16, className = '', color = '#38bdf8', glow = false, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${glow ? 'filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]' : ''}`}
    {...props}
  >
    {/* 3 Interlocking Orbital Ellipses */}
    <ellipse cx="12" cy="12" rx="4.2" ry="8.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" transform="rotate(30 12 12)" />
    <ellipse cx="12" cy="12" rx="4.2" ry="8.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" transform="rotate(90 12 12)" />
    <ellipse cx="12" cy="12" rx="4.2" ry="8.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" transform="rotate(150 12 12)" />

    {/* Central Core Nucleus */}
    <circle cx="12" cy="12" r="1.6" fill={color} />

    {/* 3 Orbital Synaptic Node Dots */}
    <circle cx="12" cy="3.6" r="1.3" fill={color} />
    <circle cx="19.4" cy="16.3" r="1.3" fill={color} />
    <circle cx="4.6" cy="16.3" r="1.3" fill={color} />
  </svg>
);

