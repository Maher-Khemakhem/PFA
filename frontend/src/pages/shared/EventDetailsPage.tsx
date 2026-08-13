import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Users, ArrowLeft, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { SmartImage } from "@/components/SmartImage";
import { avatarPhoto, eventPhoto, imageCandidates } from "@/lib/images";
import { useAuth } from "@/lib/auth-context";
import {
  addEventComment,
  cancelEventParticipation,
  fetchEvent,
  fetchEventComments,
  participateInEvent,
} from "@/lib/api";
import { Event, EventComment } from "@/lib/types";
import { toast } from "sonner";

const fallbackPartnerNames = [
  "Azure", "Microsoft", "Google", "IBM", "Oracle", "SAP",
];

const fallbackPartnerLogos = [
  "https://upload.wikimedia.org/wikipedia/commons/a/a8/Microsoft_Azure_Logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg",
  "https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg",
];

const fallbackEventPhotos = [
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80",
];

function partnerLogoSources(name: string, index: number) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const domain = normalized ? `${normalized}.com` : `partner-${index}.com`;
  const clearbit = `https://logo.clearbit.com/${domain}`;
  const textFallback = `https://dummyimage.com/240x120/eff6ff/1d4ed8&text=${encodeURIComponent(name || "Partner")}`;
  const knownFallback = fallbackPartnerLogos[index % fallbackPartnerLogos.length];
  return imageCandidates(clearbit, knownFallback).concat(textFallback);
}

