export const MAIN_SCROLL_CONTAINER_ID = "main-scroll-container";

export function computeContainerScrollTop({
  containerScrollTop,
  containerTop,
  elementTop,
  elementHeight,
  containerHeight,
  block = "start",
  extraOffset = 0,
}: {
  containerScrollTop: number;
  containerTop: number;
  elementTop: number;
  elementHeight: number;
  containerHeight: number;
  block?: "start" | "center";
  extraOffset?: number;
}): number {
  const elementOffset = elementTop - containerTop + containerScrollTop;
  if (block === "center") {
    return Math.max(
      0,
      elementOffset - containerHeight / 2 + elementHeight / 2,
    );
  }
  return Math.max(0, elementOffset - extraOffset);
}

export function resetOuterAppScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  const shells = document.querySelectorAll<HTMLElement>(".mobile-container");
  shells.forEach((shell) => {
    shell.scrollTop = 0;
    shell.scrollLeft = 0;
  });
}

function scrollMarginTop(element: HTMLElement): number {
  const value = Number.parseFloat(getComputedStyle(element).scrollMarginTop);
  return Number.isFinite(value) ? value : 0;
}

export function scrollElementInMainContainer(
  element: HTMLElement | null,
  options?: { behavior?: ScrollBehavior; block?: "start" | "center" },
) {
  resetOuterAppScroll();
  if (!element) return;

  const container = document.getElementById(MAIN_SCROLL_CONTAINER_ID);
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const nextTop = computeContainerScrollTop({
    containerScrollTop: container.scrollTop,
    containerTop: containerRect.top,
    elementTop: elementRect.top,
    elementHeight: elementRect.height,
    containerHeight: container.clientHeight,
    block: options?.block ?? "start",
    extraOffset: options?.block === "center" ? 0 : scrollMarginTop(element),
  });

  container.scrollTo({
    top: nextTop,
    behavior: options?.behavior ?? "smooth",
  });
  resetOuterAppScroll();
}
