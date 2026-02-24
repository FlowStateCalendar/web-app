export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      {children}
    </main>
  );
}
