"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  AlertCircle,
  Ship,
  Shield,
  Anchor,
  Compass,
  ArrowLeft,
  Sun,
  Moon,
  Sparkles,
  FileText,
  MapPin,
  Building2,
  Waves,
  Image as ImageIcon,
  KeyRound,
  X,
} from "lucide-react";
import { AnimatedGradient } from "@/components/ui/animated-gradient";
import { CloudeeAvatar, type TargetOverride } from "@/components/avatar/CloudeeAvatar";
import { CloudeeStudioDrawer } from "@/components/avatar/CloudeeStudioDrawer";
import { GlassButton, ZapIcon } from "@/components/ui/glass-button";
import { FishyButton } from "@/components/ui/fishy-button";

// ── Data & Types ──

type AuthMode = "login" | "register";
type LoginMethod = "phone" | "email";
type ThemeMode = "light" | "dark";

export interface RoleConfig {
  id: string;
  title: string;
  icon: any;
  nameLabel: string;
  namePlaceholder: string;
  field1Label: string;
  field1Placeholder: string;
  field1Icon: any;
  field2Label: string;
  field2Placeholder: string;
  field2Icon: any;
  isEmailRequired: boolean;
  emailLabel: string;
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  fisher: {
    id: "fisher",
    title: "Marine Fisher",
    icon: Ship,
    nameLabel: "Vessel Master Name",
    namePlaceholder: "e.g., Rajesh Barman",
    field1Label: "Boat Registration Number",
    field1Placeholder: "e.g., IND-WB-02-MM-4491",
    field1Icon: FileText,
    field2Label: "Home Port / Fishing Zone",
    field2Placeholder: "e.g., Paradip Harbour / Zone 4",
    field2Icon: MapPin,
    isEmailRequired: false,
    emailLabel: "Official Email (Optional)",
  },
  authority: {
    id: "authority",
    title: "Coast Guard",
    icon: Shield,
    nameLabel: "Full Legal / Officer Name",
    namePlaceholder: "e.g., Cmdr. Vikram Sen",
    field1Label: "Service ID / Battalion Number",
    field1Placeholder: "e.g., ICG-OPS-7729",
    field1Icon: ShieldCheck,
    field2Label: "Base / Station",
    field2Placeholder: "e.g., Haldia Station / District 7",
    field2Icon: MapPin,
    isEmailRequired: true,
    emailLabel: "Official Email (Institutional)",
  },
  port: {
    id: "port",
    title: "Port Operator",
    icon: Anchor,
    nameLabel: "Full Legal / Officer Name",
    namePlaceholder: "e.g., Ananya Deshmukh",
    field1Label: "Port Authority ID",
    field1Placeholder: "e.g., JNPT-AUTH-1092",
    field1Icon: FileText,
    field2Label: "Port Name / Location",
    field2Placeholder: "e.g., Jawaharlal Nehru Port Trust (JNPT)",
    field2Icon: Building2,
    isEmailRequired: true,
    emailLabel: "Official Email (Institutional)",
  },
  researcher: {
    id: "researcher",
    title: "Marine Scientist",
    icon: Compass,
    nameLabel: "Full Legal / Scientist Name",
    namePlaceholder: "e.g., Dr. Priya Nair",
    field1Label: "Institution / Organization",
    field1Placeholder: "e.g., INCOIS / CMFRI / NIO",
    field1Icon: Building2,
    field2Label: "Research / Employee ID",
    field2Placeholder: "e.g., RES-NIO-8834",
    field2Icon: FileText,
    isEmailRequired: true,
    emailLabel: "Official Email (Institutional)",
  },
};

const ROLES = [
  { id: "fisher", title: "Marine Fisher", icon: Ship },
  { id: "authority", title: "Coast Guard", icon: Shield },
  { id: "port", title: "Port Operator", icon: Anchor },
  { id: "researcher", title: "Marine Scientist", icon: Compass },
];

export interface AuthSectionOneProps {
  initialMode?: AuthMode;
}

