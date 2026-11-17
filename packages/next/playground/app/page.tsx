export default function Home() {
  return (
    <main className="min-h:100vh p:2.5rem bg:surface-base fg:strong font:sans">
      <section className="max-w:720px mx:auto">
        <p className="text:14px fg:primary mb:0.5rem">Next.js static CSS</p>
        <h1 className="font:48px font:heavy tracking:tight">StetCSS generated at build time</h1>
        <p className="font:20px line-height:1.5 mt:1rem fg:slate">
          The CSS for this page is generated from the project files when Next.js compiles the stylesheet entry.
        </p>
        <a className="inline-flex align-items:center h:44px px:1.25rem mt:1.5rem bg:black fg:white r:6px text:14px font:semibold" href="https://github.com/0Miles/StetCSS">
          Open StetCSS
        </a>
      </section>
    </main>
  )
}
