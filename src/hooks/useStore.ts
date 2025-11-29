import { useStoreContext } from '../context/StoreContext';

export const useStore = () => {
  return useStoreContext();
};

