"use client";

type AquariumStatsProps = {
  cleanLevel: number;
  fishCount: number;
  accessoryCount?: number;
  tankType?: string;
};

export function AquariumStats({
  cleanLevel,
  fishCount,
  accessoryCount = 0,
  tankType,
}: AquariumStatsProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Aquarium stats</h3>
      <ul className="space-y-1 text-sm text-gray-600">
        <li>Clean level: {cleanLevel}%</li>
        <li>Fish: {fishCount}</li>
        {accessoryCount > 0 && <li>Accessories: {accessoryCount}</li>}
        {tankType && <li>Tank: {tankType}</li>}
      </ul>
    </div>
  );
}
