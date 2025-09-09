"use client"; 

import { useSession, signIn, signOut } from "next-auth/react";
import Link from 'next/link';

// The rest of the component code is the same as before...
export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link href="/">
        <div className="text-2xl font-bold text-blue-600 cursor-pointer">JobTalk</div>
      </Link>
      <div>
        {session ? (
          <div className="flex items-center gap-4">
            <span className="font-semibold">{session.user?.name}</span>
            <Link href="/profile">
              <div className="text-gray-700 hover:text-blue-600 cursor-pointer">Profile</div>
            </Link>
            <Link href="/search">
              <div className="text-gray-700 hover:text-blue-600 cursor-pointer">Job Search</div>
            </Link>
            <button onClick={() => signOut()} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={() => signIn('google')} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Sign In with Google
          </button>
        )}
      </div>
    </nav>
  )
}