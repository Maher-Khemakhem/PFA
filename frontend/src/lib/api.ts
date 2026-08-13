import type { ChatMessage, Event, EventComment, Notification, Project, ProjectMember, Recommendation, Task, TaskComment, User } from "./types";

const storage = {
  token: "auth_token",
  email: "auth_email",
} as const;

type ProjetRaw = {
  id?: unknown;
  titre?: unknown;
  desc?: unknown;
  chefProjet?: unknown;
  organisation?: unknown;
  deadline?: unknown;
  status?: unknown;
  visibilite?: unknown;
  progression?: unknown;
  membres?: unknown;
  memberRoles?: unknown;
  ressources?: unknown;
  taches?: unknown;
};

type RessourceRaw = {
  nom?: unknown;
  // Backend entity uses "valeur" as the field name
  valeur?: unknown;
};

type ChatMessageRaw = {
  id?: unknown;
  projectId?: unknown;
  senderEmail?: unknown;
  senderName?: unknown;
  content?: unknown;
  createdAt?: unknown;
};

type TacheRaw = {
  id?: unknown;
  titre?: unknown;
  description?: unknown;
  echeance?: unknown;
  status?: unknown;
  progression?: unknown;
  commentaire?: unknown;
  priorite?: unknown;
  // FIX: backend Tache has membresEmails (List<String>), not a single assignee
  membresEmails?: unknown;
  comments?: unknown;
};

type UserRaw = {
  id?: unknown;
  email?: unknown;
  name?: unknown;
  role?: unknown;
  faculte?: unknown;
  specialite?: unknown;
  idUniversitaire?: unknown;
  competences?: unknown;
  avatar?: unknown;
  organizationType?: unknown;
  partnerLogos?: unknown;
  responsableNom?: unknown;
  galleryPhotos?: unknown;
  responsableEmail?: unknown;
  responsableTelephone?: unknown;
  sponsors?: unknown;
  logo?: unknown;
};

export type AuthRegisterPayload = {
  email: string;
  password: string;
  name: string;
  role: "INDIVIDU" | "ORGANISATION" | "ADMIN";
  faculte?: string;
  specialite?: string;
  idUniversitaire?: string;
  competences?: string[];
  avatar?: string;
  organizationType?: string;
  responsableNom?: string;
  responsableEmail?: string;
  responsableTelephone?: string;
  sponsors?: string[];
  logo?: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "INDIVIDU" | "ORGANISATION" | "ADMIN" | string;
  faculte?: string;
  specialite?: string;
  idUniversitaire?: string;
  competences?: string[];
  avatar?: string;
  organizationType?: string;
  responsableNom?: string;
  responsableEmail?: string;
  responsableTelephone?: string;
  sponsors?: string[];
  logo?: string;
};

function getAuthToken() {
  return localStorage.getItem(storage.token);
}

function getAuthEmail() {
  return localStorage.getItem(storage.email) || "";
}

function asString(v: unknown): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

function asNumber(v: unknown): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapAdminUser(u: UserRaw): AdminUser {
  return {
    id: asString(u.id),
    name: asString(u.name || u.email),
    email: asString(u.email),
    role: asString(u.role),
    faculte: asString(u.faculte),
    specialite: asString(u.specialite),
    idUniversitaire: asString(u.idUniversitaire),
    competences: Array.isArray(u.competences)
      ? (u.competences as unknown[]).map(asString)
      : [],
    avatar: asString(u.avatar),
    organizationType: asString(u.organizationType),
    responsableNom: asString(u.responsableNom),
    responsableEmail: asString(u.responsableEmail),
    responsableTelephone: asString(u.responsableTelephone),
    sponsors: Array.isArray(u.sponsors) ? (u.sponsors as unknown[]).map(asString) : [],
    logo: asString(u.logo),
  };
}

