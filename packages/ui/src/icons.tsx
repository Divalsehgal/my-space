import type { ComponentType } from "react";
import type { IconProps as PhosphorIconProps, IconWeight } from "@phosphor-icons/react";
// Per-icon deep imports keep the bundle to exactly the icons used. The SSR
// build has no React context, so these work in server and client components.
import { ArrowClockwiseIcon as PhosphorArrowClockwise } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { ArrowRightIcon as PhosphorArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowUpRightIcon as PhosphorArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { ArticleIcon as PhosphorArticle } from "@phosphor-icons/react/dist/ssr/Article";
import { BriefcaseIcon as PhosphorBriefcase } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { CaretDownIcon as PhosphorCaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretLeftIcon as PhosphorCaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRightIcon as PhosphorCaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretUpIcon as PhosphorCaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp";
import { CheckIcon as PhosphorCheck } from "@phosphor-icons/react/dist/ssr/Check";
import { CloudIcon as PhosphorCloud } from "@phosphor-icons/react/dist/ssr/Cloud";
import { CopyIcon as PhosphorCopy } from "@phosphor-icons/react/dist/ssr/Copy";
import { DatabaseIcon as PhosphorDatabase } from "@phosphor-icons/react/dist/ssr/Database";
import { EyeIcon as PhosphorEye } from "@phosphor-icons/react/dist/ssr/Eye";
import { FileTextIcon as PhosphorFileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { GameControllerIcon as PhosphorGameController } from "@phosphor-icons/react/dist/ssr/GameController";
import { GithubLogoIcon as PhosphorGithubLogo } from "@phosphor-icons/react/dist/ssr/GithubLogo";
import { GlobeIcon as PhosphorGlobe } from "@phosphor-icons/react/dist/ssr/Globe";
import { HardDrivesIcon as PhosphorHardDrives } from "@phosphor-icons/react/dist/ssr/HardDrives";
import { HouseIcon as PhosphorHouse } from "@phosphor-icons/react/dist/ssr/House";
import { InfoIcon as PhosphorInfo } from "@phosphor-icons/react/dist/ssr/Info";
import { InstagramLogoIcon as PhosphorInstagramLogo } from "@phosphor-icons/react/dist/ssr/InstagramLogo";
import { LightningIcon as PhosphorLightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { LinkedinLogoIcon as PhosphorLinkedinLogo } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import { ListIcon as PhosphorList } from "@phosphor-icons/react/dist/ssr/List";
import { MagnifyingGlassIcon as PhosphorMagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { SparkleIcon as PhosphorSparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { MoonIcon as PhosphorMoon } from "@phosphor-icons/react/dist/ssr/Moon";
import { SquaresFourIcon as PhosphorSquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { SunIcon as PhosphorSun } from "@phosphor-icons/react/dist/ssr/Sun";
import { TerminalWindowIcon as PhosphorTerminalWindow } from "@phosphor-icons/react/dist/ssr/TerminalWindow";
import { WarningCircleIcon as PhosphorWarningCircle } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { XIcon as PhosphorX } from "@phosphor-icons/react/dist/ssr/X";

/** Same size scale as the icon set it replaced: relative to the surrounding text. */
const SIZES = { inherit: "1em", small: "1.25em", medium: "1.5em", large: "2.1875em" } as const;

export type IconProps = Omit<PhosphorIconProps, "size"> & {
  fontSize?: keyof typeof SIZES;
};

function makeIcon(Phosphor: ComponentType<PhosphorIconProps>, name: string, weight: IconWeight = "regular") {
  function Icon({ fontSize = "medium", ...props }: IconProps) {
    // Decorative by default; pass aria-label (and aria-hidden={false}) to expose one.
    return (
      <Phosphor
        size={SIZES[fontSize]}
        weight={weight}
        aria-hidden="true"
        focusable="false"
        data-testid={name}
        {...props}
      />
    );
  }
  Icon.displayName = name;
  return Icon;
}

export const ArrowForwardIcon = makeIcon(PhosphorArrowRight, "ArrowForwardIcon", "bold");
export const ArrowOutwardIcon = makeIcon(PhosphorArrowUpRight, "ArrowOutwardIcon", "bold");
export const ArticleIcon = makeIcon(PhosphorArticle, "ArticleIcon");
export const BoltIcon = makeIcon(PhosphorLightning, "BoltIcon", "fill");
export const CheckIcon = makeIcon(PhosphorCheck, "CheckIcon", "bold");
export const ChevronLeftIcon = makeIcon(PhosphorCaretLeft, "ChevronLeftIcon", "bold");
export const ChevronRightIcon = makeIcon(PhosphorCaretRight, "ChevronRightIcon", "bold");
export const CloseIcon = makeIcon(PhosphorX, "CloseIcon", "bold");
export const CloudIcon = makeIcon(PhosphorCloud, "CloudIcon", "fill");
export const CopyIcon = makeIcon(PhosphorCopy, "CopyIcon");
export const DarkModeIcon = makeIcon(PhosphorMoon, "DarkModeIcon", "fill");
export const DescriptionIcon = makeIcon(PhosphorFileText, "DescriptionIcon", "fill");
export const DnsIcon = makeIcon(PhosphorHardDrives, "DnsIcon", "fill");
export const ErrorIcon = makeIcon(PhosphorWarningCircle, "ErrorIcon");
export const GameIcon = makeIcon(PhosphorGameController, "GameIcon", "fill");
export const GitHubIcon = makeIcon(PhosphorGithubLogo, "GitHubIcon", "fill");
export const HomeIcon = makeIcon(PhosphorHouse, "HomeIcon", "fill");
export const InfoIcon = makeIcon(PhosphorInfo, "InfoIcon");
export const InstagramIcon = makeIcon(PhosphorInstagramLogo, "InstagramIcon", "fill");
export const KeyboardArrowDownIcon = makeIcon(PhosphorCaretDown, "KeyboardArrowDownIcon", "bold");
export const KeyboardArrowRightIcon = makeIcon(PhosphorCaretRight, "KeyboardArrowRightIcon", "bold");
export const KeyboardArrowUpIcon = makeIcon(PhosphorCaretUp, "KeyboardArrowUpIcon", "bold");
export const LanguageIcon = makeIcon(PhosphorGlobe, "LanguageIcon");
export const LightModeIcon = makeIcon(PhosphorSun, "LightModeIcon", "fill");
export const LinkedInIcon = makeIcon(PhosphorLinkedinLogo, "LinkedInIcon", "fill");
export const MenuIcon = makeIcon(PhosphorList, "MenuIcon", "bold");
export const SearchIcon = makeIcon(PhosphorMagnifyingGlass, "SearchIcon", "bold");
export const SparkleIcon = makeIcon(PhosphorSparkle, "SparkleIcon", "fill");
export const RefreshIcon = makeIcon(PhosphorArrowClockwise, "RefreshIcon", "bold");
export const StorageIcon = makeIcon(PhosphorDatabase, "StorageIcon", "fill");
export const TerminalIcon = makeIcon(PhosphorTerminalWindow, "TerminalIcon", "fill");
export const VisibilityIcon = makeIcon(PhosphorEye, "VisibilityIcon");
export const WidgetsIcon = makeIcon(PhosphorSquaresFour, "WidgetsIcon", "fill");
export const WorkIcon = makeIcon(PhosphorBriefcase, "WorkIcon");

export type IconComponent = ReturnType<typeof makeIcon>;
