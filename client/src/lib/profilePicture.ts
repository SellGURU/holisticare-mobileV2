export function isUsableProfilePicture(
  value?: string | null,
): value is string {
  if (!value || typeof value !== "string") return false;
  const picture = value.trim();
  if (!picture || picture === "-" || picture === "null") return false;
  return (
    picture.startsWith("data:image/") ||
    picture.startsWith("https://") ||
    picture.startsWith("http://")
  );
}