export const login = async (email: string, password: string): Promise<{ token: string }> => {
  return apiJson<{ token: string }>(`/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
};

export const registerUser = async (payload: AuthRegisterPayload): Promise<{ token: string }> => {
  return apiJson<{ token: string }>(`/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
};

export const fetchUserByEmail = async (email: string): Promise<UserRaw> => {
  return apiJson<UserRaw>(`/auth/users/${encodeURIComponent(email)}`);
};

export const fetchUsersByRole = async (
  role: "INDIVIDU" | "ORGANISATION" | "ADMIN"
): Promise<AdminUser[]> => {
  try {
    const users = await apiJson<UserRaw[]>(`/auth/users?role=${encodeURIComponent(role)}`);
    return Array.isArray(users) ? users.map(mapAdminUser) : [];
  } catch {
    return [];
  }
};

export const fetchAdminStudents = async (): Promise<AdminUser[]> => {
  return fetchUsersByRole("INDIVIDU");
};

export const fetchAdminOrganizations = async (): Promise<AdminUser[]> => {
  return fetchUsersByRole("ORGANISATION");
};

export const deleteUser = async (email: string): Promise<void> => {
  await apiJson<void>(`/auth/users/${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
};

// FIX: use text/plain for DELETE/PATCH with no body to avoid 415 errors;
// for responses with no body (204 No Content) we skip JSON parsing entirely.
async function apiJson<T>(input: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  // FIX: 204 No Content responses have no body — attempting res.json() throws.
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as unknown as T;
  }

  return (await res.json()) as T;
}

function mapProjectStatus(status: string | undefined): Project["statut"] {
  switch ((status || "").toUpperCase()) {
    case "EN_ATTENTE":
      return "Planifié";
    case "EN_COURS":
      return "En cours";
    case "TERMINE":
      return "Terminé";
    case "ANNULE":
      return "Planifié";
    default:
      return "Planifié";
  }
}

function mapTaskStatus(status: string | undefined): Task["statut"] {
  switch ((status || "").toUpperCase()) {
    case "EN_ATTENTE":
      return "Non commencée";
    case "EN_COURS":
      return "En cours";
    case "TERMINE":
      return "Terminée";
    case "ANNULE":
      return "Non commencée";
    default:
      return "Non commencée";
  }
}

function mapTaskPriority(priority: string | undefined): Task["priorite"] {
  const p = (priority || "").toUpperCase();
  if (p === "HIGH") return "High";
  if (p === "MEDIUM") return "Medium";
  if (p === "LOW") return "Low";
  if (p === "HIGH" || p === "H") return "High";
  if (p === "MEDIUM" || p === "M") return "Medium";
  if (p === "LOW" || p === "L") return "Low";
  // fallback to title case inputs
  if (priority === "High" || priority === "Medium" || priority === "Low") return priority;
  return "Low";
}

function mapProject(p: ProjetRaw): Project {
  const emails: string[] = Array.isArray(p.membres)
    ? (p.membres as unknown[]).map(asString)
    : [];
  const chefEmail: string = asString(p.chefProjet);
  const rolesRaw =
    p.memberRoles && typeof p.memberRoles === "object"
      ? (p.memberRoles as Record<string, unknown>)
      : {};
  const taches: Task[] = Array.isArray(p.taches)
    ? (p.taches as unknown[]).map((t) => mapTask(t as TacheRaw, asString(p.id)))
    : [];

  return {
    id: asString(p.id),
    titre: asString(p.titre),
    description: asString(p.desc),
    categorie: asString(p.organisation),
    dateDebut: "",
    dateFin: p.deadline ? asString(p.deadline) : "",
    chefDeProjet: chefEmail,
    chefDeProjetNom: chefEmail,
    statut: mapProjectStatus(asString(p.status)),
    visibilite: asString(p.visibilite).toUpperCase() === "PRIVE" ? "PRIVE" : "PUBLIC",
    progression: asNumber(p.progression),
    membres: emails.map((email) => {
      const isChef = email === chefEmail;
      const roleRaw = rolesRaw[email];
      return {
        id: email,
        userId: email,
        nom: email,
        email,
        role: mapMemberRole(roleRaw, isChef),
      };
    }),
    ressources: (
      Array.isArray(p.ressources)
        ? (p.ressources as unknown[]).map((r) => r as RessourceRaw)
        : []
    ).map((r) => ({
      nom: asString(r.nom),
      // "valeur" in the Ressource entity maps to our frontend "lien" field
      lien: asString(r.valeur),
    })),
    taches,
  };
}

function mapMemberRole(value: unknown, isChef: boolean): ProjectMember["role"] {
  const role = asString(value).toUpperCase();
  if (role === "CHEF_DE_PROJET") return "Chef de projet";
  if (role === "MEMBRE_ACTIF") return "Membre actif";
  return isChef ? "Chef de projet" : "Membre actif";
}

function toBackendMemberRole(role?: ProjectMember["role"]): string | undefined {
  if (!role) return undefined;
  if (role === "Chef de projet") return "CHEF_DE_PROJET";
  if (role === "Membre actif") return "MEMBRE_ACTIF";
  return undefined;
}

// FIX: a single Tache can have multiple assignees (membresEmails).
// We now expose all of them and use the first as the primary display assignee.
function mapTask(t: TacheRaw, projectId: string): Task {
  const membresEmails: string[] = Array.isArray(t.membresEmails)
    ? (t.membresEmails as unknown[]).map(asString)
    : [];
  const primaryAssignee = membresEmails[0] ?? "";
  const comments: TaskComment[] = Array.isArray(t.comments)
    ? (t.comments as unknown[]).map((c) => {
        const comment = c as Record<string, unknown>;
        return {
          id: asString(comment.id),
          authorName: asString(comment.authorName),
          authorEmail: asString(comment.authorEmail),
          message: asString(comment.message),
          createdAt: asString(comment.createdAt),
        };
      })
    : [];

  return {
    id: asString(t.id),
    titre: asString(t.titre),
    description: asString(t.description),
    assigneA: primaryAssignee,
    assigneNom: primaryAssignee,
    membresEmails,
    // Backend Tache entity has no dateDebut field
    dateDebut: "",
    deadline: t.echeance ? asString(t.echeance) : "",
    priorite: mapTaskPriority(asString(t.priorite)),
    statut: mapTaskStatus(asString(t.status)),
    progression: asNumber(t.progression),
    commentaire: asString(t.commentaire),
    comments,
    projectId,
    // Expose the full list for components that need it
    //membresEmails,
  };
}

export const fetchProjectMembers = async (projetId: string): Promise<string[]> => {
  try {
    const members = await apiJson<string[]>(`/projets/${encodeURIComponent(projetId)}/membres`);
    return Array.isArray(members) ? members.map(asString) : [];
  } catch {
    return [];
  }
};

export const fetchProjectMessages = async (projetId: string): Promise<ChatMessage[]> => {
  try {
    const messages = await apiJson<ChatMessageRaw[]>(
      `/projets/${encodeURIComponent(projetId)}/messages`
    );
    return Array.isArray(messages)
      ? messages.map((m) => ({
          id: asString(m.id),
          projectId: asString(m.projectId),
          senderEmail: asString(m.senderEmail),
          senderName: asString(m.senderName),
          content: asString(m.content),
          createdAt: asString(m.createdAt),
        }))
      : [];
  } catch {
    return [];
  }
};

export const fetchCurrentUser = async (): Promise<User | null> => {
  const email = getAuthEmail();
  if (!email) return null;

  try {
    const u = await fetchUserByEmail(email);
    const name = asString(u.name || u.email);
    const parts = String(name).trim().split(/\s+/);
    const prenom = parts.length > 1 ? parts[0] : name;
    const nom = parts.length > 1 ? parts.slice(1).join(" ") : "";

    return {
      id: asString(u.id),
      prenom,
      nom,
      email: asString(u.email) || email,
      role: ((): User["role"] => {
        const r = asString(u.role).toUpperCase();
        if (r === "ORGANISATION") return "organization";
        if (r === "ADMIN") return "admin";
        return "student";
      })(),
      avatar: asString(u.avatar),
      faculte: asString(u.faculte),
      specialite: asString(u.specialite),
      competences: Array.isArray(u.competences)
        ? (u.competences as unknown[]).map(asString)
        : [],
      idUniversitaire: asString(u.idUniversitaire),
      organizationType: asString(u.organizationType),
      responsableNom: asString(u.responsableNom),
      responsableEmail: asString(u.responsableEmail),
      responsableTelephone: asString(u.responsableTelephone),
      sponsors: Array.isArray(u.sponsors) ? (u.sponsors as unknown[]).map(asString) : [],
      logo: asString(u.logo),
    };
  } catch {
    return null;
  }
};

export const updateUserProfile = async (profileData: {
  name?: string;
  faculte?: string;
  specialite?: string;
  idUniversitaire?: string;
  competences?: string[];
  avatar?: string;
  organizationType?: string;
  responsableNom?: string;
  responsableEmail?: string;
  responsableTelephone?: string;
  sponsors?: string[];
  logo?: string;
}): Promise<User> => {
  const email = getAuthEmail();
  if (!email) throw new Error("Not authenticated");

  const u = await apiJson<UserRaw>(`/auth/users/${encodeURIComponent(email)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData),
  });

  const name = asString(u.name || u.email);
  const parts = String(name).trim().split(/\s+/);
  const prenom = parts.length > 1 ? parts[0] : name;
  const nom = parts.length > 1 ? parts.slice(1).join(" ") : "";

  return {
    id: asString(u.id),
    prenom,
    nom,
    email: asString(u.email) || email,
    role: ((): User["role"] => {
      const r = asString(u.role).toUpperCase();
      if (r === "ORGANISATION") return "organization";
      if (r === "ADMIN") return "admin";
      return "student";
    })(),
    avatar: asString(u.avatar),
    faculte: asString(u.faculte),
    specialite: asString(u.specialite),
    competences: Array.isArray(u.competences)
      ? (u.competences as unknown[]).map(asString)
      : [],
    idUniversitaire: asString(u.idUniversitaire),
    organizationType: asString(u.organizationType),
    responsableNom: asString(u.responsableNom),
    responsableEmail: asString(u.responsableEmail),
    responsableTelephone: asString(u.responsableTelephone),
    sponsors: Array.isArray(u.sponsors) ? (u.sponsors as unknown[]).map(asString) : [],
    logo: asString(u.logo),
  };
};

