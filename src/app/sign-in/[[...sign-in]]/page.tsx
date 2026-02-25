import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams?: {
    redirect_url?: string;
  };
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { userId } = await auth();
  if (userId) {
    redirect("/users");
  }

  const redirectUrl = searchParams?.redirect_url ?? "/users";

  return (
    <div className="flex min-h-screen items-center justify-center bg-chat px-4 py-10">
      <div className="surface-glass glass-border rounded-[28px] p-6 md:p-8 animate-rise">
        <SignIn redirectUrl={redirectUrl} signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
