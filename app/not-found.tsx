import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">

      {/* Background aesthetic glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center">
        {/* Animated glitch/shadow effect for 404 */}
        <div className="relative mb-6">
          <h1 className="text-8xl md:text-[150px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-brand-500 to-brand-900 drop-shadow-[0_0_30px_rgba(226,32,44,0.3)] select-none">
            404
          </h1>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center mix-blend-overlay opacity-50 select-none">
            <h1 className="text-8xl md:text-[150px] font-black tracking-tighter text-white">
              404
            </h1>
          </div>
        </div>

        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-widest text-salt mb-4">
          Lost in the <span className="text-brand-500">Void</span>
        </h2>

        <p className="text-ash max-w-md mx-auto mb-10 text-sm md:text-base">
          The page you are looking for has been moved, deleted, or never existed in our reality.
          <br className="hidden md:block" />
          <span className="italic mt-2 block font-medium">Violence is our aesthetic, but this is just an error.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
          <Link
            href="/"
            className="btn-primary px-8 py-4 w-full sm:w-auto text-sm uppercase tracking-wider text-center relative group overflow-hidden"
          >
            <span className="relative z-10 font-bold">Return to Reality</span>
          </Link>
        </div>
      </div>

      {/* Footer minimal logo */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none">
        <Image
          src="/images/logo-sychogear.webp"
          alt="Sychogear"
          width={120}
          height={40}
          className="object-contain"
        />
      </div>
    </div>
  );
}