export const fetchMembers = async (): Promise<ProjectMember[]> => {
  return [];
};

export const fetchProjects = async (): Promise<Project[]> => {
  const projectsRaw = await apiJson<ProjetRaw[]>(`/projets`);
  return projectsRaw.map(mapProject);
};

export const fetchPublicProjects = async (): Promise<Project[]> => {
  try {
    const projectsRaw = await apiJson<ProjetRaw[]>(`/projets/public`);
    return projectsRaw.map(mapProject);
  } catch {
    return [];
  }
};

export const fetchProjectsByChef = async (email: string): Promise<Project[]> => {
  if (!email) return [];

  try {
    const projectsRaw = await apiJson<ProjetRaw[]>(
      `/projets/chef/${encodeURIComponent(email)}`
    );
    return projectsRaw.map(mapProject);
  } catch {
    return [];
  }
};

export const fetchProjectsByMember = async (email: string): Promise<Project[]> => {
  if (!email) return [];

  try {
    const projectsRaw = await apiJson<ProjetRaw[]>(
      `/projets/membre/${encodeURIComponent(email)}`
    );
    return projectsRaw.map(mapProject);
  } catch {
    return [];
  }
};

export const fetchProjectsByOrganisation = async (organisation: string): Promise<Project[]> => {
  if (!organisation) return [];
  const projectsRaw = await apiJson<ProjetRaw[]>(
    `/projets/organisation/${encodeURIComponent(organisation)}`
  );
  return projectsRaw.map(mapProject);
};

