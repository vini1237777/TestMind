export default function ScoreBadge({ score }: { score: number }) {
  const color =
    score > 85 ? "bg-green-500" : score > 60 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${color}`}
    >
      {score}
    </div>
  );
}
