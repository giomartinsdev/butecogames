import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

interface AppInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  available: boolean;
}

const APPS: AppInfo[] = [
  {
    id: "political-compass",
    name: "Bússola Política",
    description:
      "Descubra seu posicionamento político no espectro econômico e social. Responda as perguntas e compare com os outros membros!",
    icon: <Compass size={32} />,
    path: "/apps/political-compass",
    available: true,
  },
];

export function AppsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">Apps</h1>
        <p className="mt-1 text-muted-foreground">
          Ferramentas e atividades do Buteco
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => (
          <div
            key={app.id}
            className="rounded-xl border border-border bg-card overflow-hidden transition-transform hover:scale-[1.02]"
          >
            <div className="flex aspect-video items-center justify-center bg-secondary text-muted-foreground">
              {app.icon}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-card-foreground">
                {app.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {app.description}
              </p>
              <div className="mt-4">
                {app.available ? (
                  <Link
                    to={app.path}
                    className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Abrir
                  </Link>
                ) : (
                  <span className="inline-block rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground cursor-not-allowed">
                    Em breve
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
