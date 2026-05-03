
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Carousel from "./index";

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe("Carousel Component", () => {
  const mockItems = [
    { id: 1, text: "Slide 1" },
    { id: 2, text: "Slide 2" },
    { id: 3, text: "Slide 3" },
  ];

  const renderItem = (item: { id: number; text: string }) => (
    <div data-testid={`carousel-item-${item.id}`}>{item.text}</div>
  );

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it("renders nothing when items array is empty", () => {
    const { container } = render(<Carousel items={[]} renderItem={renderItem} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders section title if provided", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} sectionTitle="Featured" />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("renders the first item initially and shows correct progress", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} progressLabelPrefix="Slide" />);
    
    expect(screen.getByTestId("carousel-item-1")).toBeInTheDocument();
    expect(screen.queryByTestId("carousel-item-2")).not.toBeInTheDocument();
    expect(screen.getByText("Slide 01 / 03")).toBeInTheDocument();
  });

  it("navigates to next and previous slides using navigation buttons", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} showNavigation={true} />);
    
    const nextButton = screen.getByLabelText("Next");
    const prevButton = screen.getByLabelText("Previous");

    fireEvent.click(nextButton);
    expect(screen.getByTestId("carousel-item-2")).toBeInTheDocument();

    fireEvent.click(nextButton);
    expect(screen.getByTestId("carousel-item-3")).toBeInTheDocument();

    fireEvent.click(prevButton);
    expect(screen.getByTestId("carousel-item-2")).toBeInTheDocument();
  });

  it("loops back to the first slide when clicking next on the last slide", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} />);
    
    const nextButton = screen.getByLabelText("Next");
    fireEvent.click(nextButton); // to slide 2
    fireEvent.click(nextButton); // to slide 3
    fireEvent.click(nextButton); // loop to slide 1
    
    expect(screen.getByTestId("carousel-item-1")).toBeInTheDocument();
  });

  it("loops back to the last slide when clicking prev on the first slide", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} />);
    
    const prevButton = screen.getByLabelText("Previous");
    fireEvent.click(prevButton); // loop to slide 3
    
    expect(screen.getByTestId("carousel-item-3")).toBeInTheDocument();
  });

  it("renders dots when showDots is true and handles dot clicks", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} showDots={true} />);
    
    const dots = screen.getAllByRole("button", { name: /Go to slide/i });
    expect(dots).toHaveLength(3);

    fireEvent.click(dots[2]);
    expect(screen.getByTestId("carousel-item-3")).toBeInTheDocument();
  });

  it("handles autoPlay correctly and stops when user interacts", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} autoPlay={true} autoPlayInterval={5000} />);
    
    expect(screen.getByTestId("carousel-item-1")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId("carousel-item-2")).toBeInTheDocument();

    const nextButton = screen.getByLabelText("Next");
    fireEvent.click(nextButton);
    expect(screen.getByTestId("carousel-item-3")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId("carousel-item-3")).toBeInTheDocument();
  });

  it("handles touch swipe gestures correctly", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} />);
    
    const content = screen.getByTestId("carousel-content");

    fireEvent.touchStart(content, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(content, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchEnd(content);
    
    expect(screen.getByTestId("carousel-item-2")).toBeInTheDocument();

    fireEvent.touchStart(content, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchMove(content, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(content);
    
    expect(screen.getByTestId("carousel-item-1")).toBeInTheDocument();
  });

  it("ignores touchEnd if touchStart or touchEnd positions are missing", () => {
    render(<Carousel items={mockItems} renderItem={renderItem} />);
    const content = screen.getByTestId("carousel-content");
    
    // Fire touchEnd immediately without touchStart
    fireEvent.touchEnd(content);
    
    // No change should occur
    expect(screen.getByTestId("carousel-item-1")).toBeInTheDocument();
  });

  it("formats progress label correctly for 10 or more items", () => {
    const lotsOfItems = Array.from({ length: 11 }, (_, i) => ({ id: i, text: `Item ${i}` }));
    render(<Carousel items={lotsOfItems} renderItem={(item) => <div>{item.text}</div>} progressLabelPrefix="Slide" />);
    
    // 1st item of 11 items -> "01 / 11"
    expect(screen.getByText("Slide 01 / 11")).toBeInTheDocument();
    
    // Click next 9 times to get to index 9 (10th item)
    const nextButton = screen.getByLabelText("Next");
    for (let i = 0; i < 9; i++) {
      fireEvent.click(nextButton);
    }
    
    // 10th item of 11 -> "10 / 11"
    expect(screen.getByText("Slide 10 / 11")).toBeInTheDocument();
  });
});
