export function ThemeInitScript() {
  const script = `
    (function () {
      try {
        var stored = localStorage.getItem("theme") || "dark";
        var effective = stored;
        if (stored === "system") {
          effective = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(effective);
      } catch (e) {
        document.documentElement.classList.add("dark");
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
