declare namespace chrome {
  namespace storage {
    interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }

    interface StorageArea {
      get(keys?: string | string[] | object | null): Promise<{ [key: string]: any }>;
      set(items: object): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    const local: StorageArea;
    const sync: StorageArea;

    const onChanged: {
      addListener(callback: (changes: { [key: string]: StorageChange }) => void): void;
      removeListener(callback: (changes: { [key: string]: StorageChange }) => void): void;
    };
  }
} 