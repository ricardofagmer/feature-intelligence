// TypeScript 6 checks side-effect imports by default, and Next only ships
// declarations for *.module.css; the global stylesheet import needs this.
declare module "*.css";
