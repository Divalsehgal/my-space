import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SkillSphere, { type SphereSkill } from ".";
import { ThemeContextProvider } from "@/context/ThemeContext";
import { motionAllowed } from "@/lib/motion";
import { stepMotion } from "./motion";
import { drawSphere } from "./draw";
import { IDLE_SPEED, SPHERE } from "./constants";
import type { SphereMotion } from "./useSphereDrag";

jest.mock("@/lib/motion", () => ({ motionAllowed: jest.fn(() => false) }));

const skills: SphereSkill[] = [
  { name: "React", group: 0, depth: 4, sub: "Frameworks" },
  { name: "CSS", group: 0, depth: 2 },
  { name: "Go", group: 1, depth: 1 },
];
const groups = [
  { key: "fe", label: "Frontend" },
  { key: "be", label: "Backend" },
  { key: "ops", label: "Ops" },
];

const renderSphere = () =>
  render(
    <ThemeContextProvider>
      <SkillSphere skills={skills} groups={groups} />
    </ThemeContextProvider>,
  );

const word = (name: string) => screen.getAllByText(name).find((el) => el.closest("li"))!.closest("li")!;

describe("SkillSphere", () => {
  it("shows the at-a-glance totals by default", () => {
    renderSphere();
    expect(screen.getByRole("button", { name: /all/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Frontend", { selector: "strong" })).toBeInTheDocument();
    // Without motion the sphere is still projected once.
    expect(word("React").style.transform).toContain("translate3d");
  });

  it("selects a skill on click and clears it", () => {
    renderSphere();
    fireEvent.click(word("React"));
    expect(screen.getByRole("heading", { name: "React" })).toBeInTheDocument();
    expect(screen.getByText(/Frontend · Frameworks/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.queryByRole("heading", { name: "React" })).not.toBeInTheDocument();
    // Clicking a word twice toggles it off too.
    fireEvent.click(word("Go"));
    fireEvent.click(word("Go"));
    expect(screen.queryByRole("heading", { name: "Go" })).not.toBeInTheDocument();
  });

  it("previews a skill on hover", () => {
    renderSphere();
    fireEvent.pointerEnter(word("CSS"));
    expect(screen.getByRole("heading", { name: "CSS" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear/i })).not.toBeInTheDocument();
    fireEvent.pointerLeave(word("CSS"));
    expect(screen.queryByRole("heading", { name: "CSS" })).not.toBeInTheDocument();
  });

  it("focuses a category, ranks its skills and toggles back", () => {
    renderSphere();
    fireEvent.click(screen.getByRole("button", { name: /Frontend/ }));
    expect(screen.getByRole("heading", { name: "Frontend" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^CSS/ }));
    expect(screen.getByRole("heading", { name: "CSS" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Frontend/ }));
    expect(screen.getByRole("button", { name: /all/i })).toHaveAttribute("aria-pressed", "true");
    // A category with no skills just resets the target.
    fireEvent.click(screen.getByRole("button", { name: /Ops/ }));
    fireEvent.click(screen.getByRole("button", { name: /all/i }));
  });

  it("does not select after a drag", () => {
    // jsdom has no PointerEvent, so fireEvent drops clientX/clientY without this.
    (window as unknown as { PointerEvent: unknown }).PointerEvent ??= MouseEvent;
    const { container } = renderSphere();
    const stage = container.querySelector("ul")!.parentElement!;
    fireEvent.pointerMove(stage, { clientX: 50, clientY: 0 }); // ignored: not dragging
    fireEvent.pointerDown(stage, { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(stage, { clientX: 1, clientY: 1 });
    fireEvent.pointerMove(stage, { clientX: 40, clientY: 30 });
    fireEvent.pointerUp(stage);
    fireEvent.click(word("React"));
    expect(screen.queryByRole("heading", { name: "React" })).not.toBeInTheDocument();
  });

  it("animates with requestAnimationFrame and pauses off-screen", () => {
    (motionAllowed as jest.Mock).mockReturnValue(true);
    const frames: FrameRequestCallback[] = [];
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => frames.push(cb));
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    let onIntersect: (entries: { isIntersecting: boolean }[]) => void = () => undefined;
    const disconnect = jest.fn();
    (global as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest.fn((cb) => {
      onIntersect = cb;
      return { observe: jest.fn(), disconnect };
    });
    let onResize: () => void = () => undefined;
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = jest.fn((cb) => {
      onResize = cb;
      return { observe: jest.fn(), disconnect: jest.fn() };
    });

    const { unmount } = renderSphere();
    act(() => frames.shift()!(performance.now() + 16));
    expect(word("React").style.opacity).not.toBe("");
    act(() => onResize());
    act(() => onIntersect([{ isIntersecting: false }]));
    act(() => onIntersect([{ isIntersecting: true }]));
    unmount();
    expect(disconnect).toHaveBeenCalled();

    delete (global as Record<string, unknown>).IntersectionObserver;
    delete (global as Record<string, unknown>).ResizeObserver;
    renderSphere().unmount();
    (motionAllowed as jest.Mock).mockReturnValue(false);
  });
});

const motion = (over: Partial<SphereMotion> = {}): SphereMotion => ({
  rotX: 0, rotY: 0, velX: 0, velY: 0, dragging: false, moved: false, lastX: 0, lastY: 0, hovering: false, target: null, ...over,
});

describe("stepMotion", () => {
  it("glides toward a target and zeroes velocity", () => {
    const s = motion({ target: { x: 0.5, y: 1 }, velY: 1 });
    stepMotion(s, true, 16.667);
    expect(s.rotY).toBeGreaterThan(0);
    expect(s.velY).toBe(0);
    const snap = motion({ target: { x: 0.5, y: 1 } });
    stepMotion(snap, false, 0);
    expect(snap.rotY).toBeCloseTo(1);
  });

  it("eases idle spin, stops it while hovering and clamps tilt", () => {
    const s = motion();
    stepMotion(s, true, 16.667);
    expect(s.velY).toBeGreaterThan(0);
    const hover = motion({ hovering: true, velY: IDLE_SPEED });
    stepMotion(hover, true, 16.667);
    expect(hover.velY).toBeLessThan(IDLE_SPEED);
    const tilt = motion({ velX: 10, dragging: true });
    stepMotion(tilt, true, 1000);
    expect(tilt.rotX).toBe(SPHERE.maxTilt);
  });
});

describe("drawSphere", () => {
  const node = () => {
    const li = document.createElement("li");
    li.append(document.createElement("span"), document.createElement("span"));
    return li;
  };

  it("skips missing nodes, caches z-index and toggles the back class", () => {
    const front = node();
    const back = node();
    const scene = {
      points: [
        { name: "a", group: 0, depth: 1 as const, x: 0, y: 0, z: 1 },
        { name: "b", group: 0, depth: 1 as const, x: 0, y: 0, z: -1 },
        { name: "c", group: 0, depth: 1 as const, x: 1, y: 0, z: 0 },
      ],
      nodes: [front, back, null],
      lastZ: [] as number[],
      backClass: "back",
    };
    drawSphere(motion(), scene, 100);
    expect(front.classList.contains("back")).toBe(false);
    expect(back.classList.contains("back")).toBe(true);
    expect(scene.lastZ).toEqual([100, 0]);
    front.style.zIndex = "";
    drawSphere(motion(), scene, 300);
    expect(front.style.zIndex).toBe("");
  });
});
