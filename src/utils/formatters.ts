export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "active":
      return "processing";
    case "waiting":
      return "default";
    case "delayed":
      return "warning";
    case "paused":
      return "purple";
    case "waiting-children":
      return "cyan";
    case "unknown":
      return "grey";
    case "error":
      return "magenta"; // Kendi 'error' durumumuz için (örn: fetch hatası)
    default:
      return "default";
  }
};

export const formatTimestamp = (timestamp: number | undefined | null): string => {
  // Sadece null veya undefined durumlarında "N/A" döndür
  if (timestamp === null || typeof timestamp === "undefined") {
    return "N/A";
  }
  // 0 (1 Ocak 1970) geçerli bir tarih olduğu için formatlanmalı
  return new Date(timestamp).toLocaleString();
};
