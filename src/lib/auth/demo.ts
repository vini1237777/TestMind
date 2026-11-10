// One shared account that anyone can open from the home page without a password.
// Everyone in it sees the same projects, so it can add and generate but not edit or delete.
export const demoEmail = () => (process.env.DEMO_EMAIL || "admin@gmail.com").trim().toLowerCase();

export const DEMO_LOCKED_ERROR = "The demo account cannot edit or delete. Create your own account to do that.";
