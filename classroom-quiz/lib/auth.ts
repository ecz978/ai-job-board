import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students",
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: { scope: SCOPES.join(" "), prompt: "consent" },
      },
    }),
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
