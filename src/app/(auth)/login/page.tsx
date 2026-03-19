import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">GORA</h1>
        <p className="text-muted-foreground mt-1">Sistema de Gestión Turística</p>
      </div>
      <LoginForm />
    </div>
  );
}
