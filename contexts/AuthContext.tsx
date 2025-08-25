"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getUserByUsername,
  getUserByEmail,
  type UserWithPin,
  addUser,
  verifyCode,
} from "@/utils/storage";
import { doLogin, doLogout } from "@/app/api/auth/action";

type User = {
  id: string;
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, pin: string) => Promise<void>;
  loginWithEmail: (email: string, verificationCode: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    }

    return null;
  });
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Initialize default users if they don't exist
    // const users = getUserByUsername("admin")
    // if (!users) {
    //   const defaultUsers: UserWithPin[] = [
    //     { id: "1", username: "admin", role: "admin", pin: "1234" },
    //     { id: "2", username: "manager", role: "manager", pin: "5678" },
    //     { id: "3", username: "user", role: "user", pin: "9012" },
    //   ]
    //   defaultUsers.forEach((user) => addUser(user))
    // }
  }, []);

  const login = async (username: string, pin: string) => {
    const user = await doLogin({ email: username, pin, password: "" });

    if (user && user.pin === pin) {
      const loggedInUser: User = {
        id: user.id.toString(),
        username: user.email,
        role: user.role,
      };
      setUser(loggedInUser);

      localStorage.setItem("user", JSON.stringify(loggedInUser));
      router.push("/");
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const loginWithEmail = async (email: string, verificationCode: string) => {
    if (verifyCode(email, verificationCode)) {
      const user = getUserByEmail(email);
      if (user) {
        const loggedInUser: User = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        router.push("/");
      } else {
        throw new Error("User not found");
      }
    } else {
      throw new Error("Invalid verification code");
    }
  };

  const logout = async () => {
    localStorage.removeItem("user");
    setUser(null);
    await doLogout();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
