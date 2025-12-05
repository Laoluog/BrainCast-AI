export default function ProtectedPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black px-6 py-12 text-white sm:px-12 lg:px-16">
      <div className="flex w-full max-w-7xl flex-col gap-6">
        <h1 className="font-roboto text-2xl font-bold uppercase tracking-widest">Workspace</h1>
        <ul className="list-disc pl-6 font-roboto">
          <li>
            <a className="underline hover:text-white/80" href="/protected/brain/cases">
              View all cases
            </a>
          </li>
          <li>
            <a className="underline hover:text-white/80" href="/protected/brain/input">
              Create a new case
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
