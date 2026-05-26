import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import logo from "@/assets/she-logo.jpg";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function AuthModal() {
  const { authOpen, closeAuth, authTab, signIn, signUp, signInWithGoogle } = useAuth();

  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");
  const [signinLoading, setSigninLoading] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setSigninLoading(true);
    const { error } = await signIn(signinEmail, signinPassword);
    setSigninLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Welcome back!");
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (signupPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSignupLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setSignupLoading(false);
    if (error) {
      toast.error(error);
    } else {
      setSignupDone(true);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signInWithGoogle();
    // page redirects, so loading state resets naturally
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      closeAuth();
      setSignupDone(false);
    }
  }

  return (
    <Dialog open={authOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/60">
        <DialogHeader className="text-center items-center">
          <img src={logo} alt="SHEtoken" className="h-10 w-10 rounded-full object-cover mb-2" />
          <DialogTitle className="text-xl font-bold">
            <span className="text-gradient">SHEtoken</span> account
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Access the WEI dashboard, focus groups and your saved countries.
          </DialogDescription>
        </DialogHeader>

        {signupDone ? (
          /* Post-signup confirmation */
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto">
              <Mail className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="font-semibold">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground font-medium">{signupEmail}</span>.
              Click it to activate your account.
            </p>
            <Button variant="outline" className="mt-4 w-full" onClick={() => handleOpenChange(false)}>
              Got it
            </Button>
          </div>
        ) : (
          <Tabs defaultValue={authTab} key={authTab} className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="signin" className="flex-1">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1">Create account</TabsTrigger>
            </TabsList>

            {/* ── SIGN IN ── */}
            <TabsContent value="signin" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-border/60"
                onClick={handleGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GoogleIcon />}
                <span className="ml-2">Continue with Google</span>
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border/40" />
                or
                <div className="flex-1 h-px bg-border/40" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="bg-background/60 border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-background/60 border-border/60"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={signinLoading}
                  className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90"
                >
                  {signinLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            {/* ── SIGN UP ── */}
            <TabsContent value="signup" className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-border/60"
                onClick={handleGoogle}
                disabled={googleLoading}
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <GoogleIcon />}
                <span className="ml-2">Sign up with Google</span>
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border/40" />
                or
                <div className="flex-1 h-px bg-border/40" />
              </div>

              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Jane Smith"
                    className="bg-background/60 border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="bg-background/60 border-border/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="bg-background/60 border-border/60"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full bg-gradient-primary text-primary-foreground border-0 shadow-gold hover:opacity-90"
                >
                  {signupLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create account
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center">
                By creating an account you agree to our{" "}
                <a href="/whitepaper" className="underline hover:text-foreground">terms of use</a>.
              </p>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
