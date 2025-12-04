import { Feature } from "../types/testmind";

export function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="border rounded p-3 hover:shadow-sm">
      <h3 className="text-sm font-semibold">{feature.name}</h3>
      {feature.description && (
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
          {feature.description}
        </p>
      )}
    </div>
  );
}
