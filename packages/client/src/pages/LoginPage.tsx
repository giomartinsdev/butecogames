import { useSearchParams } from "react-router-dom";
import { DiscordLoginButton } from "@/components/auth/DiscordLoginButton.js";

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <img
          src="/imgs/logo_buteco.png"
          alt="Buteco Games"
          className="mx-auto mb-2 h-75"
        />
        <p className="mt-4 text-lg text-muted-foreground">
          A plataforma de jogos da comunidade do Buteco dos Devs
        </p>
        {error === "guild" && (
          <p className="mt-4 max-w-sm rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Voce precisa ser membro do servidor do Discord para acessar a
            plataforma.
          </p>
        )}
        <div className="mt-8">
          <DiscordLoginButton />
        </div>
      </div>
    </div>
  );
}
