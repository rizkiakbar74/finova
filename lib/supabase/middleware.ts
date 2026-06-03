import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

type SupabaseCookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedPrefixes = [
  "/dashboard",
  "/transactions",
  "/wallets",
  "/income",
  "/expenses",
  "/budgets",
  "/goals",
  "/reports",
  "/settings",
  "/recurring-bills",
  "/subscriptions",
  "/calendar",
  "/notifications"
];

const authPages = ["/login", "/signup"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAuthPath(pathname: string) {
  return authPages.includes(pathname);
}

function isOnboardingPath(pathname: string) {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

async function getOnboardingCompleted(supabase: SupabaseClient, user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  // After the database setup is installed, profiles is the source of truth.
  if (!error && data) {
    return data.onboarding_completed === true;
  }

  // Fallback only for projects that have not installed the database yet.
  return user.user_metadata?.onboarding_completed === true;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = isProtectedPath(pathname) || isOnboardingPath(pathname);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (!user) {
    return supabaseResponse;
  }

  const completed = await getOnboardingCompleted(supabase, user);

  if (isAuthPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = completed ? "/dashboard" : "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isOnboardingPath(pathname) && completed) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isProtectedPath(pathname) && !completed) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
