const CONTACT_REMEMBER_KEY = "contact:remembered-contact";

type RememberedContact = { name: string; email: string };

/**
 * Separate from contactPrefill.ts on purpose: that file is a DOM CustomEvent
 * bus because a value set elsewhere on the always-mounted Home page has to
 * reach an already-mounted Contact form after the fact. This only ever needs
 * a one-time read at the form's own mount, so plain localStorage is enough.
 */
export function saveRememberedContact(contact: RememberedContact): void {
  try {
    window.localStorage.setItem(CONTACT_REMEMBER_KEY, JSON.stringify(contact));
  } catch {
    // Private browsing / storage disabled - remembering is a nice-to-have.
  }
}

export function getRememberedContact(): RememberedContact | null {
  try {
    const raw = window.localStorage.getItem(CONTACT_REMEMBER_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (typeof parsed?.name !== "string" || typeof parsed?.email !== "string") {
      return null;
    }

    return { name: parsed.name, email: parsed.email };
  } catch {
    return null;
  }
}
