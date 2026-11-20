import styles from './page.module.css'
import sassStyles from './page.module.scss'

export default function Page() {
  return (
    <main>
      <div id="qa" className={styles.qa}>Theme variable</div>
      <div className="dark">
        <div id="mode" className={styles.mode}>Dark mode variable</div>
        <div id="sass-dark" className={sassStyles['qa-sass']}>Sass dark-only variable</div>
      </div>
    </main>
  )
}
