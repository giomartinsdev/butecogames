import { AppCard, type AppInfo } from "@/components/apps/AppCard.js";

const APPS: AppInfo[] = [
  {
    id: "political-compass",
    name: "Bússola Política",
    description:
      "Descubra seu posicionamento político no espectro econômico e social. Responda as perguntas e compare com os outros membros!",
    thumbnail: "/imgs/apps/political_compass.png",
    path: "/apps/political-compass",
    available: true,
  },
  {
    id: "master",
    name: "Mestre",
    description:
      "O Mestre é seu mentor experiente e ranzinza. Peça conselhos, tire dúvidas ou peça para ele pintar algo para você (se ele estiver de bom humor).",
    thumbnail: "/imgs/apps/master.png",
    path: "/apps/master",
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
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
