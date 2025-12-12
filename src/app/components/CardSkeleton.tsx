import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function CardSkeleton() {
  const skeletonItems = Array.from({ length: 15 });

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {skeletonItems.map((_, index) => (
        <div
          key={index}
          className="bg-gray-100 flex flex-col justify-center pl-2 pr-2"
          style={{ height: "133.7px", paddingBottom: "16px" }}
        >
          <div className="w-[92%]">
            <Skeleton height={20} width="100%" />
          </div>

          <div className="w-[88%] mt-2">
            <Skeleton height={18} width="100%" />
          </div>

          <div className="w-[90%] mt-2">
            <Skeleton height={15} width="100%" />
          </div>

          <div className="w-[75%] mt-2">
            <Skeleton height={13} width="100%" />
          </div>
        </div>
      ))}
    </section>
  );
}
