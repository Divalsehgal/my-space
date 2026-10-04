// CSS Modules, as compiled by the consuming Next.js app.
declare module "*.module.scss" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
