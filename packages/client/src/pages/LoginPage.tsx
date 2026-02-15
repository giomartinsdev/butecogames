import { DiscordLoginButton } from "@/components/auth/DiscordLoginButton.js";

export function LoginPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <img
          src="/logo-buteco.png"
          alt="Buteco Games"
          className="mx-auto mb-2 h-75"
        />
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
