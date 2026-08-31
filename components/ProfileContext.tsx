'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface ProfileOption {
  id: string;
  label: string;
  subtitle: string;
  role: string;
  type: 'self' | 'child';
  childId?: string;
}

interface ProfileContextType {
  activeProfile: ProfileOption | null;
  setActiveProfile: (profile: ProfileOption | null) => void;
  availableProfiles: ProfileOption[];
  setAvailableProfiles: (profiles: ProfileOption[]) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<ProfileOption | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<ProfileOption[]>([]);

  return (
    <ProfileContext.Provider 
      value={{ activeProfile, setActiveProfile, availableProfiles, setAvailableProfiles }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile musí být použit v rámci ProfileProvideru');
  }
  return context;
}