export default function Home() {
  return (
    <main className="min-h:100vh p:10x bg:surface-base fg:strong font:sans">
      <section className="max-w:720px mx:auto">
        <p className="text:14px fg:primary mb:2x">Next.js static CSS</p>
        <h1 className="font:48px font:heavy tracking:tight">StetCSS generated at build time</h1>
        <p className="font:20px line-height:1.5 mt:4x fg:slate">
          The CSS for this page is generated from the project files when Next.js compiles the stylesheet entry.
        </p>
        <a className="inline-flex align-items:center h:44px px:5x mt:6x bg:black fg:white r:6px text:14px font:semibold" href="https://github.com/0Miles/StetCSS">
          Open StetCSS
        </a>
      </section>
    </main>
  )
}
