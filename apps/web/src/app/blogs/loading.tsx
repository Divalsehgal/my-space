import FluidContainer from "@/components/FluidContainer";
import BlogsSkeleton from "@/containers/Blogs/Skeleton";

export default function Loading() {
    return (
        <main className="page-scroll">
            <FluidContainer>
            <BlogsSkeleton />
            </FluidContainer>
        </main>
    );
}
