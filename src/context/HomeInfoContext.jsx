import { createContext, useContext, useState, useEffect } from "react";
import getHomeInfo from "../utils/getHomeInfo.utils.js";

const CACHE_KEY = "homeInfoCache";
const HomeInfoContext = createContext();

export const HomeInfoProvider = ({ children }) => {
  const [homeInfo, setHomeInfo] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    try {
      const parsed = JSON.parse(cached);
      return parsed?.data ?? null;
    } catch {
      return null;
    }
  });

  const [homeInfoLoading, setHomeInfoLoading] = useState(() => !localStorage.getItem(CACHE_KEY));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHomeInfo = async () => {
      if (!homeInfo) setHomeInfoLoading(true);

      try {
        const data = await getHomeInfo(); 
        if (!cancelled) {
          if (data) setHomeInfo(data);
          else setError(new Error("No results found"));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error fetching home info:", err);
          setError(err);
        }
      } finally {
        if (!cancelled) setHomeInfoLoading(false);
      }
    };

    fetchHomeInfo();

    const onStorage = (e) => {
      if (e.key !== CACHE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : null;
        setHomeInfo(parsed?.data ?? null);
      } catch {
        // ignore parse errors
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []); 

  return (
    <HomeInfoContext.Provider value={{ homeInfo, homeInfoLoading, error }}>
      {children}
    </HomeInfoContext.Provider>
  );
};

export const useHomeInfo = () => useContext(HomeInfoContext);
