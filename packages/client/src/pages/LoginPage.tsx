import { DiscordLoginButton } from "@/components/auth/DiscordLoginButton.js";

export function LoginPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-primary">Buteco Games</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A plataforma de jogos da comunidade do Buteco
        </p>
        <div className="mt-8">
          <DiscordLoginButton />
        </div>
      </div>
    </div>
  );
}
