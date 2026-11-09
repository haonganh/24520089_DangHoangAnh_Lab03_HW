
export interface VirtualWindow {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
}

export function getVirtualWindow(
  itemCount: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  overscan = 3
): VirtualWindow {
  if (
    !Number.isSafeInteger(itemCount) ||
    itemCount < 0 ||
    !Number.isFinite(scrollTop) ||
    !Number.isFinite(viewportHeight) ||
    viewportHeight <= 0 ||
    !Number.isFinite(rowHeight) ||
    rowHeight <= 0 ||
    !Number.isSafeInteger(overscan) ||
    overscan < 0
  ) {
    throw new RangeError('Invalid virtual window configuration');
  }

  const totalHeight = itemCount * rowHeight;

  if (itemCount === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      totalHeight: 0,
    };
  }

  const maxScrollTop = Math.max(
    0,
    totalHeight - viewportHeight
  );

  const safeScrollTop = Math.max(
    0,
    Math.min(scrollTop, maxScrollTop)
  );

  const firstVisible = Math.floor(
    safeScrollTop / rowHeight
  );

  const visibleCount =
    Math.ceil(viewportHeight / rowHeight) + 1;

  return {
    startIndex: Math.max(
      0,
      firstVisible - overscan
    ),
    endIndex: Math.min(
      itemCount,
      firstVisible + visibleCount + overscan
    ),
    totalHeight,
  };
}

