import Link from "next/link";

/**
 * Renders the Home page showing a centered link to the SignIn route.
 *
 * @returns The JSX element for the Home page: a full-height centered container with a `Link` to `/signin`.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Link href="/signin">SignIn</Link>
    </div>

  );
}
