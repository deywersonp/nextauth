import { createContext, ReactNode, useState } from "react";
import Router from 'next/router';
import { api } from "../services/api";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};

type SignInCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  user: User | undefined;
  isAuthenticated: boolean;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post('sessions', {
        email,
        password,
      });

      const { token, refreshToken, permissions, roles } = response.data;

      //sessionStorage = ao fechar o navegador os dados serão perdidos
      //localStorage = no next é ruim pois a nossa interface é construída server side e no server side não temos acesso ao objeto window (seria necessário uma adaptação para funcionar)
      //cookies = é por este motivo que os cookies são mais utilizados no next. Pode ser acessado tanto pelo browser quando pelo servidor 

      setUser({
        email,
        permissions,
        roles,
      });

      Router.push('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        isAuthenticated,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
};