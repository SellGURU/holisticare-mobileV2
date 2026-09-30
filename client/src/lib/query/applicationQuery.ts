export async function applicationData<T>(
  request: Promise<{ data: T }>,
): Promise<T> {
  const response = await request;
  return response.data;
}
