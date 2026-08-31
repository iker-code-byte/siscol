import React, { createContext, useContext, useState, useEffect } from 'react';
import { GuardianMe } from '../types';
import { api } from '../services/api';

interface GuardianContextType {
  guardianData: GuardianMe | null;
  deviceToken: string | null;
  isLoading: boolean;
  pushEnabled: boolean;
  activateDevice: (code: string, deviceName?: string) => Promise<any>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<void>;
  unlinkDevice: () => Promise<void>;
  refreshGuardianData: () => Promise<void>;
}

const GuardianContext = createContext<GuardianContextType | undefined>(undefined);

export const GuardianProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guardianData, setGuardianData] = useState<GuardianMe | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(localStorage.getItem('guardian_device_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  const refreshGuardianData = async () => {
    const token = localStorage.getItem('guardian_device_token');
    if (token) {
      try {
        const data = await api.getGuardianMe();
        setGuardianData(data);
        setPushEnabled(data.push_enabled);
      } catch (e) {
        localStorage.removeItem('guardian_device_token');
        setGuardianData(null);
        setDeviceToken(null);
      }
    }
  };

  useEffect(() => {
    const initGuardian = async () => {
      const token = localStorage.getItem('guardian_device_token');
      if (token) {
        await refreshGuardianData();
      }
      setIsLoading(false);
    };

    initGuardian();
  }, []);

  const activateDevice = async (code: string, deviceName?: string) => {
    const platform = /iPhone|iPad|iPod/.test(navigator.userAgent)
      ? 'IOS_PWA'
      : /Android/.test(navigator.userAgent)
      ? 'ANDROID_PWA'
      : 'WEB';

    const resp = await api.verifyGuardianCode({
      code,
      device_name: deviceName || 'Mi Dispositivo',
      platform,
    });

    localStorage.setItem('guardian_device_token', resp.device_token);
    setDeviceToken(resp.device_token);
    await refreshGuardianData();
    return resp;
  };

  const enablePushNotifications = async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        alert('Este navegador no soporta notificaciones Web Push.');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Se requiere conceder permiso de notificaciones para recibir alertas.');
        return false;
      }

      // Obtain ServiceWorkerRegistration if available
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.ready;
      }

      // Generate or retrieve FCM Web Push token from Firebase JS SDK
      const { requestFcmWebToken } = await import('../services/firebase');
      const fcmToken = await requestFcmWebToken(swRegistration);

      // Register with backend
      const resp = await api.registerPushSubscription({
        token: fcmToken,
        provider: 'FCM',
        platform: 'WEB',
      });

      setPushEnabled(resp.push_enabled);
      if (guardianData) {
        setGuardianData({ ...guardianData, push_enabled: true });
      }
      return true;
    } catch (err: any) {
      alert(`Error al registrar notificaciones: ${err.message}`);
      return false;
    }
  };

  const disablePushNotifications = async () => {
    try {
      await api.deletePushSubscription();
      setPushEnabled(false);
      if (guardianData) {
        setGuardianData({ ...guardianData, push_enabled: false });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unlinkDevice = async () => {
    try {
      await api.unlinkGuardianDevice();
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('guardian_device_token');
      setDeviceToken(null);
      setGuardianData(null);
      setPushEnabled(false);
    }
  };

  return (
    <GuardianContext.Provider
      value={{
        guardianData,
        deviceToken,
        isLoading,
        pushEnabled,
        activateDevice,
        enablePushNotifications,
        disablePushNotifications,
        unlinkDevice,
        refreshGuardianData,
      }}
    >
      {children}
    </GuardianContext.Provider>
  );
};

export const useGuardian = () => {
  const context = useContext(GuardianContext);
  if (!context) {
    throw new Error('useGuardian must be used within a GuardianProvider');
  }
  return context;
};
