import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isPlatformOwner: user.isPlatformOwner,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.isPlatformOwner = user.isPlatformOwner === true;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.isPlatformOwner = token.isPlatformOwner === true;
      }
      return session;
    },
  },
});
