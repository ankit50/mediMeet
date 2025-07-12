import Link from "next/link";
import Image from "next/image";
import React from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "./ui/button";
import { checkUser } from "@/lib/checkUser";

const Header = async () => {
  const user = await checkUser();
  return (
    <header className="fixed top-0 w-full border-b backdrop-blur-md z-10 supports-[backdrop-filter]: bg-background/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logo-single.png"
            alt="Medimeet logo"
            width={50}
            height={50}
            className="h-10 w-auto object-contain"
          />
        </Link>
        <div>
          <SignedOut className="flex items-center space-x-2">
            <SignInButton />
            <Button variant={"secondary"}>Sign in</Button>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
