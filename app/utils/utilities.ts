const parseImages = (imagesData: unknown): string[] => {
  if (Array.isArray(imagesData)) return imagesData.map(String);
  if (typeof imagesData === "string") {
    try {
      const parsed = JSON.parse(imagesData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export { parseImages };
