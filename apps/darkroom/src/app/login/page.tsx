import { redirect } from "next/navigation";

export default function LoginPage() {
  // Darkroom doesn't have its own login — redirect to SM
  redirect("https://sm.macalister.nz/login?redirect=darkroom");
}
