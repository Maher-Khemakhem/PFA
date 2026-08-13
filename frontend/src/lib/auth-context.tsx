/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { UserRole } from "./types";
import { fetchUserByEmail, login as loginRequest, registerUser } from "./api";

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  token: string | null;
}

interface SignUpStudentPayload {
  email: string;
  password: string;
  name: string;
  faculte?: string;
  specialite?: string;
  idUniversitaire?: string;
  competences?: string[];
  avatar?: string;
}

interface SignUpOrganizationPayload {
  email: string;
  password: string;
  name: string;
  organizationType?: string;
  responsableNom?: string;
  responsableEmail?: string;
  responsableTelephone?: string;
  sponsors?: string[];
  logo?: string;
}

interface AuthContextType extends AuthState {
  signIn: (
    email: string,
    password: string,
    expectedRole?: UserRole,
  ) => Promise<UserRole>;
  signUpStudent: (payload: SignUpStudentPayload) => Promise<void>;
  signUpOrganization: (payload: SignUpOrganizationPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storageKeys = {
  token: "auth_token",
  email: "auth_email",
  name: "auth_name",
  role: "auth_role",
} as const;

function getInitialAuthState(): AuthState {
  const token = localStorage.getItem(storageKeys.token);
  const userEmail = localStorage.getItem(storageKeys.email) || "";
  const userName = localStorage.getItem(storageKeys.name) || "";
  const role = localStorage.getItem(storageKeys.role) as UserRole | null;

  if (!token) {
    return {
      isAuthenticated: false,
      userRole: "student",
      userName: "",
      userEmail: "",
      token: null,
    };
  }

  return {
    isAuthenticated: true,
    token,
    userEmail,
    userName,
    userRole: role || "student",
  };
}

function roleFromServer(role?: string): UserRole {
  const r = (role || "").toUpperCase();
  if (r === "ADMIN") return "admin";
  if (r === "ORGANISATION") return "organization";
  if (r === "INDIVIDU") return "student";
  return "student";
}

function setStoredAuth(
  next: Pick<AuthState, "token" | "userEmail" | "userName" | "userRole">,
) {
  if (next.token) localStorage.setItem(storageKeys.token, next.token);
  localStorage.setItem(storageKeys.email, next.userEmail);
  localStorage.setItem(storageKeys.name, next.userName);
  localStorage.setItem(storageKeys.role, next.userRole);
}

function clearStoredAuth() {
  localStorage.removeItem(storageKeys.token);
  localStorage.removeItem(storageKeys.email);
  localStorage.removeItem(storageKeys.name);
  localStorage.removeItem(storageKeys.role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(getInitialAuthState);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.userEmail) return;

    let cancelled = false;

    (async () => {
      try {
        const userJson = await fetchUserByEmail(auth.userEmail);
        const resolvedEmail =
          typeof userJson.email === "string" ? userJson.email : auth.userEmail;
        const resolvedName =
          typeof userJson.name === "string" ? userJson.name : resolvedEmail;
        const resolvedRole =
          typeof userJson.role === "string" ? userJson.role : "";
        const mappedRole = roleFromServer(resolvedRole);

        if (cancelled) return;

        setStoredAuth({
          token: auth.token,
          userEmail: resolvedEmail,
          userName: resolvedName,
          userRole: mappedRole,
        });

        setAuth((prev) => ({
          ...prev,
          userEmail: resolvedEmail,
          userName: resolvedName,
          userRole: mappedRole,
        }));
      } catch {
        // Keep stored auth if refresh fails (e.g., gateway down).
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated, auth.userEmail, auth.token]);

  const signIn = async (
    email: string,
    password: string,
    expectedRole?: UserRole,
  ) => {
    const loginJson = await loginRequest(email, password);

    // Store minimal auth first so refreshes work even if the profile call fails.
    const fallbackRole = expectedRole || "student";
    setStoredAuth({
      token: loginJson.token,
      userEmail: email,
      userName: email,
      userRole: fallbackRole,
    });
    setAuth({
      isAuthenticated: true,
      token: loginJson.token,
      userEmail: email,
      userName: email,
      userRole: fallbackRole,
    });

    // Fetch user details (role/name) from backend.
    const userJson = await fetchUserByEmail(email);

    const resolvedEmail =
      typeof userJson.email === "string" ? userJson.email : email;
    const resolvedName =
      typeof userJson.name === "string" ? userJson.name : resolvedEmail;
    const resolvedRole = typeof userJson.role === "string" ? userJson.role : "";
    const mappedRole = roleFromServer(resolvedRole);

    if (expectedRole && mappedRole !== expectedRole) {
      clearStoredAuth();
      setAuth({
        isAuthenticated: false,
        userRole: "student",
        userName: "",
        userEmail: "",
        token: null,
      });
      throw new Error("ROLE_MISMATCH");
    }

    setStoredAuth({
      token: loginJson.token,
      userEmail: resolvedEmail,
      userName: resolvedName,
      userRole: mappedRole,
    });

    setAuth({
      isAuthenticated: true,
      token: loginJson.token,
      userEmail: resolvedEmail,
      userName: resolvedName,
      userRole: mappedRole,
    });

    return mappedRole;
  };

  const signUpStudent = async (payload: SignUpStudentPayload) => {
    await registerUser({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      role: "INDIVIDU",
      faculte: payload.faculte,
      specialite: payload.specialite,
      idUniversitaire: payload.idUniversitaire,
      competences: payload.competences,
      avatar: payload.avatar,
    });

    // After register, login so the rest of the app can access /projets endpoints.
    await signIn(payload.email, payload.password, "student");
  };

  const signUpOrganization = async (payload: SignUpOrganizationPayload) => {
    await registerUser({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      role: "ORGANISATION",
      organizationType: payload.organizationType,
      responsableNom: payload.responsableNom,
      responsableEmail: payload.responsableEmail,
      responsableTelephone: payload.responsableTelephone,
      sponsors: payload.sponsors,
      logo: payload.logo,
    });

    await signIn(payload.email, payload.password, "organization");
  };

  const logout = () => {
    clearStoredAuth();
    setAuth({
      isAuthenticated: false,
      userRole: "student",
      userName: "",
      userEmail: "",
      token: null,
    });
  };

  const value = { ...auth, signIn, signUpStudent, signUpOrganization, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