function uniqueStrings(values: (string | undefined)[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  });
  return result;
}

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { userEmail, userRole, userName } = useAuth();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery<Event | null>({
    queryKey: ["event", id],
    queryFn: () => (id ? fetchEvent(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });

  const participateMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      participateInEvent(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      toast.success("Participation enregistree");
    },
    onError: () => {
      toast.error("Erreur lors de l'inscription");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ eventId, email }: { eventId: string; email: string }) =>
      cancelEventParticipation(eventId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      toast.success("Participation annulee");
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation");
    },
  });

  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useQuery<EventComment[]>({
    queryKey: ["event", id, "comments"],
    queryFn: () => (id ? fetchEventComments(id) : Promise.resolve([])),
    enabled: Boolean(id),
  });

  const [commentMessage, setCommentMessage] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const commentMutation = useMutation({
    mutationFn: (message: string) =>
      addEventComment(id!, {
        authorName: userName || "Utilisateur",
        authorEmail: userEmail || "",
        message,
      }),
    onSuccess: () => {
      setCommentMessage("");
      setCommentError(null);
      queryClient.invalidateQueries({ queryKey: ["event", id, "comments"] });
    },
    onError: () => {
      setCommentError("Impossible d'ajouter le commentaire pour l'instant.");
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-muted-foreground">
          Chargement de l'evenement...
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Retour aux evenements
          </Link>
          <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border">
            Evenement introuvable.
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isJoined = userEmail ? event.participants.includes(userEmail) : false;
  const isFull = event.placesRestantes === 0;
  const canParticipate = userRole === "student";
  const filledCount = event.nombrePlaces - event.placesRestantes;
  const partners = event.partenaires.length > 0 ? event.partenaires : fallbackPartnerNames;
  const partnerLogos = event.partnerLogos && event.partnerLogos.length > 0 ? event.partnerLogos : [];
  const gallerySources = event.galleryPhotos && event.galleryPhotos.length > 0
    ? event.galleryPhotos
    : fallbackEventPhotos;
  const eventGallery = uniqueStrings([event.affiche, ...gallerySources]);

  const handleToggle = () => {
    if (!userEmail) {
      toast.error("Veuillez vous connecter");
      return;
    }
    if (isJoined) {
      cancelMutation.mutate({ eventId: event.id, email: userEmail });
    } else {
      participateMutation.mutate({ eventId: event.id, email: userEmail });
    }
  };

  const handleDownloadCertificate = () => {
    const participantName = userName || userEmail;
    if (!participantName) {
      toast.error("Nom du participant manquant");
      return;
    }
    if (canParticipate && !isJoined) {
      toast.error("Inscrivez-vous d'abord pour obtenir le certificat");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(236, 245, 255);
    doc.rect(0, 0, pageWidth, pageHeight, "F");

    doc.setFillColor(21, 94, 239);
    doc.rect(0, 0, pageWidth, 90, "F");

    doc.setFillColor(37, 99, 235);
    doc.circle(pageWidth - 110, 110, 80, "F");
    doc.setFillColor(59, 130, 246);
    doc.circle(pageWidth - 40, 70, 45, "F");

    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(2.5);
    doc.rect(36, 36, pageWidth - 72, pageHeight - 72);
    doc.setLineWidth(1);
    doc.setDrawColor(191, 219, 254);
    doc.rect(52, 52, pageWidth - 104, pageHeight - 104);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Certificat de participation", 70, 58);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("Ce certificat atteste que", pageWidth / 2, 170, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text(participantName, pageWidth / 2, 215, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("a participe a l'evenement", pageWidth / 2, 255, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(event.titre, pageWidth / 2, 295, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const dateLabel = new Date(event.dateHeure).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    doc.text(`Date: ${dateLabel}`, pageWidth / 2, 330, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(30, 64, 175);
    doc.text("FSTEAM", pageWidth / 2, pageHeight - 110, { align: "center" });
    doc.setTextColor(100, 116, 139);
    doc.text("Ce document est genere automatiquement.", pageWidth / 2, pageHeight - 90, { align: "center" });

    const safeTitle = event.titre.replace(/[^a-zA-Z0-9-_]+/g, "-").toLowerCase();
    doc.save(`certificat-${safeTitle || "evenement"}.pdf`);
  };

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentMessage.trim()) {
      setCommentError("Le commentaire ne peut pas etre vide.");
      return;
    }
    if (!userEmail) {
      setCommentError("Vous devez etre connecte pour commenter.");
      return;
    }
    commentMutation.mutate(commentMessage.trim());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux evenements
        </Link>

        <div className="bg-card rounded-2xl border overflow-hidden shadow-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr]">
            <div className="min-h-[260px] bg-muted">
              <SmartImage
                sources={imageCandidates(event.affiche, eventPhoto(event.id || event.titre))}
                alt={event.titre}
              />
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold">{event.titre}</h1>
                  <p className="text-sm text-muted-foreground mt-1">{event.type}</p>
                </div>
                <Badge variant={isFull ? "destructive" : "secondary"}>
                  {isFull ? "Complet" : `${event.placesRestantes} places`}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(event.dateHeure).toLocaleDateString("fr-FR")} a{" "}
                  {new Date(event.dateHeure).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {event.lieu}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> {filledCount}/{event.nombrePlaces} participants
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Organisateur</span>
                  <span className="text-sm text-foreground">{event.organisateur || "—"}</span>
                </div>
              </div>

              {event.partenaires.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Partenaires</p>
                  <div className="flex flex-wrap gap-2">
                    {event.partenaires.map((partner) => (
                      <Badge key={partner} variant="outline">
                        {partner}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Partenaires</p>
                  <span className="text-xs text-muted-foreground">Logos</span>
                </div>
                <Carousel opts={{ align: "start", loop: true }} className="px-8">
                  <CarouselContent>
                    {partners.map((partner, index) => {
                      const customLogo = partnerLogos[index];
                      const logoSources = customLogo
                        ? imageCandidates(customLogo, ...partnerLogoSources(partner, index))
                        : partnerLogoSources(partner, index);
                      return (
                      <CarouselItem key={`${partner}-${index}`} className="basis-1/2 md:basis-1/3">
                        <div className="h-20 rounded-lg border bg-white/70 flex items-center justify-center p-3">
                          <SmartImage
                            sources={logoSources}
                            alt={partner}
                            className="object-contain"
                          />
                        </div>
                        <p className="mt-2 text-xs text-center text-muted-foreground truncate">
                          {partner}
                        </p>
                      </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="-left-2" />
                  <CarouselNext className="-right-2" />
                </Carousel>
              </div>

              <div className="flex flex-wrap gap-2">
                {canParticipate && (
                  <Button
                    className="flex-1 min-w-[160px]"
                    variant={isJoined ? "outline" : "default"}
                    disabled={isFull && !isJoined}
                    onClick={handleToggle}
                  >
                    {isJoined ? "Annuler participation" : "Participer"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 min-w-[160px] gap-1"
                  onClick={handleDownloadCertificate}
                >
                  <Download className="h-4 w-4" /> Certificat
                </Button>
              </div>
            </div>
          </div>
          <div className="border-t p-6">
            <h2 className="font-display text-lg font-semibold mb-3">A propos</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {event.description || "Aucune description pour cet evenement."}
            </p>
            <div className="mt-6 rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-secondary/10 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Souvenirs des editions precedentes</p>
                <span className="text-xs text-muted-foreground">Cliquer pour agrandir</span>
              </div>
              <Carousel opts={{ align: "start", loop: true }} className="px-8">
                <CarouselContent>
                  {eventGallery.map((photo, index) => (
                    <CarouselItem key={`${photo}-${index}`} className="basis-full md:basis-1/2 lg:basis-1/3">
                      <button
                        type="button"
                        onClick={() => setSelectedPhoto(photo)}
                        className="group h-48 w-full overflow-hidden rounded-xl border bg-muted text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                      >
                        <SmartImage
                          sources={imageCandidates(photo, eventPhoto(`${event.id}-${index}`))}
                          alt={event.titre}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-2" />
                <CarouselNext className="-right-2" />
              </Carousel>
            </div>

            <div className="mt-6 rounded-2xl border bg-card/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">Commentaires</h3>
                <span className="text-xs text-muted-foreground">
                  {comments.length} commentaire{comments.length > 1 ? "s" : ""}
                </span>
              </div>

              <form className="mt-4 space-y-3" onSubmit={handleSubmitComment}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted">
                    <SmartImage
                      sources={imageCandidates("", avatarPhoto(userEmail || "guest"))}
                      alt={userName || userEmail || "Utilisateur"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <textarea
                    className="min-h-[110px] w-full rounded-2xl border border-input bg-background p-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Partager votre commentaire..."
                    value={commentMessage}
                    onChange={(event) => setCommentMessage(event.target.value)}
                  />
                </div>
                {commentError ? (
                  <p className="text-sm text-destructive">{commentError}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={commentMutation.isLoading}>
                    {commentMutation.isLoading ? "Envoi..." : "Publier"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {userName ? `Connecte en tant que ${userName}` : "Connectez-vous pour commenter."}
                  </span>
                </div>
              </form>

              <div className="mt-6 space-y-4">
                {commentsLoading ? (
                  <p className="text-sm text-muted-foreground">Chargement des commentaires...</p>
                ) : null}

                {!commentsLoading && comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Soyez le premier a commenter.</p>
                ) : null}

                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 overflow-hidden rounded-full border bg-muted">
                        <SmartImage
                          sources={imageCandidates("", avatarPhoto(comment.authorEmail || comment.authorName))}
                          alt={comment.authorName || "Utilisateur"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {comment.authorName || "Utilisateur"}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt
                              ? new Date(comment.createdAt).toLocaleString("fr-FR")
                              : ""}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground/80">{comment.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
        <PhotoDialog
          photo={selectedPhoto}
          onClose={(open) => {
            if (!open) setSelectedPhoto(null);
          }}
        />
    </DashboardLayout>
  );
}

function PhotoDialog({
  photo,
  onClose,
}: {
  photo: string | null;
  onClose: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(photo)} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-foreground/95 border-border">
        <DialogHeader>
          <DialogTitle className="text-background">Photo</DialogTitle>
        </DialogHeader>
        {photo ? (
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <SmartImage
              sources={imageCandidates(photo)}
              alt="Photo evenement"
              className="h-full w-full object-contain"
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
