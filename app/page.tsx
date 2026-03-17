import Link from "next/link";

/**
 * Renders the Home page showing a centered link to the SignIn route.
 *
 * @returns The JSX element for the Home page: a full-height centered container with a `Link` to `/signin`.
 */
export default function Home() {
  return (
    <div>
      <Link href="/signin">SignIn</Link>
    </div>

  );
}
