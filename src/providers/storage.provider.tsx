import { Storage } from '@spotter-app/core';
import React, { FC, useRef } from 'react';
import { useApi } from './api.provider';
import {
 SPOTIFY_CLIENT_ID,
 SPOTIFY_REDIRECT_URI,
 SPOTIFY_CLIENT_SECRET,
} from '@env';

const STORAGE_KEY = 'STORAGE';

type Context = {
  getStorage: (plugin?: string) => Promise<Storage>;
  patchStorage: (data: Partial<Storage>) => void;
  setStorage: (data: Storage) => void;
};

const TOKENS: {[key: string]: any} = {
  ['DEV_PLUGIN']: {
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
    redirectUri: SPOTIFY_REDIRECT_URI,
  }
};

const context: Context = {
  getStorage: () => Promise.resolve({}),
  patchStorage: () => null,
  setStorage: () => null,
}

export const StorageContext = React.createContext<Context>(context);

export const StorageProvider: FC<{}> = (props) => {

  const { storage } = useApi();

  const cachedStorage = useRef<Storage>();

  const getStorage = async (plugin?: string): Promise<Storage> => {
    const tokens = plugin ? { tokens: TOKENS[plugin] } : {};

    if (cachedStorage.current) {
      return {
        ...(plugin
          ? (cachedStorage.current[plugin] ?? {})
          : cachedStorage.current
        ),
        ...tokens,
      };
    }

    const currentStorage = await storage.getItem<Storage>(STORAGE_KEY);
    if (!currentStorage) {
      return tokens;
    }

    cachedStorage.current = currentStorage;
    return {
      ...(plugin
        ? (currentStorage[plugin] ?? {})
        : currentStorage
      ),
      ...tokens,
    };
  }

  const setStorage = async (data: Storage) => {
    const storage = await getStorage();

    const updatedStorage = Object.keys(data).reduce((acc, key) => {
      return {
        ...acc,
        [key]: data[key],
      }
    }, storage);

    cachedStorage.current = updatedStorage;
    storage.setItem(STORAGE_KEY, updatedStorage);
  }

  const patchStorage = async (data: Storage) => {
    const currentStorage = await getStorage();
    const updatedStorage = {
      ...currentStorage,
      ...data,
    };

    cachedStorage.current = updatedStorage;
    storage.setItem(STORAGE_KEY, updatedStorage);
  }

  return (
    <StorageContext.Provider value={{
      getStorage,
      patchStorage,
      setStorage,
    }}>
      {props.children}
    </StorageContext.Provider>
  );
};

export const useStorage = () => React.useContext(StorageContext);
