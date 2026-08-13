import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRecommendations, refreshRecommendations } from "@/lib/api";
import { Recommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Lightbulb, ArrowRight, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { SmartImage } from "@/components/SmartImage";
import { eventPhoto, imageCandidates, projectPhoto } from "@/lib/images";

export default function RecommendationsPage() {
  const queryClient = useQueryClient();

  const { data: recommendations = [], isLoading, isError } = useQuery<Recommendation[]>({
    queryKey: ["recommendations"],
    queryFn: fetchRecommendations,
  });

  const refreshMutation = useMutation({
    mutationFn: refreshRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("Recommandations actualisées");
    },
    onError: () => {
      toast.error("Erreur lors de l'actualisation");
    },
  });

  if (isLoading)
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          Chargement des recommandations...
        </div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">
                Recommandations pour vous
              </h1>
              <p className="text-sm text-muted-foreground">
                Projets et événements adaptés à vos compétences
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="gap-1"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="font-semibold mb-2">
              {isError ? "Service de recommandation indisponible" : "Aucune recommandation disponible"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isError
                ? "Vérifiez que le service backend est démarré et connecté à MongoDB."
                : "Complétez votre profil avec vos compétences pour recevoir des recommandations personnalisées."}
            </p>
            <Button variant="outline" onClick={() => refreshMutation.mutate()}>
              Générer des recommandations
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((r) => {
              const isEvent = r.recommendationType === "EVENT";
              const target = isEvent ? "/events" : `/projects/${r.projetId}`;
              const label = isEvent ? "Événement" : "Projet";
              const actionLabel = isEvent ? "Voir événement" : "Voir projet";

              return (
                <div
                  key={r.id}
                  className="bg-card rounded-xl border overflow-hidden shadow-card hover:shadow-elevated transition-shadow"
                >
                  <div className="h-36 bg-muted">
                    <SmartImage
                      sources={imageCandidates(undefined, isEvent ? eventPhoto(r.eventId || r.titre) : projectPhoto(r.projetId || r.titre))}
                      alt={r.titre}
                    />
                  </div>
                  <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {r.categorie}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {r.competenceMatch}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {r.titre}
                  </h3>
                  <div className="mb-4 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p>{r.explication || "Cette recommandation correspond a votre profil et a vos competences."}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {r.competences.map((c) => (
                      <Badge
                        key={c}
                        variant="outline"
                        className="text-xs bg-muted/50"
                      >
                        {c}
                      </Badge>
                    ))}
                  </div>
                  <Link to={target}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                    >
                      {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
