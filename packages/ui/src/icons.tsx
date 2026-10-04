import type { ComponentType } from "react";
import type { IconProps as PhosphorIconProps, IconWeight } from "@phosphor-icons/react";
// Per-icon deep imports keep the bundle to exactly the icons used. The SSR
// build has no React context, so these work in server and client components.
import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr/ArrowClockwise";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { Article } from "@phosphor-icons/react/dist/ssr/Article";
import { Briefcase } from "@phosphor-icons/react/dist/ssr/Briefcase";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr/CaretLeft";
import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { CaretUp } from "@phosphor-icons/react/dist/ssr/CaretUp";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { Cloud } from "@phosphor-icons/react/dist/ssr/Cloud";
import { Copy } from "@phosphor-icons/react/dist/ssr/Copy";
import { Database } from "@phosphor-icons/react/dist/ssr/Database";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { GameController } from "@phosphor-icons/react/dist/ssr/GameController";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr/GithubLogo";
import { Globe } from "@phosphor-icons/react/dist/ssr/Globe";
import { HardDrives } from "@phosphor-icons/react/dist/ssr/HardDrives";
import { House } from "@phosphor-icons/react/dist/ssr/House";
import { Info } from "@phosphor-icons/react/dist/ssr/Info";
import { InstagramLogo } from "@phosphor-icons/react/dist/ssr/InstagramLogo";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { LinkedinLogo } from "@phosphor-icons/react/dist/ssr/LinkedinLogo";
import { List } from "@phosphor-icons/react/dist/ssr/List";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { Moon } from "@phosphor-icons/react/dist/ssr/Moon";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { Sun } from "@phosphor-icons/react/dist/ssr/Sun";
import { TerminalWindow } from "@phosphor-icons/react/dist/ssr/TerminalWindow";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { X } from "@phosphor-icons/react/dist/ssr/X";

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

export const ArrowForwardIcon = makeIcon(ArrowRight, "ArrowForwardIcon", "bold");
export const ArrowOutwardIcon = makeIcon(ArrowUpRight, "ArrowOutwardIcon", "bold");
export const ArticleIcon = makeIcon(Article, "ArticleIcon");
export const BoltIcon = makeIcon(Lightning, "BoltIcon", "fill");
export const CheckIcon = makeIcon(Check, "CheckIcon", "bold");
export const ChevronLeftIcon = makeIcon(CaretLeft, "ChevronLeftIcon", "bold");
export const ChevronRightIcon = makeIcon(CaretRight, "ChevronRightIcon", "bold");
export const CloseIcon = makeIcon(X, "CloseIcon", "bold");
export const CloudIcon = makeIcon(Cloud, "CloudIcon", "fill");
export const CopyIcon = makeIcon(Copy, "CopyIcon");
export const DarkModeIcon = makeIcon(Moon, "DarkModeIcon", "fill");
export const DescriptionIcon = makeIcon(FileText, "DescriptionIcon", "fill");
export const DnsIcon = makeIcon(HardDrives, "DnsIcon", "fill");
export const ErrorIcon = makeIcon(WarningCircle, "ErrorIcon");
export const GameIcon = makeIcon(GameController, "GameIcon", "fill");
export const GitHubIcon = makeIcon(GithubLogo, "GitHubIcon", "fill");
export const HomeIcon = makeIcon(House, "HomeIcon", "fill");
export const InfoIcon = makeIcon(Info, "InfoIcon");
export const InstagramIcon = makeIcon(InstagramLogo, "InstagramIcon", "fill");
export const KeyboardArrowDownIcon = makeIcon(CaretDown, "KeyboardArrowDownIcon", "bold");
export const KeyboardArrowRightIcon = makeIcon(CaretRight, "KeyboardArrowRightIcon", "bold");
export const KeyboardArrowUpIcon = makeIcon(CaretUp, "KeyboardArrowUpIcon", "bold");
export const LanguageIcon = makeIcon(Globe, "LanguageIcon");
export const LightModeIcon = makeIcon(Sun, "LightModeIcon", "fill");
export const LinkedInIcon = makeIcon(LinkedinLogo, "LinkedInIcon", "fill");
export const MenuIcon = makeIcon(List, "MenuIcon", "bold");
export const SearchIcon = makeIcon(MagnifyingGlass, "SearchIcon", "bold");
export const SparkleIcon = makeIcon(Sparkle, "SparkleIcon", "fill");
export const RefreshIcon = makeIcon(ArrowClockwise, "RefreshIcon", "bold");
export const StorageIcon = makeIcon(Database, "StorageIcon", "fill");
export const TerminalIcon = makeIcon(TerminalWindow, "TerminalIcon", "fill");
export const VisibilityIcon = makeIcon(Eye, "VisibilityIcon");
export const WidgetsIcon = makeIcon(SquaresFour, "WidgetsIcon", "fill");
export const WorkIcon = makeIcon(Briefcase, "WorkIcon");

export type IconComponent = ReturnType<typeof makeIcon>;
