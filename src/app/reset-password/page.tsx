import ResetPasswordForm from "./Form";

export const dynamic = "force-dynamic";

type SearchParams = { token?: string | string[] };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] ?? "" : raw ?? "";
  return <ResetPasswordForm token={token} />;
}
