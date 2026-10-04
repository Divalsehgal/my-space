import Link from "next/link";

import { GitHubIcon, InstagramIcon, LinkedInIcon, TerminalIcon, type IconComponent } from "@dival-sehgal/ui/icons";
import styles from "./styles.module.scss";
import FluidContainer from "../FluidContainer";
import ParticlesBackground from "../ParticlesBackground";
import { trackAttrs, ANALYTICS_EVENTS } from "@/utils/analytics";
import { getT } from "@/i18n/server";
import { navLinks as footerLinks } from "../Navbar/constants";

type SocialItem = {
    label: string;
    href: string;
    icon?: string;
};

type FooterProps = {
    readonly brand?: string;
    readonly socialItems?: SocialItem[];
};

// Density scaling thins this out on a short, wide strip (~1/5 survives at 1440px).
const FOOTER_PARTICLE_COUNT = 600;
// Brighter than the default field so the sparse strip reads on the dark footer.
const FOOTER_PARTICLE_OPACITY = { min: 0.35, max: 0.9 };

const ICON_MAP: Record<string, IconComponent> = {
    github: GitHubIcon,
    linkedin: LinkedInIcon,
    instagram: InstagramIcon,
};

export default function Footer({ brand, socialItems = [] }: FooterProps) {
    const t = getT();
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles["footer__particles"]} aria-hidden="true">
                <ParticlesBackground
                    id="footer-particles"
                    className={styles["footer__particles-canvas"]}
                    fullScreen={false}
                    count={FOOTER_PARTICLE_COUNT}
                    opacity={FOOTER_PARTICLE_OPACITY}
                />
            </div>
            <FluidContainer className={styles["footer__container"]}>
                <div className={styles["footer__top"]}>
                    {/* Brand */}
                    <div className={styles["footer__brand"]}>
                        <Link href="/" className={styles["footer__brand-link"]}>
                            <TerminalIcon className={styles["footer__brand-icon"]} />
                            <span className={styles["footer__brand-text"]}>{brand || t("common.siteShortName")}</span>
                        </Link>
                        <p className={styles["footer__description"]}>
                            {t("footer.tagline")}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className={styles["footer__links-section"]}>
                        <h2 className={styles["footer__section-title"]}>{t("footer.navigation")}</h2>
                        <ul className={styles["footer__links-list"]}>
                            {footerLinks.map((link) => (
                                <li key={link.id}>
                                    <Link 
                                        href={link.href} 
                                        className={styles["footer__link"]}
                                        {...trackAttrs(ANALYTICS_EVENTS.NAV_CLICK, { label: link.id, href: link.href, location: "footer" })}
                                    >
                                        {t(link.labelKey)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social */}
                    <div className={styles["footer__social-section"]}>
                        <h2 className={styles["footer__section-title"]}>{t("footer.connect")}</h2>
                        <div className={styles["footer__social-links"]}>
                            {socialItems.map((social) => {
                                const Icon = ICON_MAP[social.icon?.toLowerCase() || ""] || null;
                                return (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles["footer__social-icon"]}
                                        aria-label={social.label}
                                        {...trackAttrs(ANALYTICS_EVENTS.SOCIAL_CLICK, { platform: social.label, href: social.href })}
                                    >
                                        {Icon ? <Icon fontSize="inherit" /> : social.label.substring(0, 2).toUpperCase()}
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles["footer__bottom"]}>
                    <p className={styles["footer__copyright"]}>
                        {t("footer.copyright", { year: currentYear, name: brand || t("common.siteName") })}
                    </p>
                </div>
            </FluidContainer>
        </footer>
    );
}
