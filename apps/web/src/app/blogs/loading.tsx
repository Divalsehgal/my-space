import FluidContainer from "@/components/FluidContainer";
import BlogsSkeleton from "@/containers/Blogs/Skeleton";

export default function Loading() {
    return (
        <div className="page-scroll">
            <FluidContainer>
            <BlogsSkeleton />
            </FluidContainer>
        </div>
    );
}
