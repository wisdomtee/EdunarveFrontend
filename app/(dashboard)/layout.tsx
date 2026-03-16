import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6">
        <h2 className="text-2xl font-bold mb-8 text-blue-600">
          EduNerve
        </h2>

        <nav className="space-y-4 text-gray-700">
          <Link href="/dashboard" className="block hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/students" className="block hover:text-blue-600">
            Students
          </Link>
          <Link href="/courses" className="block hover:text-blue-600">
            Courses
          </Link>
          <Link href="/results" className="block hover:text-blue-600">
            Results
          </Link>
          <Link href="/subscriptions" className="block hover:text-blue-600">
            Subscriptions
          </Link>
          <Link href="/payments" className="block hover:text-blue-600">
            Payments
          </Link>
          <Link href="/settings" className="block hover:text-blue-600">
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {children}
      </main>
    </div>
  );
}