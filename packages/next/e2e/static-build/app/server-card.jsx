// A Server Component: its module never reaches the client bundle.
export default function ServerCard() {
  return <section className="w:123px">Server only</section>
}
