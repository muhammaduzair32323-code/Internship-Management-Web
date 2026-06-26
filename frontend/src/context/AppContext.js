import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <AppContext.Provider value={{ interns, setInterns, loading, setLoading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);