export const fetchMyProjects = async (): Promise<Project[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  const [asChef, asMember] = await Promise.all([
    fetchProjectsByChef(email),
    fetchProjectsByMember(email),
  ]);

  const merged = new Map<string, Project>();
  for (const p of [...asChef, ...asMember]) {
    if (p.id) merged.set(p.id, p);
  }
  return Array.from(merged.values());
};

export const fetchProject = async (id: string): Promise<Project> => {
  const p = await apiJson<ProjetRaw>(`/projets/${encodeURIComponent(id)}`);
  return mapProject(p);
};

export const deleteProject = async (id: string): Promise<void> => {
  await apiJson<void>(`/projets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

export const updateProject = async (
  id: string,
  projectData: {
    titre: string;
    desc: string;
    chefProjet: string;
    organisation: string;
    deadline: string;
    status?: string;
    visibilite?: "PUBLIC" | "PRIVE";
    membres?: string[];
    objectifs?: string[];
    ressources?: Array<{ nom: string; valeur: string }>;
    affectations?: Record<string, string[]>;
  }
): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(`/projets/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...projectData,
      validite: true,
      visibilite: projectData.visibilite,
      membres: projectData.membres,
      objectifs: projectData.objectifs,
      ressources: projectData.ressources,
      affectations: projectData.affectations,
    }),
  });
  return mapProject(projetRaw);
};

// ==================== PROJECT MEMBERS ====================

export const addProjectMember = async (
  projetId: string,
  email: string,
  role?: ProjectMember["role"]
): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(`/projets/${encodeURIComponent(projetId)}/membres`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role: toBackendMemberRole(role) }),
  });
  return mapProject(projetRaw);
};

export const updateProjectMember = async (
  projetId: string,
  currentEmail: string,
  newEmail: string
): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(
    `/projets/${encodeURIComponent(projetId)}/membres/${encodeURIComponent(currentEmail)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newEmail }),
    }
  );
  return mapProject(projetRaw);
};

export const removeProjectMember = async (projetId: string, email: string): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(
    `/projets/${encodeURIComponent(projetId)}/membres/${encodeURIComponent(email)}`,
    { method: "DELETE" }
  );
  return mapProject(projetRaw);
};

export const updateProjectMemberRole = async (
  projetId: string,
  email: string,
  role: ProjectMember["role"]
): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(
    `/projets/${encodeURIComponent(projetId)}/membres/${encodeURIComponent(email)}/role`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: toBackendMemberRole(role) }),
    }
  );
  return mapProject(projetRaw);
};

// FIX: createProject payload now matches ProjetRequest fully.
// Added all optional fields so the backend does not receive null where it
// expects an empty list/map, which previously triggered NullPointerExceptions
// in the service layer (e.g. iterating request.getMembres()).
export const createProject = async (projectData: {
  titre: string;
  desc: string;
  chefProjet: string;
  organisation: string;
  deadline: string;
  validite: boolean;
  visibilite?: "PUBLIC" | "PRIVE";
  membres?: string[];
  objectifs?: string[];
  ressources?: Array<{ nom: string; valeur: string }>;
  affectations?: Record<string, string[]>;
}): Promise<Project> => {
  const payload = {
    titre: projectData.titre,
    desc: projectData.desc,
    chefProjet: projectData.chefProjet,
    organisation: projectData.organisation,
    deadline: projectData.deadline,
    validite: projectData.validite,
    visibilite: projectData.visibilite ?? "PUBLIC",
    // FIX: always send empty arrays/maps so the backend never receives null
    membres: projectData.membres ?? [],
    taches: [],
    objectifs: projectData.objectifs ?? [],
    ressources: projectData.ressources ?? [],
    affectations: projectData.affectations ?? {},
  };

  const projetRaw = await apiJson<ProjetRaw>(`/projets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return mapProject(projetRaw);
};

