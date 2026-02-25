import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type SignUpPageProps = {
  searchParams?: {
    redirect_url?: string;
  };
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { userId } = await auth();
  if (userId) {
    redirect("/users");
  }

  const redirectUrl = searchParams?.redirect_url ?? "/users";

  return (
    <div className="flex min-h-screen items-center justify-center bg-chat px-4 py-10">
      <div className="surface-glass glass-border rounded-[28px] p-6 md:p-8 animate-rise">
        <SignUp redirectUrl={redirectUrl} signInUrl="/sign-in" />
      </div>
    </div>
  );
}
