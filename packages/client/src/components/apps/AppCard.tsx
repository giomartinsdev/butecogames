import { Link } from "react-router-dom";

export interface AppInfo {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  path: string;
  available: boolean;
}

export function AppCard({ app }: { app: AppInfo }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-transform hover:scale-[1.02]">
      <div className="aspect-video bg-secondary">
        <img
          src={app.thumbnail}
          alt={app.name}
          className="h-full w-full object-cover"
        />
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
  );
}
