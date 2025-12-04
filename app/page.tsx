import { HomeLanding } from "@/components/brain/home-landing";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,64,175,0.25),_transparent_55%)]" />
      <div className="absolute inset-y-0 right-0 w-1/2 translate-x-1/4 bg-[radial-gradient(circle,_rgba(14,165,233,0.35),_transparent_60%)] blur-3xl" />
      <div className="absolute inset-y-0 left-0 w-1/3 -translate-x-1/4 bg-[radial-gradient(circle,_rgba(59,130,246,0.25),_transparent_60%)] blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col p-6 sm:p-10 lg:p-14 xl:p-16">
        <HomeLanding />
      </div>
    </main>
  );
}
