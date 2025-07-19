// client/src/hooks/useAlert.js
import { useContext } from 'react';
import { AlertContext } from '../contexts/AlertContext';

export const useAlert = () => {
  return useContext(AlertContext);
};