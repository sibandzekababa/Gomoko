import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllGames } from "@/app/games/_lib/loader";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  hard: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

const STATUS_LABEL = {
  done: "Playable",
  "in-progress": "In progress",
  unclaimed: "Unclaimed",
};

function GameCard({ game }) {
  const isDone = game.status === "done";

  return (
    <Link href={`/games/${game.slug}`} className="group focus-visible:outline-none">
      <Card className="group-hover:border-primary/60 group-focus-visible:border-primary h-full transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{game.title}</CardTitle>
            <Badge className={DIFFICULTY_STYLES[game.difficulty] ?? ""}>{game.difficulty}</Badge>
          </div>
          <CardDescription>{game.description || "No description yet."}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm">
          <span
            className={isDone ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}
          >
            {isDone ? "▶ Play now" : `🚧 ${STATUS_LABEL[game.status] ?? "Unclaimed"}`}
          </span>
          <span className="text-muted-foreground">
            {game.author ? `by ${game.author}` : game.issue ? `issue #${game.issue}` : ""}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function HomePage() {
  const games = await getAllGames();
  const playable = games.filter((g) => g.status === "done").length;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AkiraChix Games Arcade</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          {games.length} games, built by students learning Next.js — one game per person, each
          shipped through a real pull request. {playable} playable so far.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </main>
  );
}