export default function AuthSectionOne({ initialMode = "login" }: AuthSectionOneProps) {
  const router = useRouter();
  // Theme state: defaults to light (matches user's reference image 1)
  const [theme, setTheme] = useState<ThemeMode>("light");

  // Form states
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [manualAvatarTarget, setManualAvatarTarget] = useState<TargetOverride>(null);
  // Right visual stage background mode: "waves" (Image 2 fluid wave), "underwater" (seascape photo), or "hybrid"
  const [rightStageBg, setRightStageBg] = useState<"waves" | "underwater" | "hybrid">("waves");

  // Forgot Password / Passcode Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotContact, setForgotContact] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("fisher");

  // Dynamic role-specific inputs map
  const [roleInputs, setRoleInputs] = useState<Record<string, { field1: string; field2: string }>>({
    fisher: { field1: "", field2: "" },
    authority: { field1: "", field2: "" },
    port: { field1: "", field2: "" },
    researcher: { field1: "", field2: "" },
  });

  const handleRoleInputChange = (roleId: string, field: "field1" | "field2", val: string) => {
    setRoleInputs((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: val,
      },
    }));
  };

  const activeRole = ROLE_CONFIGS[role] || ROLE_CONFIGS.fisher;
  const Field1Icon = activeRole.field1Icon;
  const Field2Icon = activeRole.field2Icon;

  const [phone, setPhone] = useState("98765 43210");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Viewport scroll detection for overflowing form content
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      setCanScrollDown(scrollHeight - scrollTop - clientHeight > 16);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 80);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [mode, method, role, errorMessage, successMessage, otpSent]);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Expression override for Kirby:
  // Error -> angry-brows (RED)
  // OTP active/focused -> uneasy-left (BLUE)
  const kirbyExpression = errorMessage
    ? "angry-brows"
    : isOtpFocused || (mode === "login" && method === "phone" && otpSent)
    ? "uneasy-left"
    : null;

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  // Handle OTP input navigation & mobile SMS autofill
  const handleOtpChange = (index: number, val: string) => {
    // If mobile OS SMS autofill or paste inserts multiple digits into one field
    const digits = val.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < 6; i++) {
        if (index + i < 6 && digits[i]) {
          next[index + i] = digits[i];
        }
      }
      setOtp(next);
      const targetIndex = Math.min(index + digits.length, 5);
      otpInputsRef.current[targetIndex]?.focus();
      return;
    }

    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < 5) otpInputsRef.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setOtp(next);
    const targetIndex = Math.min(pasted.length, 5);
    otpInputsRef.current[targetIndex]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Form submission & validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === "login" && method === "phone" && !otpSent) {
      if (phone.replace(/\D/g, "").length < 10) {
        setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setOtpSent(true);
        setResendTimer(30);
        setIsOtpFocused(true);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      }, 700);
      return;
    }

    if (mode === "login" && method === "phone" && otpSent) {
      const fullOtp = otp.join("");
      if (fullOtp.length < 6) {
        setErrorMessage("Please enter the complete 6-digit OTP.");
        return;
      }
    }

    if (mode === "login" && method === "email") {
      if (!email.includes("@")) {
        setErrorMessage("Please enter a valid registered email address.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Passcode must be at least 6 characters.");
        return;
      }
    }

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMessage(`Please provide your ${activeRole.nameLabel.toLowerCase()}.`);
        return;
      }
      const currentRoleInputs = roleInputs[role] || { field1: "", field2: "" };
      if (!currentRoleInputs.field1.trim()) {
        setErrorMessage(`Please enter your ${activeRole.field1Label}.`);
        return;
      }
      if (!currentRoleInputs.field2.trim()) {
        setErrorMessage(`Please enter your ${activeRole.field2Label}.`);
        return;
      }
      if (phone.replace(/\D/g, "").length < 10) {
        setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      if (activeRole.isEmailRequired) {
        if (!email.trim() || !email.includes("@")) {
          setErrorMessage(`${activeRole.title} registration requires an official institutional email address.`);
          return;
        }
      } else if (email.trim() && !email.includes("@")) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Master passcode must be at least 6 characters.");
        return;
      }
    }

    setIsLoading(true);
    // Role-specific structured metadata
    const roleMetadata = {
      role,
      roleTitle: activeRole.title,
      [activeRole.field1Label]: roleInputs[role]?.field1 || "",
      [activeRole.field2Label]: roleInputs[role]?.field2 || "",
    };
    if (process.env.NODE_ENV !== "production") {
      console.log("Registration payload:", {
        name,
        phone,
        email: email || undefined,
        role,
        roleMetadata,
      });
    }

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(
        mode === "register"
          ? "Account registered! Initializing dashboard..."
          : "Identity verified! Welcome aboard."
      );
      setTimeout(() => {
        router.push("/app");
      }, 900);
    }, 1200);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotContact.trim()) {
      setForgotError("Please enter your registered mobile number or email.");
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotSuccess(false);
        setMode("login");
        setMethod("phone");
        setSuccessMessage("Recovery instructions sent! You can now verify with your OTP.");
      }, 1400);
    }, 900);
  };

  const isLight = theme === "light";

  // Authentic Neomorphic + Oceanic Depth Tokens (Chiseled 3D Light & Dark Physics)
  const s = {
    // Outer canvas background: deep oceanic void in dark mode to maximize card elevation contrast
    pageBg: isLight
      ? "bg-[#eaf0f6]"
      : "bg-[#03070e] bg-gradient-to-br from-[#02050b] via-[#040913] to-[#010307]",

    // Left Card: Tactile neomorphic elevation with top specular rim-light & cyan underglow
    card: isLight
      ? "shadow-[-12px_-12px_28px_rgba(255,255,255,0.9),14px_14px_32px_rgba(160,185,210,0.55)] border border-white/80 text-[#1a2638]"
      : "shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_45px_rgba(6,182,212,0.15),inset_0_1px_1.5px_rgba(255,255,255,0.18)] border-t border-t-cyan-400/35 border-x border-x-cyan-500/15 border-b border-b-black/80 text-white",

    // Card Surface Overlay: keeps underwater scene visible while providing the tactile neomorphic foundation
    cardOverlay: isLight
      ? "bg-gradient-to-b from-[#f0f6fb]/78 via-[#e6f1f8]/70 to-[#d8eaf4]/75 backdrop-blur-[2px]"
      : "bg-gradient-to-b from-[#0f1926]/85 via-[#09111c]/88 to-[#050b12]/92 backdrop-blur-[3px]",

    // ISRO Badge: glowing beveled pill
    isroBadge: isLight
      ? "bg-[#d8f5f0] text-[#0f766e] border border-[#a3ede3]/80 shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(180,195,215,0.4)]"
      : "bg-gradient-to-b from-[#0e2c38] to-[#061a22] text-[#2dd4bf] border-t border-t-cyan-300/50 border-x border-x-cyan-500/20 border-b border-b-black/70 shadow-[0_0_16px_rgba(20,184,166,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]",

    // Headings
    heading: isLight ? "text-[#111d2e]" : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]",
    subheading: isLight ? "text-[#5a6e85]" : "text-slate-300",
    label: isLight ? "text-[#5a6e85]" : "text-slate-300 font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]",

    // Mode Switch Track (carved recessed groove with dark cavity & bottom highlight lip)
    modeTrack: isLight
      ? "bg-[#e2ebf4]/90 shadow-[inset_2px_2px_5px_rgba(180,195,215,0.7),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/40"
      : "bg-[#050912] shadow-[inset_3px_3px_8px_rgba(0,0,0,0.95),inset_-1.5px_-1.5px_4px_rgba(56,189,248,0.1)] border-t border-t-black/95 border-x border-x-black/70 border-b border-b-cyan-400/20 ring-1 ring-white/5",

    // Active Mode Tab (extruded tactile button pushing forward with top specular highlight & glow)
    activeModeTab: isLight
      ? "bg-gradient-to-r from-[#d1f7f2] to-[#bbf1eb] text-[#0f766e] shadow-[-2px_-2px_6px_rgba(255,255,255,0.95),2px_2px_6px_rgba(14,140,130,0.25)] border border-white/60 font-bold"
      : "bg-gradient-to-b from-[#18535a] via-[#0e3b43] to-[#08272d] text-[#38e8cb] border-t border-t-cyan-300/60 border-x border-x-cyan-500/25 border-b border-b-black/80 shadow-[0_4px_16px_rgba(6,182,212,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.6)] font-bold",

    // Inactive Mode Tab
    inactiveModeTab: isLight
      ? "text-[#5a6e85] hover:text-[#111d2e]"
      : "text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all",

    // Dynamic Role Inactive Pill
    dialectInactive: isLight
      ? "bg-[#eef4f9]/90 text-[#334155] shadow-[-2px_-2px_5px_rgba(255,255,255,0.95),2px_2px_5px_rgba(180,195,215,0.5)] hover:shadow-[-3px_-3px_7px_rgba(255,255,255,1),3px_3px_7px_rgba(180,195,215,0.6)] border border-white/40"
      : "bg-[#070d18] text-slate-300 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-1px_-1px_2px_rgba(255,255,255,0.05)] border-t border-t-black/90 border-b border-b-white/10 hover:text-white transition-all",

    // Dynamic Role Active Pill
    dialectActive: isLight
      ? "bg-gradient-to-br from-[#c4f5ee] to-[#a7ede4] text-[#0d6b63] shadow-[0_0_12px_rgba(45,212,191,0.4),-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(14,140,130,0.3)] border border-[#7ae3cb] font-bold"
      : "bg-gradient-to-b from-[#15464c] to-[#09252a] text-[#38e8cb] border-t border-t-cyan-300/50 border-x border-x-cyan-500/25 border-b border-b-black/80 shadow-[0_0_20px_rgba(20,184,166,0.45),inset_0_1.5px_1px_rgba(255,255,255,0.25)] font-bold",

    // Auth Method Switch Track (deeply routed groove)
    methodTrack: isLight
      ? "bg-[#e2ebf4]/90 shadow-[inset_2px_2px_5px_rgba(180,195,215,0.7),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] border border-white/40"
      : "bg-[#050912] shadow-[inset_3px_3px_8px_rgba(0,0,0,0.95),inset_-1.5px_-1.5px_4px_rgba(56,189,248,0.1)] border-t border-t-black/95 border-x border-x-black/70 border-b border-b-cyan-400/20 ring-1 ring-white/5",

    // Auth Method Active Pill (extruded tactile button)
    methodActive: isLight
      ? "bg-gradient-to-r from-[#d2f6f2] to-[#bdf1ec] text-[#0f766e] border border-[#99e6dc] shadow-[-2px_-2px_5px_rgba(255,255,255,0.9),2px_2px_5px_rgba(14,140,130,0.2)] font-bold"
      : "bg-gradient-to-b from-[#18535a] via-[#0e3b43] to-[#08272d] text-[#38e8cb] border-t border-t-cyan-300/60 border-x border-x-cyan-500/25 border-b border-b-black/80 shadow-[0_4px_16px_rgba(6,182,212,0.4),inset_0_1.5px_1px_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.6)] font-bold",

    // Auth Method Inactive Pill
    methodInactive: isLight
      ? "text-[#5a6e85] hover:text-[#111d2e]"
      : "text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all",

    // Recessed Input Well (deeply carved obsidian cavity with dark top shadow & light bottom lip)
    inputWell: isLight
      ? "bg-[#e2ebf4]/90 text-[#0f172a] shadow-[inset_2.5px_2.5px_5px_rgba(180,195,215,0.75),inset_-2.5px_-2.5px_5px_rgba(255,255,255,0.95)] border border-white/40"
      : "bg-[#050912] text-[#f1f5f9] shadow-[inset_3.5px_3.5px_9px_rgba(0,0,0,0.98),inset_-1.5px_-1.5px_5px_rgba(56,189,248,0.12)] border-t border-t-black/95 border-x border-x-black/70 border-b border-b-cyan-400/20 ring-1 ring-white/5",

    // Phone Country Code prefix
    prefixBadge: isLight
      ? "text-[#334155] border-r border-[#cbd8e6]"
      : "text-cyan-200/90 border-r border-cyan-400/20 font-bold",

    // Theme Switch: raised tactile dial
    themeSwitch: isLight
      ? "bg-[#e2ebf4] shadow-[inset_2px_2px_4px_rgba(180,195,215,0.6),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-[#0a1622]"
      : "bg-gradient-to-b from-[#182536] to-[#0c141f] border-t border-t-white/20 border-x border-x-white/5 border-b border-b-black/90 shadow-[2px_4px_10px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] text-amber-400 hover:text-amber-300",

    // Overview Return Button: ultra-dark in light mode, luminous cyan in dark mode
    overviewBtn: isLight
      ? "text-[#05111d] hover:text-black font-extrabold"
      : "text-cyan-300 hover:text-white font-bold drop-shadow-[0_1px_4px_rgba(6,182,212,0.4)]",
  };

  return (
    <section
      className={`min-h-[100dvh] w-full ${s.pageBg} antialiased [font-synthesis:none] flex items-center justify-center p-0 sm:p-4 md:p-6 transition-colors duration-500 overflow-y-auto lg:overflow-hidden relative`}
    >
      {/* Scoped CSS for smooth authentication card scrollbar */}
      <style jsx global>{`
        .auth-form-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .auth-form-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .auth-form-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.35);
          border-radius: 9999px;
        }
        .auth-form-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.6);
        }
      `}</style>

      {/* ── Main Two-Card Layout ── */}
      <div className="grid w-full max-w-[1380px] min-h-[100dvh] sm:min-h-0 sm:h-full lg:h-[min(94dvh,840px)] gap-4 sm:gap-6 lg:grid-cols-[1fr_1.1fr] my-auto">
        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── Left Column: Master Neomorphic Authentication Card ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div
          className={`relative flex flex-col rounded-none sm:rounded-[32px] overflow-hidden min-h-[100dvh] sm:min-h-0 max-h-none sm:max-h-[100dvh] lg:max-h-full ${s.card} transition-all duration-500`}
        >
          {/* ── Underwater Seascape Photo Backdrop Layer (Image 2) ── */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
            <img
              src="/images/underwater-backdrop.jpg"
              alt="ORCA Underwater Seascape Backdrop"
              className="w-full h-full object-cover object-bottom scale-[1.02] transform-gpu"
            />
            {/* Frosted Glass Overlay: soft translucent veil to ensure pristine readability while showing sunbeams and corals */}
            <div className={`absolute inset-0 transition-colors duration-500 ${s.cardOverlay}`} />
          </div>

          {/* Scrollable Container with Custom Responsive Scroll Strategy & Mobile Safe Area Insets */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="auth-form-scrollbar relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:p-8 lg:p-10 flex flex-col scroll-smooth select-none pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.75rem,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto w-full max-w-[460px] space-y-3.5 sm:space-y-4 my-auto py-1 sm:py-2">
            {/* ── Top Bar: Return Link + Badge + Mobile Studio + Theme Switch ── */}
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className={`inline-flex items-center gap-1.5 text-xs tracking-wider py-2 px-1.5 -ml-1 touch-manipulation active:opacity-60 transition-colors ${s.overviewBtn}`}
              >
                <ArrowLeft className="size-3.5 stroke-[2.5]" />
                <span>OVERVIEW</span>
              </Link>

              <div className="flex items-center gap-2">
                {/* ISRO × INCOIS Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider ${s.isroBadge} transition-all duration-300`}
                >
                  <ShieldCheck className="size-3.5" />
                  <span>ISRO × INCOIS</span>
                </div>

                {/* Mobile Studio Drawer Trigger: allows phone users to explore animations & expressions */}
                <button
                  type="button"
                  onClick={() => setIsStudioOpen((prev) => !prev)}
                  className={`lg:hidden size-8 rounded-full ${s.themeSwitch} flex items-center justify-center transition-all duration-300 cursor-pointer touch-manipulation active:scale-90`}
                  title="Explore 23 Animations & 28 Expressions"
                  aria-label="Avatar Studio"
                >
                  <ZapIcon className="size-3.5 text-amber-400 drop-shadow" />
                </button>

                {/* Light / Dark Mode Toggle with touch-friendly 32px size */}
                <button
                  type="button"
                  onClick={() => setTheme(isLight ? "dark" : "light")}
                  className={`size-8 rounded-full ${s.themeSwitch} flex items-center justify-center transition-all duration-300 cursor-pointer touch-manipulation active:scale-90`}
                  title={isLight ? "Switch to Abyss Dark Mode" : "Switch to Cyan Light Mode"}
                  aria-label="Toggle Theme"
                >
                  {isLight ? (
                    <Moon className="size-3.5 text-[#0a1622] hover:text-black" />
                  ) : (
                    <Sun className="size-3.5 text-amber-400 fill-amber-400" />
                  )}
                </button>
              </div>
            </div>

            {/* ── Headline & Mobile Cloudee Avatar (scales dynamically, reacts to mobile typing) ── */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className={`text-xl sm:text-2xl md:text-[28px] font-extrabold tracking-tight ${s.heading}`}>
                  {mode === "login" ? "Sign in to ORCA" : "Create an Account"}
                </h1>
                {mode === "register" && (
                  <p className={`text-xs mt-0.5 ${s.subheading}`}>
                    Coastal Operator Verification
                  </p>
                )}
              </div>

              {/* Mobile Live Reactive Cloudee Avatar (hidden on desktop where full column is active) */}
              <div className="lg:hidden shrink-0 relative flex items-center justify-center">
                <div className="absolute inset-0 -m-2 rounded-full bg-cyan-400/20 blur-md pointer-events-none animate-pulse" />
                <CloudeeAvatar
                  size={72}
                  manualTarget={manualAvatarTarget}
                  isPasswordFocused={isPasswordFocused}
                  isPasswordVisible={showPassword}
                  focusedFieldName={focusedField}
                  errorMessage={errorMessage}
                  successMessage={successMessage}
                  expressionOverride={kirbyExpression}
                  accentColor="#06b6d4"
                />
              </div>
            </div>

            {/* ── Mode Switch: Sign In vs Create Account ── */}
            <div className={`flex rounded-2xl p-1 ${s.modeTrack} text-xs font-semibold`}>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all duration-300 cursor-pointer touch-manipulation active:scale-[0.98] ${
                  mode === "login" ? s.activeModeTab : s.inactiveModeTab
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all duration-300 cursor-pointer touch-manipulation active:scale-[0.98] ${
                  mode === "register" ? s.activeModeTab : s.inactiveModeTab
                }`}
              >
                Create Account
              </button>
            </div>

            {/* ── Error & Success Banners ── */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium"
                >
                  <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-medium"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Form Body ── */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* REGISTER MODE: Role Selection */}
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className={`block text-[10px] font-mono uppercase tracking-wider font-bold ${s.label}`}>
                    Select Operator Role
                  </label>
                    <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => {
                      const RoleIcon = r.icon;
                      const isSelected = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer touch-manipulation active:scale-[0.98] min-h-[48px] ${
                            isSelected ? s.dialectActive : s.dialectInactive
                          }`}
                        >
                          <RoleIcon className="size-4 shrink-0 text-teal-500 dark:text-teal-300" />
                          <span className="text-xs font-bold leading-tight">{r.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* REGISTER MODE: Full Legal Name */}
              {mode === "register" && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${s.label}`}>
                    {activeRole.nameLabel}
                  </label>
                  <div className={`relative flex items-center rounded-xl px-3 py-2.5 min-h-[48px] ${s.inputWell}`}>
                    <User className="size-4 shrink-0 mr-2.5 opacity-60" />
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      autoCapitalize="words"
                      autoCorrect="off"
                      spellCheck={false}
                      value={name}
                      onChange={(e) => {
                        setErrorMessage(null);
                        setName(e.target.value);
                      }}
                      onFocus={() => {
                        setIsPasswordFocused(false);
                        setFocusedField("name");
                      }}
                      onBlur={() => {
                        setFocusedField(null);
                        if (mode === "register" && !name.trim()) {
                          setErrorMessage(`Please provide your ${activeRole.nameLabel.toLowerCase()}.`);
                        }
                      }}
                      placeholder={activeRole.namePlaceholder}
                      className="w-full bg-transparent text-base sm:text-sm outline-none font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* LOGIN MODE: Auth Method Toggle */}
              {mode === "login" && (
                <div className={`grid grid-cols-2 gap-1 rounded-2xl p-1 ${s.methodTrack}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod("phone");
                      setOtpSent(false);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer touch-manipulation active:scale-[0.98] min-h-[44px] ${
                      method === "phone" ? s.methodActive : s.methodInactive
                    }`}
                  >
                    <Phone className="size-3.5" />
                    <span>Phone OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("email")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer touch-manipulation active:scale-[0.98] min-h-[44px] ${
                      method === "email" ? s.methodActive : s.methodInactive
                    }`}
                  >
                    <Mail className="size-3.5" />
                    <span>Email Password</span>
                  </button>
                </div>
              )}

              {/* Phone Input */}
              {(method === "phone" || mode === "register") && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${s.label}`}>
                    Mobile Number
                  </label>
                  <div className={`relative flex items-center rounded-xl overflow-hidden px-1 py-1 min-h-[48px] ${s.inputWell}`}>
                    <span className={`flex items-center px-3 py-1.5 text-xs font-mono font-bold ${s.prefixBadge}`}>
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      pattern="[0-9]*"
                      value={phone}
                      onChange={(e) => {
                        setErrorMessage(null);
                        setPhone(e.target.value);
                      }}
                      onFocus={() => {
                        setIsPasswordFocused(false);
                        setFocusedField("phone");
                      }}
                      onBlur={() => {
                        setFocusedField(null);
                        if (phone && phone.replace(/\D/g, "").length < 10) {
                          setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
                        }
                      }}
                      placeholder="98765 43210"
                      maxLength={11}
                      required
                      className="w-full bg-transparent px-3 py-1.5 text-base sm:text-sm outline-none font-mono font-bold tracking-wider placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* REGISTER MODE: Dynamic Role Middle Fields (Swaps smoothly on role change) */}
              {mode === "register" && (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={role}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="space-y-3.5"
                  >
                    {/* Dynamic Role Field 1 */}
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${s.label}`}>
                        {activeRole.field1Label}
                      </label>
                      <div className={`relative flex items-center rounded-xl px-3 py-2.5 min-h-[48px] ${s.inputWell}`}>
                        <Field1Icon className="size-4 shrink-0 mr-2.5 opacity-60" />
                        <input
                          type="text"
                          required
                          autoCapitalize="characters"
                          autoCorrect="off"
                          spellCheck={false}
                          value={roleInputs[role]?.field1 || ""}
                          onChange={(e) => {
                            setErrorMessage(null);
                            handleRoleInputChange(role, "field1", e.target.value);
                          }}
                          onFocus={() => {
                            setIsPasswordFocused(false);
                            setFocusedField(`role-${role}-field1`);
                          }}
                          onBlur={() => setFocusedField(null)}
                          placeholder={activeRole.field1Placeholder}
                          className="w-full bg-transparent text-base sm:text-sm outline-none font-medium placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>
                    </div>

                    {/* Dynamic Role Field 2 */}
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${s.label}`}>
                        {activeRole.field2Label}
                      </label>
                      <div className={`relative flex items-center rounded-xl px-3 py-2.5 min-h-[48px] ${s.inputWell}`}>
                        <Field2Icon className="size-4 shrink-0 mr-2.5 opacity-60" />
                        <input
                          type="text"
                          required
                          autoCapitalize="words"
                          autoCorrect="off"
                          value={roleInputs[role]?.field2 || ""}
                          onChange={(e) => {
                            setErrorMessage(null);
                            handleRoleInputChange(role, "field2", e.target.value);
                          }}
                          onFocus={() => {
                            setIsPasswordFocused(false);
                            setFocusedField(`role-${role}-field2`);
                          }}
                          onBlur={() => setFocusedField(null)}
                          placeholder={activeRole.field2Placeholder}
                          className="w-full bg-transparent text-base sm:text-sm outline-none font-medium placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Email Input */}
              {(method === "email" || mode === "register") && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${s.label}`}>
                    {mode === "register" ? activeRole.emailLabel : "Registered Email Address"}
                  </label>
                  <div className={`relative flex items-center rounded-xl px-3 py-2.5 min-h-[48px] ${s.inputWell}`}>
                    <Mail className="size-4 shrink-0 mr-2.5 opacity-60" />
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={email}
                      onChange={(e) => {
                        setErrorMessage(null);
                        setEmail(e.target.value);
                      }}
                      onFocus={() => {
                        setIsPasswordFocused(false);
                        setFocusedField("email");
                      }}
                      onBlur={() => {
                        setFocusedField(null);
                        if (email && !email.includes("@")) {
                          setErrorMessage("Please enter a valid registered email address.");
                        } else if (mode === "register" && activeRole.isEmailRequired && !email.trim()) {
                          setErrorMessage(`${activeRole.title} registration requires an official institutional email address.`);
                        }
                      }}
                      placeholder={
                        mode === "register"
                          ? activeRole.isEmailRequired
                            ? "officer@domain.gov.in"
                            : "vesselmaster@domain.com (optional)"
                          : "operator@coastal.gov.in"
                      }
                      required={method === "email" || (mode === "register" && activeRole.isEmailRequired)}
                      className="w-full bg-transparent text-base sm:text-sm outline-none font-medium placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>
                </div>
              )}

              {/* Password Input */}
              {(method === "email" || mode === "register") && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${s.label}`}>
                    {mode === "register" ? "Set Master Passcode" : "Account Passcode"}
                  </label>
                  <div className={`relative flex items-center rounded-xl px-3 py-2.5 min-h-[48px] ${s.inputWell}`}>
                    <Lock className="size-4 shrink-0 mr-2.5 opacity-60" />
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      autoCapitalize="none"
                      autoCorrect="off"
                      value={password}
                      onChange={(e) => {
                        setErrorMessage(null);
                        setPassword(e.target.value);
                      }}
                      onFocus={() => {
                        setIsPasswordFocused(true);
                        setFocusedField("password");
                      }}
                      onBlur={() => {
                        setIsPasswordFocused(false);
                        setFocusedField(null);
                        if (password && password.length < 6) {
                          setErrorMessage("Passcode must be at least 6 characters.");
                        }
                      }}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-transparent text-base sm:text-sm outline-none font-mono placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword((p) => !p)}
                      className="ml-2 p-1.5 -mr-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer touch-manipulation active:scale-90"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>

                  {/* Forgot Password Clickable Text */}
                  <div className="flex justify-end mt-1.5 px-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotContact(phone || email || "");
                        setForgotError(null);
                        setForgotSuccess(false);
                        setShowForgotModal(true);
                      }}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors cursor-pointer hover:underline touch-manipulation active:opacity-70"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              {/* OTP Input (when OTP is sent) */}
              {mode === "login" && method === "phone" && otpSent && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className={`block text-xs font-semibold ${s.label}`}>Enter 6-digit OTP</label>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">
                      Sent to +91 {phone}
                    </span>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpInputsRef.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={1}
                        value={digit}
                        onPaste={handleOtpPaste}
                        onFocus={() => {
                          setIsOtpFocused(true);
                          setIsPasswordFocused(false);
                          setFocusedField("otp");
                          setErrorMessage(null);
                        }}
                        onBlur={() => {
                          setIsOtpFocused(false);
                          setFocusedField(null);
                        }}
                        onChange={(e) => {
                          setErrorMessage(null);
                          handleOtpChange(i, e.target.value);
                        }}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`size-10 sm:size-11 rounded-xl text-center text-xl sm:text-lg font-mono font-bold outline-none touch-manipulation ${s.inputWell}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-center">
                    {resendTimer > 0 ? (
                      <span className={`text-[11px] ${s.label}`}>Resend in {resendTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setResendTimer(30);
                          setErrorMessage(null);
                        }}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-300 hover:underline cursor-pointer py-1 px-2 touch-manipulation active:scale-95"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* FishyButton: Submit CTA for Send OTP, Sign In, and Create Account */}
              <div className="mt-4 w-full flex justify-center dark:drop-shadow-[0_4px_22px_rgba(20,184,166,0.35)]">
                <FishyButton
                  type="submit"
                  disabled={isLoading}
                  className="button--orca w-full touch-manipulation active:scale-[0.99] font-bold tracking-wider uppercase text-sm"
                  width="100%"
                  height="52px"
                  borderRadius="16px"
                  fontFamily="inherit"
                  fishSpeed="2.3s"
                >
                  {isLoading
                    ? "PROCESSING..."
                    : successMessage
                    ? "✓ VERIFIED"
                    : mode === "login"
                    ? method === "phone" && !otpSent
                      ? "SEND OTP"
                      : "SIGN IN"
                    : "CREATE ACCOUNT"}
                </FishyButton>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Scroll-Fade Cue: Subtle gradient + indicator when content overflows */}
        <AnimatePresence>
          {canScrollDown && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-none absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t ${
                isLight
                  ? "from-[#e2ebf4]/90 via-[#e2ebf4]/60 to-transparent"
                  : "from-[#050912]/95 via-[#050912]/70 to-transparent"
              } rounded-b-none sm:rounded-b-[32px] flex items-end justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] z-20`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-teal-600 dark:text-teal-300 font-bold bg-white/80 dark:bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-teal-500/30 shadow-md">
                <span>Scroll for more</span>
                <span className="animate-bounce">↓</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* ── Right Column: Visual Stage with Fluid Wave & Kirby Avatar ── */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="relative hidden lg:flex overflow-hidden rounded-[32px] bg-[#0284c7] shadow-2xl border border-white/20 dark:border-t-cyan-400/35 dark:border-x-cyan-500/15 dark:border-b-black/80 dark:shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_45px_rgba(6,182,212,0.15)]">
          {/* Underwater Seascape Backdrop Layer (active when rightStageBg is "underwater" or "hybrid") */}
          {(rightStageBg === "underwater" || rightStageBg === "hybrid") && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
              <img
                src="/images/underwater-backdrop.jpg"
                alt="Underwater Seascape Backdrop"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-sky-950/20 mix-blend-multiply" />
            </div>
          )}

          {/* Animated Oceanic Fluid Wave Gradient (active when rightStageBg is "waves" [Image 2 default] or "hybrid") */}
          {(rightStageBg === "waves" || rightStageBg === "hybrid") && (
            <AnimatedGradient
              config={{ preset: "Oceanic" }}
              className={`absolute inset-0 ${rightStageBg === "hybrid" ? "opacity-75 mix-blend-screen" : ""}`}
            />
          )}

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-8 sm:p-10 select-none">
            {/* Top Header with Glass Lightning Button & Scenic Stage Switcher */}
            <div className="w-full flex items-center justify-between z-20">
              <GlassButton
                size="icon"
                onClick={() => setIsStudioOpen((prev) => !prev)}
                title="Explore 23 Animations & 28 Expressions"
              >
                <ZapIcon className="h-5 w-5 text-amber-300 drop-shadow" />
              </GlassButton>

              {/* Backdrop Mode Switcher for the Right Stage */}
              <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md border border-white/20 p-1 rounded-full shadow-lg">
                <button
                  type="button"
                  onClick={() => setRightStageBg("waves")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    rightStageBg === "waves"
                      ? "bg-white/30 text-white font-bold shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                  title="Oceanic Silk Waves (Default)"
                >
                  Waves
                </button>
                <button
                  type="button"
                  onClick={() => setRightStageBg("underwater")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    rightStageBg === "underwater"
                      ? "bg-white/30 text-white font-bold shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                  title="Underwater Coral Seascape"
                >
                  Lagoon
                </button>
                <button
                  type="button"
                  onClick={() => setRightStageBg("hybrid")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    rightStageBg === "hybrid"
                      ? "bg-white/30 text-white font-bold shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                  title="Hybrid: Waves + Underwater Seascape"
                >
                  Hybrid
                </button>
              </div>
            </div>

            {/* Cloudee Avatar Centered with high presence */}
            <div className="my-auto flex flex-col items-center justify-center relative">
              {/* Studio Active Badge if override is active */}
              {manualAvatarTarget && (
                <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-cyan-400/50 text-[11px] font-mono font-bold text-cyan-200 shadow-xl z-20">
                  <span>
                    {manualAvatarTarget.kind === "animation" ? "▶" : "✦"}{" "}
                    {manualAvatarTarget.key}
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualAvatarTarget(null)}
                    className="ml-1 text-white/50 hover:text-white cursor-pointer text-xs font-bold"
                    title="Reset to Live Auto"
                  >
                    ×
                  </button>
                </div>
              )}

              <CloudeeAvatar
                size={420}
                manualTarget={manualAvatarTarget}
                isPasswordFocused={isPasswordFocused}
                isPasswordVisible={showPassword}
                focusedFieldName={focusedField}
                errorMessage={errorMessage}
                successMessage={successMessage}
                expressionOverride={kirbyExpression}
                accentColor="#06b6d4"
              />
            </div>

            {/* Cloudee Studio Drawer for all 23 animations & 28 expressions */}
            <CloudeeStudioDrawer
              isOpen={isStudioOpen}
              onClose={() => setIsStudioOpen(false)}
              currentTarget={manualAvatarTarget}
              onSelectTarget={(target) => {
                setManualAvatarTarget(target);
              }}
              theme={theme}
            />
          </div>
        </div>
      </div>

      {/* ── Forgot Password / Passcode Recovery Modal ── */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForgotModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-3xl p-6 relative ${
                isLight
                  ? "bg-[#eef3f8] border border-white/90 shadow-2xl text-[#1a2638]"
                  : "bg-[#060c16] border border-cyan-500/30 shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_45px_rgba(6,182,212,0.2)] text-white"
              }`}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="size-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">Reset Passcode</h2>
                  <p className="text-xs opacity-70">Maritime Operator Recovery Protocol</p>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 mb-4">
                Enter your registered mobile number or official institutional email address. We will dispatch a secure one-time verification code to restore account access.
              </p>

              {forgotError && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>✓ Verification code dispatched! Switching to sign in...</span>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${s.label}`}>
                      Mobile Number or Official Email
                    </label>
                    <div className={`relative flex items-center rounded-xl px-3 py-2.5 min-h-[48px] ${s.inputWell}`}>
                      <Mail className="size-4 shrink-0 mr-2.5 opacity-60" />
                      <input
                        type="text"
                        autoFocus
                        required
                        value={forgotContact}
                        onChange={(e) => {
                          setForgotError(null);
                          setForgotContact(e.target.value);
                        }}
                        placeholder="e.g. 9876543210 or officer@incois.gov.in"
                        className="w-full bg-transparent text-sm outline-none font-medium placeholder-slate-400 dark:placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        isLight ? "hover:bg-slate-200 text-slate-700" : "hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {forgotLoading ? "Sending..." : "Send Recovery Code"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
