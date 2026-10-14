export type ReviewTestCase = {
  name: string;
  diff: string;
  expectFinding: boolean;
  expectedKeywords?: string[];
};

export const reviewCases: ReviewTestCase[] = [
  {
    name: "hardcoded password logged to console",
    diff: `diff --git a/src/auth.ts b/src/auth.ts
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -1,3 +1,5 @@
 export function login() {
+  const password = "admin123";
+  console.log(password);
+  authenticate(password);
 }`,
    expectFinding: true,
    expectedKeywords: ["password"],
  },
  {
    name: "null dereference",
    diff: `diff --git a/src/user.ts b/src/user.ts
--- a/src/user.ts
+++ b/src/user.ts
@@ -1,3 +1,6 @@
 type User = { name: string } | null;

 function getUserName(user: User): string {
+  if (user === null) {
+    return user.name;
+  }
   return user.name;
 }`,
    expectFinding: true,
    expectedKeywords: ["user"],
  },
  {
    name: "safe multiplication",
    diff: `diff --git a/src/math.ts b/src/math.ts
--- a/src/math.ts
+++ b/src/math.ts
@@ -1,3 +1,3 @@
export function multiply(a: number, b: number) {
+  return a * b;
  }`,
    expectFinding: false,
  },
];
