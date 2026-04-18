export async function registerProfile(serverUrl, profile, signature) {
  const res = await fetch(`${serverUrl}/api/v1/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile, signature }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Registration failed");
  return data;
}
