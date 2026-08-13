import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardCheck, Link2, Paperclip } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/SmartImage";
import { fetchMyProjects, fetchProjectMessages } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { avatarPhoto, imageCandidates } from "@/lib/images";
import type { ChatMessage, ProjectMember } from "@/lib/types";
import { toast } from "sonner";

const WS_URL =
  (import.meta as { env?: Record<string, string> }).env?.VITE_WS_URL ??
  "http://localhost:8082/ws/chat";

const ATTACHMENT_PREFIX = "__ATTACHMENT__:";
const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024; // 3 MB raw file size
const MAX_MESSAGE_BYTES = 5 * 1024 * 1024; // WebSocket message limit

function formatTime(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes <= 0) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function renderMessageContent(content: string) {
  if (content.startsWith(ATTACHMENT_PREFIX)) {
    try {
      const payload = JSON.parse(content.slice(ATTACHMENT_PREFIX.length)) as {
        name: string;
        type: string;
        size: number;
        dataUrl: string;
      };
      const isImage = payload.type?.startsWith("image/");
      if (isImage) {
        return (
          <div className="space-y-2">
            <a href={payload.dataUrl} target="_blank" rel="noreferrer">
              <img
                src={payload.dataUrl}
                alt={payload.name}
                className="max-h-64 w-full rounded-lg object-cover"
              />
            </a>
            <div className="text-xs opacity-80">
              {payload.name} • {formatFileSize(payload.size)}
            </div>
          </div>
        );
      }
      return (
        <div className="space-y-1">
          <div className="font-medium">{payload.name}</div>
          <div className="text-xs opacity-80">
            {formatFileSize(payload.size)}
          </div>
          <a
            href={payload.dataUrl}
            download={payload.name}
            className="underline underline-offset-2 text-xs"
          >
            Telecharger
          </a>
        </div>
      );
    } catch {
      return <span>{content}</span>;
    }
  }

  const parts = content.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={`link-${index}`}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          {part}
        </a>
      );
    }
    return <span key={`text-${index}`}>{part}</span>;
  });
}

