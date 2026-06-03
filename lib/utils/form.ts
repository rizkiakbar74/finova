export function formDataToObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export function firstZodError(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }) {
  const fields = error.flatten().fieldErrors;
  const first = Object.values(fields).flat().find(Boolean);
  return first || "Invalid form input.";
}
