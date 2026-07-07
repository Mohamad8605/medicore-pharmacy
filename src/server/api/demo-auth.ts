import { createServerFn } from "@tanstack/react-start";

interface DemoUser {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  roles: string[];
  phone?: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "demo-admin-0000-0000-0000-000000000001",
    email: "admin@medicore.com",
    password: "Admin123!",
    first_name: "Sarah",
    last_name: "Müller",
    roles: ["admin"],
  },
  {
    id: "demo-patient-0000-0000-0000-000000000002",
    email: "patient@medicore.com",
    password: "Patient123!",
    first_name: "Anna",
    last_name: "Svensson",
    roles: ["patient"],
    phone: "+46 70 123 45 67",
  },
  {
    id: "demo-pharmacist-0000-0000-0000-000000000003",
    email: "pharmacist@medicore.com",
    password: "Pharmacist123!",
    first_name: "Erik",
    last_name: "Johansson",
    roles: ["pharmacist"],
    phone: "+46 72 345 67 89",
  },
];

export const demoSignIn = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { email, password } = ctx.data as unknown as { email: string; password: string };
  const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (!user) {
    return {
      failure: {
        kind: "invalid_password" as const,
        message: "Incorrect email or password. Please try again.",
        logMessage: `demo auth failed for: ${email}`,
      },
    };
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
      },
      aud: "authenticated",
      role: "authenticated",
      created_at: new Date().toISOString(),
    },
    roles: user.roles,
    demo: true,
  };
});

export type DemoSignInResult = Awaited<ReturnType<typeof demoSignIn>>;
