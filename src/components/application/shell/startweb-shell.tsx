import { useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home, LogOut, Search, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/core/theme-toggle";
import { GlobalCommandPalette, openCommandPalette } from "@/components/core/global-command";
import { NAV_GROUPS, NAV_ITEMS, SETTINGS_NAV_ITEM } from "@/components/application/shell/nav-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * Authenticated app chrome, per the approved Startweb design language:
 * a solid blue 248px navigation rail with a text only STARTWEB wordmark,
 * a compact top bar carrying a breadcrumb and search, and a light canvas below.
 */
export function StartwebShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data: profile } = useProfile();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  const currentPage =
    NAV_ITEMS.find((item) => pathname.startsWith(item.to)) ??
    (pathname.startsWith(SETTINGS_NAV_ITEM.to) ? SETTINGS_NAV_ITEM : undefined);

  async function handleSignOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "15.5rem" } as CSSProperties}>
      <GlobalCommandPalette items={NAV_ITEMS} />
      <Sidebar collapsible="offcanvas" className="border-r-0">
        <SidebarHeader className="h-16 justify-center px-5">
          <Link
            to="/dashboard"
            className="text-lg font-bold tracking-[0.14em] text-sidebar-foreground uppercase"
          >
            Startweb
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[0.6875rem] font-semibold tracking-[0.12em] text-sidebar-section uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="h-10 gap-3 rounded-[0.625rem] tracking-[-0.006em] text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground data-[active=true]:bg-white/15 data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground"
                        >
                          <Link to={item.to} aria-current={isActive ? "page" : undefined}>
                            <item.icon className="size-4.5" aria-hidden="true" />
                            <span className="type-label">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="gap-3 px-4 pb-5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(SETTINGS_NAV_ITEM.to)}
                className="h-10 gap-3 rounded-[0.625rem] tracking-[-0.006em] text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground data-[active=true]:bg-white/15 data-[active=true]:text-sidebar-foreground"
              >
                <Link to={SETTINGS_NAV_ITEM.to}>
                  <SETTINGS_NAV_ITEM.icon className="size-4.5" aria-hidden="true" />
                  <span className="type-label">{SETTINGS_NAV_ITEM.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-3 border-t border-white/20 pt-4">
            <Avatar className="size-9 bg-white/15">
              <AvatarFallback className="bg-transparent text-sm font-semibold text-sidebar-foreground">
                {initialsOf(profile?.full_name)}
              </AvatarFallback>
            </Avatar>
            <span className="type-label truncate text-sidebar-foreground">
              {profile?.full_name || profile?.email}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-divider bg-card/80 px-6 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-1.5 text-muted-foreground">
                <li>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <Home className="size-3.5" aria-hidden="true" />
                    <span className="type-label">Home</span>
                  </Link>
                </li>
                {currentPage ? (
                  <>
                    <li aria-hidden="true">
                      <ChevronRight className="size-3.5 text-muted-foreground/70" />
                    </li>
                    <li>
                      <span
                        aria-current="page"
                        className="flex items-center gap-1.5 px-1 py-0.5 text-foreground"
                      >
                        <currentPage.icon
                          className="size-3.5 text-foreground/80"
                          aria-hidden="true"
                        />
                        <span className="type-label">{currentPage.label}</span>
                      </span>
                    </li>
                  </>
                ) : null}
              </ol>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCommandPalette}
              className="hidden h-9 w-64 items-center gap-2 rounded-[0.625rem] border border-border bg-background/70 px-3 text-left text-muted-foreground transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="type-body">Search...</span>
            </button>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Account menu"
                >
                  <Avatar className="size-9 ring-2 ring-primary/25 ring-offset-2 ring-offset-card">
                    <AvatarFallback>{initialsOf(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="flex items-center gap-3 py-2.5">
                  <Avatar className="size-9">
                    <AvatarFallback>{initialsOf(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="type-card block truncate">
                      {profile?.full_name || "Your account"}
                    </span>
                    <span className="type-meta block truncate font-normal text-muted-foreground">
                      {profile?.email}
                    </span>
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="group gap-2"
                  onSelect={() => openCommandPalette()}
                >
                  <Search
                    className="size-4 text-muted-foreground transition-transform duration-200 group-focus:scale-110"
                    aria-hidden="true"
                  />
                  Search workspace
                  <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="group gap-2">
                  <Link to={SETTINGS_NAV_ITEM.to}>
                    <Settings
                      className="size-4 text-muted-foreground transition-transform duration-300 group-focus:rotate-45"
                      aria-hidden="true"
                    />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="group gap-2"
                  onSelect={(event) => {
                    event.preventDefault();
                    setIsSignOutOpen(true);
                  }}
                >
                  <LogOut
                    className="size-4 text-muted-foreground transition-transform duration-200 group-focus:translate-x-0.5"
                    aria-hidden="true"
                  />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <AlertDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
          <AlertDialogContent>
            <AlertDialogHeader className="text-left">
              <span
                aria-hidden="true"
                className="mb-1 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"
              >
                <LogOut className="size-4" />
              </span>
              <AlertDialogTitle>Sign out of Startweb?</AlertDialogTitle>
              <AlertDialogDescription>
                Anything you have not saved on this page will be lost. You can sign back in at any
                time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Stay signed in</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut}>Sign out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
