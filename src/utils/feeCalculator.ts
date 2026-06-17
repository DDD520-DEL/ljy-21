import type { Household } from '@/types';

export function calculateShareRatio(
  households: Omit<Household, 'shareRatio' | 'shareAmount'>[],
  totalCost: number
): Household[] {
  const householdsByFloor: Record<number, typeof households> = {};

  households.forEach((h) => {
    if (!householdsByFloor[h.floor]) {
      householdsByFloor[h.floor] = [];
    }
    householdsByFloor[h.floor].push(h);
  });

  const floorBaseRatio: Record<number, number> = {};
  Object.keys(householdsByFloor).forEach((floorStr) => {
    const floor = parseInt(floorStr);
    if (floor <= 1) {
      floorBaseRatio[floor] = 0;
    } else if (floor === 2) {
      floorBaseRatio[floor] = 8;
    } else {
      floorBaseRatio[floor] = 8 + (floor - 2) * 4;
    }
  });

  const totalRatio = Object.values(floorBaseRatio).reduce(
    (sum, ratio) => sum + ratio,
    0
  );

  const result: Household[] = [];

  households.forEach((h) => {
    const floorTotalRatio = floorBaseRatio[h.floor];
    const floorHouseholds = householdsByFloor[h.floor];
    const floorTotalArea = floorHouseholds.reduce(
      (sum, hh) => sum + hh.area,
      0
    );

    let shareRatio = 0;
    if (floorTotalRatio > 0 && floorTotalArea > 0) {
      const normalizedFloorRatio = (floorTotalRatio / totalRatio) * 100;
      shareRatio = (normalizedFloorRatio * h.area) / floorTotalArea;
    }

    const shareAmount = (totalCost * 10000 * shareRatio) / 100;

    result.push({
      ...h,
      shareRatio: Math.round(shareRatio * 100) / 100,
      shareAmount: Math.round(shareAmount),
    });
  });

  return result;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
