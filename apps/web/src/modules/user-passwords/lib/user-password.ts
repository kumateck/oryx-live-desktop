/** Address of the page where the password administrator sets another user's password. */
export const userPasswordsPath = "/settings/user-passwords";

/** Audit headers sent with every request from this page. */
export const audit = { module: "Settings", subModule: "Change User Password" } as const;
