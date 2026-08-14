export const convertLogoToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  export const capitalizeWords = (str: string='') => {
  return str
    .replace(/_/g, " ") 
    .split(" ")          
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) 
    .join(" ");          
};

export const getUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;

  return JSON.parse(userStr);
};
export const getSessionStorageData = (key: string) => {
  const stored = sessionStorage.getItem(key);
  return stored ? JSON.parse(stored) : null;
};

/**
 * Generate a short unique code derived from a name/label.
 * Takes initials from the name and appends random chars for uniqueness.
 * e.g. "Front Desk Team" → "FDT-3X7K", "Housekeeping" → "H-9NP2"
 * @param name - Source name to derive initials from.
 * @param randomLength - Number of random suffix characters (default 4).
 */
export const generateCode = (
  name: string,
  randomLength = 4,
): string => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase())
    .filter(Boolean)
    .join("");
  const prefix = initials || "CODE";
  const suffix = Array.from({ length: randomLength }, () =>
    charset.charAt(Math.floor(Math.random() * charset.length)),
  ).join("");
  return `${prefix}-${suffix}`;
};