// FIX: fetchTasks now uses the correct mapTask signature (no stale assigneeEmail
// argument). Tasks are fetched per-project for the current user via the
// GET /projets/{id}/taches/membre/{email} endpoint, which already filters by
// the member — no second filter needed on the frontend.
export const fetchTasks = async (): Promise<Task[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  const projects = await fetchMyProjects();
  const projectIds = projects.map((p) => asString(p.id)).filter(Boolean);

  const tasksNested = await Promise.all(
    projectIds.map(async (projectId) => {
      try {
        const tasksRaw = await apiJson<TacheRaw[]>(
          `/projets/${encodeURIComponent(projectId)}/taches/membre/${encodeURIComponent(email)}`
        );
        // FIX: pass only projectId — assignee is derived from membresEmails inside mapTask
        return tasksRaw.map((t) => mapTask(t, projectId));
      } catch {
        return [];
      }
    })
  );

  return tasksNested.flat();
};

export const fetchTask = async (id: string): Promise<Task | undefined> => {
  const tasks = await fetchTasks();
  return tasks.find((t) => t.id === id);
};

// ==================== TASK CRUD (matches ProjetController tache endpoints) ====================

// FIX: expose addTache so the UI can create tasks via POST /projets/{id}/taches.
// TacheRequest fields: titre, description, status, echeance, progression, membresEmails.
export const addTask = async (
  projetId: string,
  taskData: {
    titre: string;
    description: string;
    echeance?: string;
    priorite?: Task["priorite"];
    membresEmails: string[];
  }
): Promise<Project> => {
  const payload = {
    titre: taskData.titre,
    description: taskData.description,
    // Backend default for new tasks is EN_ATTENTE — omit status to let it default,
    // or send explicitly:
    status: "EN_ATTENTE",
    echeance: taskData.echeance ?? null,
    progression: 0,
    priorite: taskData.priorite ?? "Low",
    membresEmails: taskData.membresEmails,
  };

  const projetRaw = await apiJson<ProjetRaw>(
    `/projets/${encodeURIComponent(projetId)}/taches`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return mapProject(projetRaw);
};

export const addTaskMembers = async (
  projetId: string,
  tacheId: string,
  emails: string[]
): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(
    `/projets/${encodeURIComponent(projetId)}/taches/${encodeURIComponent(tacheId)}/membres`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    }
  );
  return mapProject(projetRaw);
};

export const replaceTaskMembers = async (
  projetId: string,
  tacheId: string,
  emails: string[]
): Promise<Project> => {
  const projetRaw = await apiJson<ProjetRaw>(
    `/projets/${encodeURIComponent(projetId)}/taches/${encodeURIComponent(tacheId)}/membres`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails }),
    }
  );
  return mapProject(projetRaw);
};

export const fetchTaskComments = async (
  projetId: string,
  tacheId: string
): Promise<TaskComment[]> => {
  try {
    const comments = await apiJson<TaskComment[]>(
      `/projets/${encodeURIComponent(projetId)}/taches/${encodeURIComponent(tacheId)}/commentaires`
    );
    return Array.isArray(comments) ? comments : [];
  } catch {
    return [];
  }
};