function buildMeetLink() {
  const segment = () => Math.random().toString(36).slice(2, 5);
  return `https://meet.google.com/${segment()}-${segment()}-${segment()}`;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function StudentChatPage() {
  const { userEmail, userName } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingNote, setMeetingNote] = useState("");
  const [recapOpen, setRecapOpen] = useState(false);
  const [recapText, setRecapText] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stompRef = useRef<Client | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pendingMessagesRef = useRef<Set<string>>(new Set());

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["student-chat-projects", userEmail],
    queryFn: fetchMyProjects,
    enabled: Boolean(userEmail),
  });

  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const { data: history = [] } = useQuery({
    queryKey: ["chat-history", selectedProjectId],
    queryFn: () => fetchProjectMessages(selectedProjectId),
    enabled: Boolean(selectedProjectId),
  });

  useEffect(() => {
    setMessages(history);
  }, [history]);

  useEffect(() => {
    if (!selectedProjectId || !userEmail) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/projects/${selectedProjectId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body) as ChatMessage;
            if (payload.senderEmail === userEmail && pendingMessagesRef.current.has(payload.content)) {
              pendingMessagesRef.current.delete(payload.content);
              return;
            }
            setMessages((prev) => [...prev, payload]);
          } catch {
            // ignore malformed messages
          }
        });
      },
      onStompError: () => {
        toast.error("Erreur de connexion au chat");
      },
      onWebSocketError: () => {
        toast.error("WebSocket indisponible");
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
    };
  }, [selectedProjectId, userEmail]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const members = useMemo<ProjectMember[]>(
    () => selectedProject?.membres || [],
    [selectedProject],
  );

  const appendLocalMessage = (content: string) => {
    if (!selectedProjectId || !userEmail) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        projectId: selectedProjectId,
        senderEmail: userEmail,
        senderName: userName || userEmail,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const sendMessage = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return false;
    if (!selectedProjectId || !userEmail) {
      toast.error("Selectionnez un projet pour envoyer un fichier");
      return false;
    }
    if (!stompRef.current?.connected) {
      toast.error("Connexion chat indisponible. Reessayez.");
      return false;
    }

    const payload = {
      projectId: selectedProjectId,
      senderEmail: userEmail,
      senderName: userName || userEmail,
      content: trimmed,
    };

    stompRef.current?.publish({
      destination: "/app/chat.send",
      body: JSON.stringify(payload),
    });
    pendingMessagesRef.current.add(trimmed);
    appendLocalMessage(trimmed);
    return true;
  };

  const handleSend = () => {
    if (sendMessage(draft)) {
      setDraft("");
    }
  };

  const handleScheduleMeeting = () => {
    if (!meetingDate || !meetingTime) return;
    const meetLink = buildMeetLink();
    const when = `${meetingDate} ${meetingTime}`;
    const note = meetingNote.trim();
    const content = [
      "Reunion planifiee",
      `Quand: ${when}`,
      note ? `Message: ${note}` : "",
      `Google Meet: ${meetLink}`,
    ]
      .filter(Boolean)
      .join("\n");

    sendMessage(content);
    setMeetingOpen(false);
    setMeetingDate("");
    setMeetingTime("");
    setMeetingNote("");
  };

  const handleSendRecap = () => {
    const recap = recapText.trim();
    if (!recap) return;
    const content = ["Compte rendu", recap].join("\n");
    if (!sendMessage(content)) return;
    setRecapOpen(false);
    setRecapText("");
  };

  const handleSendLink = () => {
    const url = normalizeUrl(linkUrl);
    if (!url) return;
    const note = linkNote.trim();
    const content = ["Lien utile", url, note ? `Note: ${note}` : ""]
      .filter(Boolean)
      .join("\n");
    if (!sendMessage(content)) return;
    setLinkOpen(false);
    setLinkUrl("");
    setLinkNote("");
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Fichier trop volumineux (max 3 MB)");
      event.target.value = "";
      return;
    }

    const estimatedBase64Bytes = Math.ceil(file.size / 3) * 4;
    const estimatedPayloadBytes = estimatedBase64Bytes + 512;
    if (estimatedPayloadBytes > MAX_MESSAGE_BYTES) {
      toast.error("Fichier trop volumineux pour l'envoi dans le chat");
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const payload = {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
      };
      if (sendMessage(`${ATTACHMENT_PREFIX}${JSON.stringify(payload)}`)) {
        toast.success("Fichier envoye");
      }
    } catch {
      toast.error("Impossible de lire le fichier");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr_260px]">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium">Projets en commun</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun projet</p>
          ) : (
            <div className="space-y-2">
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.titre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                {selectedProject
                  ? `Projet selectionne: ${selectedProject.titre}`
                  : "Choisissez un projet"}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-card flex flex-col min-h-[520px] h-[calc(100vh-220px)]">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-medium">Discussion</h2>
              <p className="text-xs text-muted-foreground">
                Canal du projet en commun
              </p>
            </div>
            {selectedProject && (
              <Badge variant="outline">{selectedProject.titre}</Badge>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun message pour le moment.
              </p>
            ) : (
              messages.map((message) => {
                const isMine = message.senderEmail === userEmail;
                const senderLabel = message.senderName || message.senderEmail;
                const avatarSeed = message.senderEmail || message.senderName;
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {!isMine && (
                      <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0">
                        <SmartImage
                          sources={imageCandidates(
                            undefined,
                            avatarPhoto(avatarSeed),
                          )}
                          alt={senderLabel || "Avatar"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-xl px-3 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    >
                      <div className="text-xs opacity-80 mb-1">
                        {senderLabel} • {formatTime(message.createdAt)}
                      </div>
                      <div className="whitespace-pre-wrap break-words">
                        {renderMessageContent(message.content)}
                      </div>
                    </div>
                    {isMine && (
                      <div className="h-8 w-8 rounded-full bg-muted overflow-hidden shrink-0">
                        <SmartImage
                          sources={imageCandidates(
                            undefined,
                            avatarPhoto(avatarSeed),
                          )}
                          alt={senderLabel || "Avatar"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t p-3 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedProjectId}
                  >
                    <CalendarClock className="h-4 w-4" />
                    Planifier une reunion
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Planifier une reunion</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Date</p>
                        <Input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Heure</p>
                        <Input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Message</p>
                      <Textarea
                        value={meetingNote}
                        onChange={(e) => setMeetingNote(e.target.value)}
                        placeholder="Ordre du jour, objectifs..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setMeetingOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleScheduleMeeting}
                        disabled={!meetingDate || !meetingTime}
                      >
                        Envoyer l'invitation
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={recapOpen} onOpenChange={setRecapOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedProjectId}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Envoyer un compte rendu
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Envoyer un compte rendu</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Textarea
                      value={recapText}
                      onChange={(e) => setRecapText(e.target.value)}
                      placeholder="Points cles, decisions, prochaines etapes..."
                      rows={4}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setRecapOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSendRecap}
                        disabled={!recapText.trim()}
                      >
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedProjectId}
                  >
                    <Link2 className="h-4 w-4" />
                    Partager un lien
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Partager un lien</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    <Textarea
                      value={linkNote}
                      onChange={(e) => setLinkNote(e.target.value)}
                      placeholder="Pourquoi ce lien est utile ?"
                      rows={3}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setLinkOpen(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleSendLink}
                        disabled={!linkUrl.trim()}
                      >
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handlePickFile}
                disabled={!selectedProjectId}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt"
                onChange={handleFileChange}
              />
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ecrire un message..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!draft.trim() || !selectedProjectId}
              >
                Envoyer
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="font-medium">Membres et roles</h2>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun membre</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      {member.nom || member.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.email}
                    </div>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
