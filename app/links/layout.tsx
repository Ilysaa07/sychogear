export default function LinksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-950">
      {/* We purposefully omit the root Navbar and Footer here so it looks like a clean Linktree page */}
      {children}
    </div>
  );
}