export const addTaskComment = async (
  projetId: string,
  tacheId: string,
  payload: { authorName: string; authorEmail: string; message: string }
): Promise<TaskComment> => {
  return apiJson<TaskComment>(
    `/projets/${encodeURIComponent(projetId)}/taches/${encodeURIComponent(tacheId)}/commentaires`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
};

// FIX: expose updateTache so the UI can update tasks via PUT /projets/{id}/taches/{tacheId}.
export const updateTask = async (
  projetId: string,
  tacheId: string,
  taskData: {
    titre: string;
    description: string;
    status?: string;
    echeance?: string;
    progression?: number;
    commentaire?: string;
    priorite?: Task["priorite"];
    membresEmails?: string[];
    updatedByEmail?: string;
  }
): Promise<Project> => {
  const payload = {
    titre: taskData.titre,
    description: taskData.description,
    status: taskData.status ?? "EN_ATTENTE",
    echeance: taskData.echeance ?? null,
    progression: taskData.progression ?? 0,
    commentaire: taskData.commentaire ?? "",
    priorite: taskData.priorite,
    membresEmails: taskData.membresEmails ?? [],
    updatedByEmail: taskData.updatedByEmail ?? "",
  };

  const projetRaw = await apiJson<ProjetRaw>(
    `/projets/${encodeURIComponent(projetId)}/taches/${encodeURIComponent(tacheId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return mapProject(projetRaw);
};

// FIX: expose deleteTask so the UI can delete tasks via DELETE /projets/{id}/taches/{tacheId}.
// The backend returns 204 No Content — apiJson now handles that correctly.
export const deleteTask = async (projetId: string, tacheId: string): Promise<void> => {
  await apiJson<void>(
    `/projets/${encodeURIComponent(projetId)}/taches/${encodeURIComponent(tacheId)}`,
    { method: "DELETE" }
  );
};

// ==================== EVENT ENDPOINTS ====================

type EventRaw = {
  id?: unknown;
  titre?: unknown;
  description?: unknown;
  type?: unknown;
  organisateur?: unknown;
  dateHeure?: unknown;
  lieu?: unknown;
  nombrePlaces?: unknown;
  placesRestantes?: unknown;
  participants?: unknown;
  partenaires?: unknown;
  affiche?: unknown;
};

function mapEvent(e: EventRaw): Event {
  return {
    id: asString(e.id),
    titre: asString(e.titre),
    description: asString(e.description),
    type: asString(e.type),
    lieu: asString(e.lieu),
    dateHeure: asString(e.dateHeure),
    nombrePlaces: asNumber(e.nombrePlaces),
    placesRestantes: asNumber(e.placesRestantes),
    affiche: asString(e.affiche),
    organisateur: asString(e.organisateur),
    createurs: [asString(e.organisateur)],
    partenaires: Array.isArray(e.partenaires)
      ? (e.partenaires as unknown[]).map(asString)
      : [],
    partnerLogos: Array.isArray(e.partnerLogos)
      ? (e.partnerLogos as unknown[]).map(asString)
      : [],
    participants: Array.isArray(e.participants)
      ? (e.participants as unknown[]).map(asString)
      : [],
    galleryPhotos: Array.isArray(e.galleryPhotos)
      ? (e.galleryPhotos as unknown[]).map(asString)
      : [],
  };
}

export const fetchEvents = async (): Promise<Event[]> => {
  try {
    const eventsRaw = await apiJson<EventRaw[]>(`/events`);
    return eventsRaw.map(mapEvent);
  } catch {
    return [];
  }
};

export const fetchEvent = async (id: string): Promise<Event | null> => {
  try {
    const eventRaw = await apiJson<EventRaw>(`/events/${encodeURIComponent(id)}`);
    console.log("Fetched event:", eventRaw);
    return mapEvent(eventRaw);
  } catch {
    return null;
  }
};

export const createEvent = async (eventData: {
  titre: string;
  description: string;
  type: string;
  organisateur: string;
  dateHeure: string;
  lieu: string;
  nombrePlaces: number;
  partenaires?: string[];
  partnerLogos?: string[];
  affiche?: string;
  galleryPhotos?: string[];
}): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(`/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  console.log("Created event:", eventRaw);
  return mapEvent(eventRaw);
};

export const updateEvent = async (
  id: string,
  eventData: {
    titre: string;
    description: string;
    type: string;
    organisateur: string;
    dateHeure: string;
    lieu: string;
    nombrePlaces: number;
    partenaires?: string[];
    partnerLogos?: string[];
    affiche?: string;
    galleryPhotos?: string[];
  }
): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(`/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  return mapEvent(eventRaw);
};

// FIX: backend DELETE /events/{id} returns 204 No Content.
// apiJson now skips JSON parsing for 204 responses so this no longer throws.
export const deleteEvent = async (id: string): Promise<void> => {
  await apiJson<void>(`/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

export const participateInEvent = async (id: string, email: string): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(`/events/${encodeURIComponent(id)}/participate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return mapEvent(eventRaw);
};

export const cancelEventParticipation = async (id: string, email: string): Promise<Event> => {
  const eventRaw = await apiJson<EventRaw>(
    `/events/${encodeURIComponent(id)}/participate/${encodeURIComponent(email)}`,
    { method: "DELETE" }
  );
  return mapEvent(eventRaw);
};

export const fetchMyEventParticipations = async (): Promise<Event[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const eventsRaw = await apiJson<EventRaw[]>(
      `/events/participations/${encodeURIComponent(email)}`
    );
    return eventsRaw.map(mapEvent);
  } catch {
    return [];
  }
};

export const fetchEventsByOrganizer = async (): Promise<Event[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  try {
    const eventsRaw = await apiJson<EventRaw[]>(
      `/events/organisateur/${encodeURIComponent(email)}`
    );
    return eventsRaw.map(mapEvent);
  } catch {
    return [];
  }
};

// ==================== EVENT COMMENTS ====================

type EventCommentRaw = {
  id?: unknown;
  authorName?: unknown;
  authorEmail?: unknown;
  message?: unknown;
  createdAt?: unknown;
};

function mapEventComment(comment: EventCommentRaw): EventComment {
  return {
    id: asString(comment.id),
    authorName: asString(comment.authorName),
    authorEmail: asString(comment.authorEmail),
    message: asString(comment.message),
    createdAt: asString(comment.createdAt),
  };
}

export const fetchEventComments = async (eventId: string): Promise<EventComment[]> => {
  try {
    const commentsRaw = await apiJson<EventCommentRaw[]>(
      `/events/${encodeURIComponent(eventId)}/comments`
    );
    return commentsRaw.map(mapEventComment);
  } catch {
    return [];
  }
};

export const addEventComment = async (
  eventId: string,
  payload: {
    authorName: string;
    authorEmail: string;
    message: string;
  }
): Promise<EventComment> => {
  const commentRaw = await apiJson<EventCommentRaw>(
    `/events/${encodeURIComponent(eventId)}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return mapEventComment(commentRaw);
};

// ==================== NOTIFICATION ENDPOINTS ====================

type NotificationRaw = {
  id?: unknown;
  userId?: unknown;
  titre?: unknown;
  message?: unknown;
  type?: unknown;
  timestamp?: unknown;
  lu?: unknown;
  relatedEntityType?: unknown;
  relatedEntityId?: unknown;
};

function mapNotification(n: NotificationRaw): Notification {
  const typeMap: Record<string, Notification["type"]> = {
    INFO: "system",
    SUCCESS: "system",
    WARNING: "system",
    ERROR: "system",
    PROJECT: "project",
    PROJECT_JOIN_REQUEST: "project",
    EVENT: "event",
    TASK: "task",
  };

  return {
    id: asString(n.id),
    userId: asString(n.userId),
    type: typeMap[asString(n.relatedEntityType || n.type)] || "system",
    titre: asString(n.titre),
    message: asString(n.message),
    date: asString(n.timestamp),
    lu: Boolean(n.lu),
    relatedEntityType: asString(n.relatedEntityType),
    relatedEntityId: asString(n.relatedEntityId),
  };
}

function sortNotificationsDesc(notifications: Notification[]): Notification[] {
  return [...notifications].sort((left, right) => {
    const leftTime = new Date(left.date).getTime();
    const rightTime = new Date(right.date).getTime();
    return rightTime - leftTime;
  });
}

export const fetchNotifications = async (emailOverride?: string): Promise<Notification[]> => {
  const email = emailOverride || getAuthEmail();
  if (!email) return [];

  try {
    const notificationsRaw = await apiJson<NotificationRaw[]>(
      `/notifications/user/${encodeURIComponent(email)}`
    );
    return sortNotificationsDesc(notificationsRaw.map(mapNotification));
  } catch {
    return [];
  }
};

export const fetchNotificationsForUsers = async (userIds: string[]): Promise<Notification[]> => {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return [];

  const results = await Promise.all(uniqueIds.map((id) => fetchNotifications(id)));
  const merged = new Map<string, Notification>();
  results.flat().forEach((notification) => {
    merged.set(notification.id, notification);
  });

  return sortNotificationsDesc(Array.from(merged.values()));
};

export const fetchUnreadNotifications = async (emailOverride?: string): Promise<Notification[]> => {
  const email = emailOverride || getAuthEmail();
  if (!email) return [];

  try {
    const notificationsRaw = await apiJson<NotificationRaw[]>(
      `/notifications/user/${encodeURIComponent(email)}/unread`
    );
    return sortNotificationsDesc(notificationsRaw.map(mapNotification));
  } catch {
    return [];
  }
};

export const getUnreadNotificationCount = async (emailOverride?: string): Promise<number> => {
  const email = emailOverride || getAuthEmail();
  if (!email) return 0;

  try {
    const result = await apiJson<{ count: number }>(
      `/notifications/user/${encodeURIComponent(email)}/unread/count`
    );
    return result.count || 0;
  } catch {
    return 0;
  }
};

// FIX: PATCH /notifications/{id}/read returns 204 — safe with updated apiJson.
export const markNotificationAsRead = async (id: string): Promise<void> => {
  await apiJson<void>(`/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
};

// FIX: PATCH /notifications/user/{email}/read-all returns 204 — safe with updated apiJson.
export const markAllNotificationsAsRead = async (emailOverride?: string): Promise<void> => {
  const email = emailOverride || getAuthEmail();
  if (!email) return;

  await apiJson<void>(`/notifications/user/${encodeURIComponent(email)}/read-all`, {
    method: "PATCH",
  });
};

// FIX: DELETE /notifications/{id} returns 204 — safe with updated apiJson.
export const deleteNotification = async (id: string): Promise<void> => {
  await apiJson<void>(`/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

export const createNotification = async (notificationData: {
  userId?: string;
  titre: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  relatedEntityType?: string;
  relatedEntityId?: string;
}): Promise<Notification> => {
  const resolvedUserId = notificationData.userId || getAuthEmail();
  if (!resolvedUserId) {
    throw new Error("Missing user email for notification");
  }

  const notificationRaw = await apiJson<NotificationRaw>(`/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...notificationData,
      userId: resolvedUserId,
    }),
  });
  return mapNotification(notificationRaw);
};

// ==================== RECOMMENDATION ENDPOINTS ====================

type RecommendationRaw = {
  id?: unknown;
  userId?: unknown;
  projetId?: unknown;
  eventId?: unknown;
  recommendationType?: unknown;
  titre?: unknown;
  categorie?: unknown;
  competenceMatch?: unknown;
  explication?: unknown;
  dateRecommendation?: unknown;
  competencesMatched?: unknown;
};

function mapRecommendation(r: RecommendationRaw): Recommendation {
  const recommendationType = asString(r.recommendationType);
  const eventId = asString(r.eventId);

  return {
    id: asString(r.id),
    projetId: asString(r.projetId),
    eventId,
    recommendationType: (recommendationType || (eventId ? "EVENT" : "PROJECT")) as Recommendation["recommendationType"],
    titre: asString(r.titre),
    categorie: asString(r.categorie),
    competenceMatch: asNumber(r.competenceMatch),
    explication: asString(r.explication),
    competences: Array.isArray(r.competencesMatched)
      ? (r.competencesMatched as unknown[]).map(asString)
      : [],
  };
}

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  const recommendationsRaw = await apiJson<RecommendationRaw[]>(
    `/recommendations/user/${encodeURIComponent(email)}`
  );
  return recommendationsRaw.map(mapRecommendation);
};

export const refreshRecommendations = async (): Promise<Recommendation[]> => {
  const email = getAuthEmail();
  if (!email) return [];

  const recommendationsRaw = await apiJson<RecommendationRaw[]>(
    `/recommendations/user/${encodeURIComponent(email)}/refresh`,
    { method: "POST" }
  );
  return recommendationsRaw.map(mapRecommendation);
};

// FIX: DELETE /recommendations/{id} returns 204 — safe with updated apiJson.
export const deleteRecommendation = async (id: string): Promise<void> => {
  await apiJson<void>(`/recommendations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
};

// ==================== LIST ENDPOINTS ====================

const LOCAL_COMPETENCES = [
  "Java",
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Angular",
  "Vue.js",
  "Spring Boot",
  "Node.js",
  "Django",
  "Machine Learning",
  "Data Science",
  "Data Analysis",
  "DevOps",
  "Cloud Computing",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Microservices",
  "REST API",
  "GraphQL",
  "Git",
  "Agile",
  "Scrum",
  "UI/UX Design",
  "Mobile Development",
  "Android",
  "iOS",
  "Flutter",
  "React Native",
  "Cybersecurity",
  "Blockchain",
  "IoT",
  "AI/ML",
  "Big Data",
] as const;

const LOCAL_FACULTES = [
  "Faculté des Sciences de Tunis",
  "Faculté des Sciences Économiques et de Gestion de Tunis",
  "Faculté de Médecine de Tunis",
  "Faculté de Droit et des Sciences Politiques de Tunis",
  "École Nationale d'Ingénieurs de Tunis",
  "Institut Supérieur de Gestion de Tunis",
  "École Supérieure des Sciences et Techniques de Tunis",
  "Institut Préparatoire aux Études d'Ingénieurs",
  "Faculté des Lettres et des Sciences Humaines de Tunis",
  "École Nationale des Sciences de l'Informatique",
  "Institut Supérieur d'Informatique",
  "Faculté des Sciences Juridiques, Politiques et Sociales de Tunis",
] as const;

const LOCAL_SPECIALITES: Record<string, string[]> = {
  "Faculté des Sciences de Tunis": [
    "Informatique",
    "Mathématiques",
    "Physique",
    "Chimie",
    "Biologie",
    "Géologie",
  ],
  "Faculté des Sciences Économiques et de Gestion de Tunis": [
    "Gestion",
    "Finance",
    "Comptabilité",
    "Marketing",
    "Économie",
  ],
  "Faculté de Médecine de Tunis": [
    "Médecine générale",
    "Pharmacie",
    "Sciences infirmières",
  ],
  "Faculté de Droit et des Sciences Politiques de Tunis": [
    "Droit privé",
    "Droit public",
    "Sciences politiques",
  ],
  "École Nationale d'Ingénieurs de Tunis": [
    "Génie informatique",
    "Génie civil",
    "Génie électrique",
    "Génie industriel",
    "Génie mécanique",
  ],
  "Institut Supérieur de Gestion de Tunis": [
    "Management",
    "Business Intelligence",
    "Finance",
    "Marketing digital",
  ],
  "École Supérieure des Sciences et Techniques de Tunis": [
    "Technologies de l'information",
    "Télécommunications",
    "Électronique",
    "Automatique",
  ],
  "Institut Préparatoire aux Études d'Ingénieurs": [
    "Mathématiques-Physique",
    "Physique-Chimie",
    "Technologie",
  ],
  "Faculté des Lettres et des Sciences Humaines de Tunis": [
    "Langues",
    "Littérature",
    "Histoire",
    "Philosophie",
    "Sociologie",
  ],
  "École Nationale des Sciences de l'Informatique": [
    "Génie logiciel",
    "Intelligence artificielle",
    "Réseaux et sécurité",
    "Systèmes d'information",
    "Data Science",
  ],
  "Institut Supérieur d'Informatique": [
    "Développement logiciel",
    "Systèmes embarqués",
    "Réseaux informatiques",
    "Multimédia",
  ],
  "Faculté des Sciences Juridiques, Politiques et Sociales de Tunis": [
    "Droit",
    "Relations internationales",
    "Sciences sociales",
  ],
};

export const fetchCompetences = async (): Promise<string[]> => {
  return [...LOCAL_COMPETENCES];
};

export const fetchFacultes = async (): Promise<string[]> => {
  return [...LOCAL_FACULTES];
};

export const fetchSpecialites = async (): Promise<Record<string, string[]>> => {
  return Object.fromEntries(
    Object.entries(LOCAL_SPECIALITES).map(([faculte, specialites]) => [faculte, [...specialites]])
  );
};
