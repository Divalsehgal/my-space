"use client";

import Link from "next/link";
import Typography from "@mui/material/Typography";

import TerminalIcon from "@mui/icons-material/Terminal";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import styles from "./styles.module.scss";
import FluidContainer from "../FluidContainer";
import { trackInteraction, ANALYTICS_EVENTS } from "@/utils/analytics";
const footerLinks = [
    { label: "Home", href: "/#home" },
    { label: "About", href: "/#about" },
    { label: "Blogs", href: "/blogs" },
    { label: "Projects", href: "/#projects" },
    { label: "Experience", href: "/#experience" },
    { label: "Contact", href: "/#contact" },
];

const socialLinks = [
    { icon: <InstagramIcon />, href: "https://instagram.com", label: "Instagram" },
    { icon: <FacebookIcon />, href: "https://facebook.com", label: "Facebook" },
    { icon: <LinkedInIcon />, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: <GitHubIcon />, href: "https://github.com", label: "GitHub" },
];

type FooterProps = {
    readonly brand?: string;
};

export default function Footer({ brand }: FooterProps) {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <FluidContainer className={styles["footer__container"]}>
                <div className={styles["footer__top"]}>
                    {/* Brand */}
                    <div className={styles["footer__brand"]}>
                        <Link href="/" className={styles["footer__brand-link"]}>
                            <TerminalIcon className={styles["footer__brand-icon"]} />
                            <Typography variant="h3" className={styles["footer__brand-text"]}>
                                {brand || "Dival Sehgal"}
                            </Typography>
                        </Link>
                        <p className={styles["footer__description"]}>
                            Frontend Developer focused on building beautiful, interactive, and high-performance web applications.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className={styles["footer__links-section"]}>
                        <Typography variant="h6" className={styles["footer__section-title"]}>
                            Navigation
                        </Typography>
                        <ul className={styles["footer__links-list"]}>
                            {footerLinks.map((link) => (
                                <li key={link.label}>
                                    <Link 
                                        href={link.href} 
                                        className={styles["footer__link"]}
                                        onClick={() => {
                                            trackInteraction(ANALYTICS_EVENTS.NAV_CLICK, { label: link.label, href: link.href, location: "footer" });
                                        }}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social */}
                    <div className={styles["footer__social-section"]}>
                        <Typography variant="h6" className={styles["footer__section-title"]}>
                            Connect
                        </Typography>
                        <div className={styles["footer__social-links"]}>
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles["footer__social-icon"]}
                                    aria-label={social.label}
                                    onClick={() => {
                                        trackInteraction(ANALYTICS_EVENTS.SOCIAL_CLICK, { platform: social.label, href: social.href });
                                    }}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles["footer__bottom"]}>
                    <Typography className={styles["footer__copyright"]}>
                        © {currentYear} {brand || "Dival Sehgal"}. Built with precision and passion.
                    </Typography>
                </div>
            </FluidContainer>
        </footer>
    );
}
