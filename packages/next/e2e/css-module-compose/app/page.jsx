import styles from './page.module.css'

export default function Page() {
  return (
    <main>
      <div id="qa" className={styles.qa}>Theme variable</div>
      <div className="dark">
        <div id="mode" className={styles.mode}>Dark mode variable</div>
      </div>
    </main>
  )
}
